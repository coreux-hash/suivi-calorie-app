/* =====================================================================
   legacy-cloud-sync.js
   Extracted from legacy HTML during post-extraction consolidation.
   Keeps historical global functions intact while moving cloud/auth sync
   logic out of index.html.
   ===================================================================== */

const CLOUD_SYNC_STORAGE_KEY = 'nutriapp.cloudsync.meta.v1';

function cloudGetRuntimeInfo(){
  return {
    protocol: window.location.protocol || '',
    origin: window.location.origin || '',
    pathname: window.location.pathname || '',
    href: window.location.href || '',
    isFile: window.location.protocol === 'file:',
    isHttp: /^https?:$/i.test(window.location.protocol || '')
  };
}

function cloudGetConfiguredRedirectUrl(){
  const direct = window.__CLOUD_SYNC_REDIRECT_URL || window.CLOUD_SYNC_REDIRECT_URL || '';
  const normalizedDirect = String(direct || '').trim();
  if (normalizedDirect) return normalizedDirect;

  const meta = document.querySelector('meta[name="cloud-sync-redirect-url"]')?.getAttribute('content') || '';
  const normalizedMeta = String(meta || '').trim();
  if (normalizedMeta) return normalizedMeta;

  const info = cloudGetRuntimeInfo();
  if (!info.isHttp) return '';
  return info.origin + info.pathname;
}

function cloudGetSavedMeta(){
  try {
    return JSON.parse(localStorage.getItem(CLOUD_SYNC_STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function cloudSaveMeta(patch = {}){
  const prev = cloudGetSavedMeta();
  const next = { ...prev, ...patch };
  try { localStorage.setItem(CLOUD_SYNC_STORAGE_KEY, JSON.stringify(next)); } catch {}
  return next;
}

function cloudRememberAction(kind, extra = {}){
  return cloudSaveMeta({
    lastAction: kind,
    lastActionAt: new Date().toISOString(),
    ...extra
  });
}

function cloudStatusPrefix(){
  const info = cloudGetRuntimeInfo();
  if (info.isFile) return 'local hors-ligne';
  if (info.isHttp) return info.origin || 'http';
  return info.protocol || 'inconnu';
}

function cloudDescribeAuthEnvironment(){
  const info = cloudGetRuntimeInfo();
  const redirectTo = cloudGetConfiguredRedirectUrl();
  if (info.isFile) {
    return "Mode fichier détecté. Ouvre l'application via http://localhost ou une URL HTTPS pour activer l'email magique.";
  }
  if (!redirectTo) {
    return 'Aucune URL de redirection cloud n’est résolue.';
  }
  return 'URL de redirection cloud : ' + redirectTo;
}

function setCloudStatus(msg){
  const el = $('cloudStatus');
  if (!el) return;
  el.textContent = 'Statut : ' + msg;
}

function setCloudStatusFromState(message, options = {}){
  const info = cloudGetRuntimeInfo();
  const suffixes = [];
  if (options.includeRuntime !== false) suffixes.push(cloudStatusPrefix());
  if (options.includeRedirect) {
    const redirectTo = cloudGetConfiguredRedirectUrl();
    if (redirectTo) suffixes.push('redirect=' + redirectTo);
  }
  if (options.includeHint) suffixes.push(options.includeHint);
  const suffix = suffixes.length ? ' [' + suffixes.join(' · ') + ']' : '';
  setCloudStatus(message + suffix);
}

function cloudMarkReadyState(){
  const info = cloudGetRuntimeInfo();
  if (info.isFile) {
    setCloudStatusFromState('local uniquement. Le cloud requiert une URL web (http/https).', {
      includeHint: 'ouvre via http://localhost ou URL LAN/HTTPS'
    });
    return false;
  }
  if (!supa) {
    setCloudStatusFromState('local uniquement. Supabase non configuré.');
    return false;
  }
  return true;
}

async function cloudRefreshAuthStatus(){
  if (!supa) {
    cloudMarkReadyState();
    return null;
  }
  const user = await cloudGetUser();
  if (user) {
    const meta = cloudGetSavedMeta();
    const lastSync = meta?.lastSyncAt ? 'dernière synchro ' + String(meta.lastSyncAt) : 'aucune synchro cloud encore confirmée';
    setCloudStatusFromState('connecté : ' + (user.email || 'utilisateur') + ' · ' + lastSync, { includeRuntime: true });
    return user;
  }
  cloudMarkReadyState();
  return null;
}

async function handleMagicLinkCallback() {
  if (!supa) return;

  const url = new URL(window.location.href);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') || 'email';
  if (!token_hash) return;

  setCloudStatusFromState('Validation du lien en cours...', { includeRedirect: true });

  const { error } = await supa.auth.verifyOtp({ token_hash, type });
  if (error) {
    setCloudStatusFromState('Lien invalide/expiré : ' + error.message, { includeRedirect: true });
    return;
  }

  cloudRememberAction('magic-link-verified', { lastVerifiedAt: new Date().toISOString() });
  url.searchParams.delete('token_hash');
  url.searchParams.delete('type');
  url.searchParams.delete('next');
  window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + (url.hash || ''));
  await cloudRefreshAuthStatus();
}

async function cloudGetUser(){
  if (!supa) return null;
  const { data, error } = await supa.auth.getUser();
  if (error) return null;
  return data?.user || null;
}

function buildLocalSnapshot(profileId){
  let settings = null;
  try { settings = JSON.parse(localStorage.getItem(settingsKeyFor(profileId)) || 'null'); } catch {}
  let days = [];
  try { days = JSON.parse(localStorage.getItem(daysKeyFor(profileId)) || '[]'); } catch { days = []; }

  return {
    schemaVersion: 1,
    profileId,
    settings: settings || null,
    days: Array.isArray(days) ? days : [],
    updatedAt: new Date().toISOString()
  };
}

function writeSnapshotToLocal(snapshot){
  const profileId = snapshot?.profileId || getActiveProfile() || 'default';
  if (snapshot?.settings) localStorage.setItem(settingsKeyFor(profileId), JSON.stringify(snapshot.settings));
  if (Array.isArray(snapshot?.days)) localStorage.setItem(daysKeyFor(profileId), JSON.stringify(snapshot.days));
}

function mergeSnapshots(localSnap, cloudSnap){
  if (!cloudSnap) return localSnap;
  if (!localSnap) return cloudSnap;

  const out = {
    schemaVersion: 1,
    profileId: localSnap.profileId || cloudSnap.profileId || 'default',
    settings: null,
    days: [],
    updatedAt: new Date().toISOString()
  };

  const lS = localSnap.settings;
  const cS = cloudSnap.settings;
  const lAt = (lS && lS.updatedAt) ? String(lS.updatedAt) : '';
  const cAt = (cS && cS.updatedAt) ? String(cS.updatedAt) : '';
  out.settings = (cAt > lAt) ? cS : lS;

  const lDays = Array.isArray(localSnap.days) ? localSnap.days : [];
  const cDays = Array.isArray(cloudSnap.days) ? cloudSnap.days : [];

  const map = new Map();
  for (const d of lDays) if (d?.date) map.set(d.date, d);
  for (const d of cDays) {
    if (!d?.date) continue;
    const existing = map.get(d.date);
    if (!existing) { map.set(d.date, d); continue; }

    const eAt = String(existing.updatedAt || '');
    const dAt = String(d.updatedAt || '');
    const winner = (dAt > eAt) ? d : existing;
    const loser  = (dAt > eAt) ? existing : d;

    const wm = Array.isArray(winner.meals) ? winner.meals : [];
    const lm = Array.isArray(loser.meals) ? loser.meals : [];
    const mm = new Map();
    for (const m of lm) if (m?.id) mm.set(m.id, m);
    for (const m of wm) if (m?.id) mm.set(m.id, m);
    const mergedMeals = Array.from(mm.values()).sort((a,b)=> String(a.createdAt||'').localeCompare(String(b.createdAt||'')));

    map.set(d.date, { ...winner, meals: mergedMeals, updatedAt: winner.updatedAt || new Date().toISOString() });
  }

  out.days = Array.from(map.values()).sort((a,b)=> String(a.date).localeCompare(String(b.date)));
  return out;
}

async function cloudPull(){
  if (!cloudMarkReadyState()) return;
  const user = await cloudGetUser();
  if (!user) { setCloudStatusFromState('Non connecté. Demande un lien puis valide-le dans ta boîte mail.', { includeRedirect: true }); return; }

  const profileId = getActiveProfile() || 'default';

  const { data, error } = await supa
    .from('cloud_profiles')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) { setCloudStatusFromState('Erreur pull : ' + error.message, { includeRedirect: true }); return; }
  if (!data?.payload) { setCloudStatusFromState('Aucune sauvegarde cloud pour ce profil.', { includeRedirect: true }); return; }

  const localSnap = buildLocalSnapshot(profileId);
  const cloudSnap = data.payload;
  const merged = mergeSnapshots(localSnap, cloudSnap);

  writeSnapshotToLocal(merged);

  cloudRefreshAfterMerge({ dateStr: getSelectedDate() });
  cloudRememberAction('pull', { lastPullAt: new Date().toISOString(), lastSyncAt: new Date().toISOString() });
  setCloudStatusFromState('Pull OK (cloud → local).', { includeRedirect: true });
}

async function cloudPush(){
  if (!cloudMarkReadyState()) return;
  const user = await cloudGetUser();
  if (!user) { setCloudStatusFromState('Non connecté. Demande un lien puis valide-le dans ta boîte mail.', { includeRedirect: true }); return; }

  const profileId = getActiveProfile() || 'default';
  const localSnap = buildLocalSnapshot(profileId);

  const row = {
    user_id: user.id,
    profile_id: profileId,
    payload: localSnap,
    updated_at: new Date().toISOString()
  };

  const { error } = await supa
    .from('cloud_profiles')
    .upsert(row, { onConflict: 'user_id,profile_id' });

  if (error) { setCloudStatusFromState('Erreur push : ' + error.message, { includeRedirect: true }); return; }

  cloudRememberAction('push', { lastPushAt: new Date().toISOString(), lastSyncAt: new Date().toISOString() });
  setCloudStatusFromState('Push OK (local → cloud).', { includeRedirect: true });
}

async function cloudSync(){
  if (!cloudMarkReadyState()) return;
  const user = await cloudGetUser();
  if (!user) { setCloudStatusFromState('Non connecté. Demande un lien puis valide-le dans ta boîte mail.', { includeRedirect: true }); return; }

  const profileId = getActiveProfile() || 'default';

  const { data, error } = await supa
    .from('cloud_profiles')
    .select('payload')
    .eq('user_id', user.id)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) { setCloudStatusFromState('Erreur pull : ' + error.message, { includeRedirect: true }); return; }

  const localSnap = buildLocalSnapshot(profileId);
  const cloudSnap = data?.payload || null;

  const merged = mergeSnapshots(localSnap, cloudSnap);

  writeSnapshotToLocal(merged);

  const row = {
    user_id: user.id,
    profile_id: profileId,
    payload: merged,
    updated_at: new Date().toISOString()
  };

  const { error: pushErr } = await supa
    .from('cloud_profiles')
    .upsert(row, { onConflict: 'user_id,profile_id' });

  if (pushErr) { setCloudStatusFromState('Merge OK mais push KO : ' + pushErr.message, { includeRedirect: true }); return; }

  cloudRefreshAfterMerge({ dateStr: getSelectedDate() });
  cloudRememberAction('sync', { lastSyncAt: new Date().toISOString(), lastPullAt: new Date().toISOString(), lastPushAt: new Date().toISOString() });
  setCloudStatusFromState('Sync OK (Pull → Merge → Push).', { includeRedirect: true });
}

async function cloudLoginWithEmail(email){
  if (!supa) { setCloudStatusFromState('local uniquement. Supabase non configuré.'); return; }

  const e = String(email || '').trim();
  if (!e) { setCloudStatusFromState('Entre un email.'); return; }

  const info = cloudGetRuntimeInfo();
  if (info.isFile) {
    setCloudStatusFromState("Erreur login : l'app est ouverte en file://. Lance-la via http://localhost, une IP LAN ou une URL HTTPS pour activer la synchro.", {
      includeHint: 'file:// interdit pour le magic link'
    });
    return;
  }

  const redirectTo = cloudGetConfiguredRedirectUrl();
  if (!redirectTo) {
    setCloudStatusFromState('Erreur login : aucune URL de redirection cloud n’est résolue.');
    return;
  }

  try {
    const { error } = await supa.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: redirectTo }
    });

    if (error) {
      setCloudStatusFromState('Erreur login : ' + (error.message || 'inconnue'), { includeRedirect: true });
      return;
    }

    cloudRememberAction('login-link-sent', { lastLoginLinkAt: new Date().toISOString(), lastLoginEmail: e, lastRedirectTo: redirectTo });
    setCloudStatusFromState('Lien envoyé. Ouvre l’email sur l’appareil à connecter puis clique le lien.', { includeRedirect: true });
  } catch (err) {
    const msg = String(err?.message || err || '');
    if (/Failed to fetch/i.test(msg)) {
      setCloudStatusFromState('Erreur login : Failed to fetch (réseau/DNS/CORS/extension). Vérifie aussi que Supabase accepte cette Redirect URL.', { includeRedirect: true });
    } else {
      setCloudStatusFromState('Erreur login : ' + msg, { includeRedirect: true });
    }
  }
}

async function cloudLogout(){
  if (!supa) { setCloudStatusFromState('local uniquement. Supabase non configuré.'); return; }
  try {
    await supa.auth.signOut();
    cloudRememberAction('logout', { lastLogoutAt: new Date().toISOString() });
    setCloudStatusFromState('Déconnecté. Les données locales restent sur cet appareil.');
  } catch (err) {
    setCloudStatusFromState('Erreur logout : ' + String(err?.message || err || ''));
  }
}

function cloudInstallAuthObserver(){
  if (!supa || window.__nutriCloudAuthObserverInstalled) return;
  window.__nutriCloudAuthObserverInstalled = true;
  try {
    supa.auth.onAuthStateChange((_event, _session) => {
      setTimeout(() => { cloudRefreshAuthStatus(); }, 0);
    });
  } catch {}
}

cloudInstallAuthObserver();
