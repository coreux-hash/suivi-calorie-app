/* Extracted from legacy-engine-compute.js — wireEvents + initApp */

function phase6ToggleModal(id, open){
  const modal = $(id);
  if (!modal) return;
  modal.classList.toggle('is-open', !!open);
  modal.setAttribute('aria-hidden', open ? 'false' : 'true');
}
function openTermsGateModal(){ phase6ToggleModal('termsGateModal', true); }
function closeTermsGateModal(){ phase6ToggleModal('termsGateModal', false); }
function openSettingsCloudModal(){ phase6ToggleModal('settingsCloudModal', true); }
function closeSettingsCloudModal(){ phase6ToggleModal('settingsCloudModal', false); }
function openSettingsHelpModal(){ phase6ToggleModal('settingsHelpModal', true); }
function closeSettingsHelpModal(){ phase6ToggleModal('settingsHelpModal', false); }
function openSettingsTutoModal(){ phase6ToggleModal('settingsTutoModal', true); }
function closeSettingsTutoModal(){ phase6ToggleModal('settingsTutoModal', false); }

function phase6GetActiveSettingsPayload(){
  try{
    const activeProfile = (typeof getActiveProfile === 'function' && getActiveProfile()) || localStorage.getItem('secheapp.activeProfile.v1') || 'default';
    const raw = localStorage.getItem(`secheapp.${activeProfile}.settings.v2`);
    return raw ? (JSON.parse(raw) || {}) : {};
  }catch(e){
    return {};
  }
}

function phase6ResolveFieldValue(key){
  const stored = phase6GetActiveSettingsPayload();
  const el = $(key);
  const domValue = el?.type === 'checkbox' ? !!el.checked : el?.value;
  return domValue != null && String(domValue).trim() !== '' ? domValue : stored?.[key];
}

function phase6GetProfileReadiness(){
  const fieldMap = [
    { key:'sex', label:'Sexe', ok:(v) => v === 'M' || v === 'F' },
    { key:'age', label:'Âge', ok:(v) => Number(v) > 0 },
    { key:'height', label:'Taille', ok:(v) => Number(v) > 0 },
    { key:'weight', label:'Poids', ok:(v) => Number(v) > 0 }
  ];
  try{
    const fields = fieldMap.map(field => {
      const value = phase6ResolveFieldValue(field.key);
      return {
        key: field.key,
        label: field.label,
        ready: !!field.ok(value),
        value
      };
    });
    const missing = fields.filter(field => !field.ready).map(field => field.label);
    return {
      key:'profile',
      label:'Profils',
      ready: missing.length === 0,
      missing,
      fields,
      completeCount: fields.filter(field => field.ready).length,
      totalCount: fields.length
    };
  }catch(e){
    return {
      key:'profile',
      label:'Profils',
      ready:false,
      missing:['Sexe','Âge','Taille','Poids'],
      fields: fieldMap.map(field => ({ key:field.key, label:field.label, ready:false, value:null })),
      completeCount:0,
      totalCount:fieldMap.length
    };
  }
}

function phase6GetWatchReadiness(){
  const fields = [
    { key:'watchBrand', label:'Marque', ok:(v) => !!String(v || '').trim() },
    { key:'montre', label:'Calories', ok:(v) => Number(v) > 0 }
  ].map(field => {
    const value = phase6ResolveFieldValue(field.key);
    return { key:field.key, label:field.label, ready:!!field.ok(value), value };
  });
  const missing = fields.filter(field => !field.ready).map(field => field.label);
  return {
    key:'watch',
    label:'Montre',
    ready: missing.length === 0,
    missing,
    fields,
    completeCount: fields.filter(field => field.ready).length,
    totalCount: fields.length
  };
}

function phase6GetGoalPresetReadiness(){
  const value = phase6ResolveFieldValue('dietMode');
  const ready = !!String(value || '').trim() && value !== 'none';
  return {
    key:'goals',
    label:'Objectifs',
    ready,
    missing: ready ? [] : ['Preset'],
    fields:[{ key:'dietMode', label:'Preset', ready, value }],
    completeCount: ready ? 1 : 0,
    totalCount:1
  };
}

function phase6GetCalculationFrameReadiness(){
  const profile = phase6GetProfileReadiness();
  const watch = phase6GetWatchReadiness();
  const goals = phase6GetGoalPresetReadiness();
  const sections = [profile, watch, goals];
  return {
    ready: sections.every(section => section.ready),
    sections,
    readyCount: sections.filter(section => section.ready).length,
    totalCount: sections.length
  };
}

function phase6HasUsableProfile(){
  return !!phase6GetCalculationFrameReadiness().ready;
}

function phase6GetUnlockTarget(){
  return phase6HasUsableProfile() ? 'today' : 'settings';
}
function phase6SyncSettingsAccessUi(){
  const accepted = !!(typeof isTermsAccepted === 'function' && isTermsAccepted());
  const frame = phase6GetCalculationFrameReadiness();
  const profile = frame.sections.find(section => section.key === 'profile') || phase6GetProfileReadiness();
  const watch = frame.sections.find(section => section.key === 'watch') || phase6GetWatchReadiness();
  const goals = frame.sections.find(section => section.key === 'goals') || phase6GetGoalPresetReadiness();
  const state = $('settingsAccessState');
  const meta = $('settingsAccessMeta');
  const globalState = $('phase5GateAccessState');
  const globalMeta = $('phase5GateAccessMeta');
  const globalBtn = $('btnGlobalOpenTermsGate');
  const menuBtn = $('btnMenuOpenTermsGate');
  const globalCard = document.querySelector('.phase5GateCard--access');
  const quickProfile = document.querySelector('.phase2HeroQuickNav__btn--settings[data-settings-jump="profile"]');
  const quickWatch = document.querySelector('.phase2HeroQuickNav__btn--settings[data-settings-jump="watch"]');
  const quickGoals = document.querySelector('.phase2HeroQuickNav__btn--settings[data-settings-jump="goals"]');
  const quickProfileLabel = $('settingsQuickStatusProfile');
  const quickWatchLabel = $('settingsQuickStatusWatch');
  const quickGoalsLabel = $('settingsQuickStatusGoals');

  const missingSections = frame.sections.filter(section => !section.ready).map(section => section.label);
  const missingText = missingSections.length ? missingSections.join(', ') : '';
  const lockedTitle = 'Application verrouillée';
  const unlockedTitle = 'Application déverrouillée';
  const lockedMeta = "Les espaces restent inactifs tant que les conditions d’accès ne sont pas lues et acceptées.";
  const unlockedMeta = "Les conditions d’accès ont déjà été acceptées sur cet appareil.";

  if (state) state.textContent = accepted ? 'Déverrouillée' : 'Verrouillée';
  if (meta) meta.textContent = accepted
    ? (frame.ready
        ? 'Conditions acceptées. Profil, montre et preset sont prêts : entrée sur Pilotage.'
        : `Conditions acceptées mais cadre incomplet : complète ${missingText} dans Réglages avant l’usage normal.`)
    : "La lecture et l’acceptation des conditions restent requises avant d’entrer dans l’application.";

  if (globalState) globalState.textContent = accepted ? unlockedTitle : lockedTitle;
  if (globalMeta) globalMeta.textContent = accepted ? unlockedMeta : lockedMeta;
  if (globalBtn) globalBtn.textContent = accepted ? 'Relire les conditions' : 'Lire et accepter';
  if (menuBtn) menuBtn.textContent = accepted ? 'Conditions d’accès (relire)' : 'Conditions d’accès';
  if (globalCard) globalCard.setAttribute('data-state', accepted ? 'unlocked' : 'locked');

  if (quickProfile) quickProfile.setAttribute('data-ready', profile.ready ? 'ready' : 'missing');
  if (quickWatch) quickWatch.setAttribute('data-ready', watch.ready ? 'ready' : 'missing');
  if (quickGoals) quickGoals.setAttribute('data-ready', goals.ready ? 'ready' : 'missing');
  if (quickProfileLabel) quickProfileLabel.innerHTML = profile.ready
    ? 'Base + préférences · <strong>prêt</strong>'
    : `Base + préférences · ${profile.completeCount}/${profile.totalCount} requis`;
  if (quickWatchLabel) quickWatchLabel.innerHTML = watch.ready
    ? 'Dépense + calories · <strong>prêt</strong>'
    : `Dépense + calories · ${watch.completeCount}/${watch.totalCount} requis`;
  if (quickGoalsLabel) quickGoalsLabel.innerHTML = goals.ready
    ? 'Preset + cible · <strong>prêt</strong>'
    : 'Preset + cible · preset requis';
}
function phase6MaybeOpenTermsGateOnLockedApp(){
  const accepted = !!(typeof isTermsAccepted === 'function' && isTermsAccepted());
  if (!accepted) openTermsGateModal();
}

function wireEvents(){
  const p6 = window.__Phase6;
  if (!p6) throw new Error('[Phase6.15] __Phase6 must be initialized before wireEvents().');
  const openTab = (tab, options = {}) => {
    return p6.NavigationFacade.openTab(tab, options);
  };
  const recompute = (saveToJournal = true, scrollToResults = false) => {
    return p6.LegacyBridges.recomputeFromWire(saveToJournal, scrollToResults);
  };
  const applyDiabEnabled = () => {
    return p6.LegacyBridges.updateDiabetesVisibility();
  };
  const settingsEntry = p6.SettingsEntryPoints;
  const settingsConsolidation = p6.SettingsConsolidation;
  const domainEntry = p6.DomainOrchestrator;
  const profileEntry = p6.ProfileEntryPoints;
  const sportSleepEntry = p6.SportSleepEntryPoints;

  const requirePhase6 = (groupName, methodName) => {
    return p6.Contracts.require(groupName, methodName);
  };
  const runDomain = (methodName, ...args) => {
    return requirePhase6('DomainOrchestrator', methodName)(...args);
  };
  const runSettings = (methodName, ...args) => {
    return requirePhase6('SettingsEntryPoints', methodName)(...args);
  };
  const runProfile = (methodName, ...args) => {
    return requirePhase6('ProfileEntryPoints', methodName)(...args);
  };
  const runSportSleep = (methodName, ...args) => {
    return requirePhase6('SportSleepEntryPoints', methodName)(...args);
  };

  // CGU
  $("ackTerms")?.addEventListener("change", () => {
    const ok = $("ackTerms").checked;
    setTermsAccepted(ok);
    setAppLocked(!ok);
    phase6SyncSettingsAccessUi();
    if (ok) {
      closeTermsGateModal();
      openTab(phase6GetUnlockTarget(), { delay:0 });
    }
  });

$("btnOpenTermsGate")?.addEventListener("click", openTermsGateModal);
$("btnOpenTermsGateInline")?.addEventListener("click", openTermsGateModal);
$("btnGlobalOpenTermsGate")?.addEventListener("click", openTermsGateModal);
$("btnOpenCloudModal")?.addEventListener("click", openSettingsCloudModal);
$("btnOpenCloudModalInline")?.addEventListener("click", openSettingsCloudModal);
$("btnGlobalOpenCloudModal")?.addEventListener("click", openSettingsCloudModal);
$("btnGlobalOpenHelpModal")?.addEventListener("click", openSettingsHelpModal);
$("btnGlobalOpenTutoModal")?.addEventListener("click", openSettingsTutoModal);
$("btnMenuOpenTermsGate")?.addEventListener("click", () => { openTermsGateModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenCloudModal")?.addEventListener("click", () => { openSettingsCloudModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenTutoModal")?.addEventListener("click", () => { openSettingsTutoModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenHelpModal")?.addEventListener("click", () => { openSettingsHelpModal(); try{ closeMenu(); }catch(e){} });

  ['sex','age','height','weight','watchBrand','montre','dietMode','profileSelect'].forEach(id => {
    $(id)?.addEventListener('change', () => setTimeout(phase6SyncSettingsAccessUi, 30));
    $(id)?.addEventListener('input', () => setTimeout(phase6SyncSettingsAccessUi, 30));
  });
  ['btnCreateProfile','btnDeleteProfile'].forEach(id => {
    $(id)?.addEventListener('click', () => setTimeout(phase6SyncSettingsAccessUi, 80));
  });

function phase6GetSettingsJumpTarget(key){
  const target = key === 'profile'
    ? document.querySelector('.settingsPanel--profile')
    : key === 'watch'
      ? document.querySelector('.settingsPanel--watch')
      : key === 'goals'
        ? document.querySelector('.settingsPanel--goals')
        : null;
  if (!target || target.classList.contains('hidden')) return null;
  return target;
}


function phase6SyncAppbarHeightVar(){
  const appbar = document.querySelector('.appbar');
  const h = Math.ceil(appbar?.getBoundingClientRect().height || 72);
  document.documentElement.style.setProperty('--appbar-h', h + 'px');
}

function phase6GetSettingsShellOffset(){
  let offset = 12;
  const appbar = document.querySelector('.appbar');
  const nav = document.querySelector('.phase1PrimaryNav');
  if (appbar) offset += Math.ceil(appbar.getBoundingClientRect().height || 0);
  if (nav && window.getComputedStyle(nav).display !== 'none') {
    offset += Math.ceil(nav.getBoundingClientRect().height || 0) + 8;
  }
  return offset;
}

function phase6ScrollToSettingsPanel(target){
  if (!target) return;
  const absoluteTop = window.scrollY + target.getBoundingClientRect().top;
  const top = Math.max(0, absoluteTop - phase6GetSettingsShellOffset());
  window.scrollTo({ top, behavior:'smooth' });
  target.classList.remove('phase5TargetFlash');
  void target.offsetWidth;
  target.classList.add('phase5TargetFlash');
}

function phase6SetSettingsJumpActive(key){
  document.querySelectorAll('[data-settings-jump]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-settings-jump') === key);
  });
}

function phase6SetSettingsJumpFloatOpen(isOpen){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="settings"] .phase2SettingsJumpFloat');
  const toggle = $('settingsJumpFloatToggle');
  const panel = $('settingsJumpFloatPanel');
  if (!wrap || !toggle || !panel) return;
  wrap.classList.toggle('is-open', !!isOpen);
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  panel.hidden = !isOpen;
}

function phase6SyncSettingsJumpFloatVisibility(){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="settings"] .phase2SettingsJumpFloat');
  const hero = document.querySelector('.phase2Screen[data-tabsection="settings"] .phase2HeroCard--settings');
  const panel = $('settingsJumpFloatPanel');
  if (!wrap || !hero) return;
  const mobile = window.matchMedia('(max-width: 860px)').matches;
  if (!mobile) {
    wrap.classList.remove('is-visible','is-open');
    if (panel) panel.hidden = true;
    $('settingsJumpFloatToggle')?.setAttribute('aria-expanded', 'false');
    return;
  }
  const appbar = document.querySelector('.appbar');
  const threshold = Math.ceil((appbar?.getBoundingClientRect().height || 0) + 12);
  const heroRect = hero.getBoundingClientRect();
  const shouldShow = heroRect.bottom <= threshold;
  wrap.classList.toggle('is-visible', shouldShow);
  if (!shouldShow) {
    phase6SetSettingsJumpFloatOpen(false);
  }
}

function phase6BindSettingsJumpNav(){
  phase6SyncAppbarHeightVar();
  phase6SetSettingsJumpFloatOpen(false);
  document.querySelectorAll('[data-settings-jump]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.getAttribute('data-settings-jump');
      const target = phase6GetSettingsJumpTarget(key);
      if (!target) return;
      phase6SetSettingsJumpActive(key);
      phase6SetSettingsJumpFloatOpen(false);
      phase6ScrollToSettingsPanel(target);
    });
  });

  $('settingsJumpFloatToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const panel = $('settingsJumpFloatPanel');
    phase6SetSettingsJumpFloatOpen(panel?.hidden !== false);
  });

  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.phase2Screen[data-tabsection="settings"] .phase2SettingsJumpFloat');
    if (!wrap || !wrap.contains(e.target)) phase6SetSettingsJumpFloatOpen(false);
  });

  const panels = [
    { key:'profile', el: document.querySelector('.settingsPanel--profile') },
    { key:'watch', el: document.querySelector('.settingsPanel--watch') },
    { key:'goals', el: document.querySelector('.settingsPanel--goals') },
  ].filter(item => item.el);

  if (!panels.length) return;

  const syncActive = () => {
    const shellOffset = phase6GetSettingsShellOffset();
    let current = panels[0].key;
    for (const item of panels) {
      const rect = item.el.getBoundingClientRect();
      if (rect.top - shellOffset <= 24) current = item.key;
    }
    phase6SetSettingsJumpActive(current);
    phase6SyncSettingsJumpFloatVisibility();
  };

  syncActive();
  phase6SetSettingsJumpFloatOpen(false);
  let rafId = 0;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      syncActive();
      rafId = 0;
    });
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', () => { phase6SyncAppbarHeightVar(); onScroll(); });
}


phase6BindSettingsJumpNav();

function phase6SetTodayJumpFloatOpen(isOpen){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="today"] .phase2SettingsJumpFloat');
  const toggle = $('todayJumpFloatToggle');
  const panel = $('todayJumpFloatPanel');
  if (!wrap || !toggle || !panel) return;
  wrap.classList.toggle('is-open', !!isOpen);
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  panel.hidden = !isOpen;
}

function phase6SyncTodayJumpFloatVisibility(){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="today"] .phase2SettingsJumpFloat');
  const hero = document.querySelector('.phase2Screen[data-tabsection="today"] .phase2HeroCard--today');
  const panel = $('todayJumpFloatPanel');
  if (!wrap || !hero) return;
  const mobile = window.matchMedia('(max-width: 860px)').matches;
  if (!mobile) {
    wrap.classList.remove('is-visible','is-open');
    if (panel) panel.hidden = true;
    $('todayJumpFloatToggle')?.setAttribute('aria-expanded', 'false');
    return;
  }
  const appbar = document.querySelector('.appbar');
  const threshold = Math.ceil((appbar?.getBoundingClientRect().height || 0) + 12);
  const heroRect = hero.getBoundingClientRect();
  const shouldShow = heroRect.bottom <= threshold;
  wrap.classList.toggle('is-visible', shouldShow);
  if (!shouldShow) phase6SetTodayJumpFloatOpen(false);
}

function phase6BindTodayJumpNav(){
  phase6SyncAppbarHeightVar();
  phase6SetTodayJumpFloatOpen(false);

  $('todayJumpFloatToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const panel = $('todayJumpFloatPanel');
    phase6SetTodayJumpFloatOpen(panel?.hidden !== false);
  });

  [
    ['btnTodayQuickMealFloat', 'btnTodayQuickMeal'],
    ['btnTodayQuickSportFloat', 'btnTodayQuickSport'],
    ['btnTodayQuickSleepFloat', 'btnTodayQuickSleep'],
    ['btnTodayQuickSettingsFloat', 'btnTodayQuickSettings'],
  ].forEach(([floatId, baseId]) => {
    $(floatId)?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      phase6SetTodayJumpFloatOpen(false);
      $(baseId)?.click();
    });
  });

  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.phase2Screen[data-tabsection="today"] .phase2SettingsJumpFloat');
    if (!wrap || !wrap.contains(e.target)) phase6SetTodayJumpFloatOpen(false);
  });

  let rafId = 0;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      phase6SyncTodayJumpFloatVisibility();
      rafId = 0;
    });
  };

  phase6SyncTodayJumpFloatVisibility();
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', () => { phase6SyncAppbarHeightVar(); onScroll(); });
}

phase6BindTodayJumpNav();


function phase6GetJournalJumpTarget(key){
  const target = key === 'meals'
    ? document.querySelector('.phase2JournalPanel--meals')
    : key === 'activity'
      ? document.querySelector('.phase2JournalPanel--activity')
      : key === 'sleep'
        ? document.querySelector('.phase2JournalPanel--sleep')
        : key === 'metrics'
          ? document.querySelector('.phase2JournalPanel--metrics')
          : key === 'diabetes'
            ? document.querySelector('.phase2JournalPanel--diabetes')
            : null;
  if (!target || target.classList.contains('hidden')) return null;
  return target;
}

function phase6SetJournalJumpActive(key){
  const activeKey = key || '';
  document.querySelectorAll('[data-journal-jump]').forEach((btn) => {
    btn.classList.toggle('is-active', !!activeKey && btn.getAttribute('data-journal-jump') === activeKey);
  });
}

function phase6SetJournalJumpFloatOpen(isOpen){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="journalEntry"] .phase2SettingsJumpFloat');
  const toggle = $('journalJumpFloatToggle');
  const panel = $('journalJumpFloatPanel');
  if (!wrap || !toggle || !panel) return;
  wrap.classList.toggle('is-open', !!isOpen);
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  panel.hidden = !isOpen;
}

function phase6SyncJournalJumpFloatVisibility(){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="journalEntry"] .phase2SettingsJumpFloat');
  const hero = document.querySelector('.phase2Screen[data-tabsection="journalEntry"] .phase2HeroCard--journal');
  const panel = $('journalJumpFloatPanel');
  if (!wrap || !hero) return;
  const mobile = window.matchMedia('(max-width: 860px)').matches;
  if (!mobile) {
    wrap.classList.remove('is-visible','is-open');
    if (panel) panel.hidden = true;
    $('journalJumpFloatToggle')?.setAttribute('aria-expanded', 'false');
    return;
  }
  const appbar = document.querySelector('.appbar');
  const threshold = Math.ceil((appbar?.getBoundingClientRect().height || 0) + 12);
  const heroRect = hero.getBoundingClientRect();
  const shouldShow = heroRect.bottom <= threshold;
  wrap.classList.toggle('is-visible', shouldShow);
  if (!shouldShow) phase6SetJournalJumpFloatOpen(false);
}

function phase6BindJournalJumpNav(){
  phase6SyncAppbarHeightVar();
  phase6SetJournalJumpFloatOpen(false);

  document.querySelectorAll('[data-journal-jump]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.getAttribute('data-journal-jump');
      const target = phase6GetJournalJumpTarget(key);
      if (!target) return;
      phase6SetJournalJumpActive(key);
      phase6SetJournalJumpFloatOpen(false);
      phase6ScrollToSettingsPanel(target);
    });
  });

  $('journalJumpFloatToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const panel = $('journalJumpFloatPanel');
    phase6SetJournalJumpFloatOpen(panel?.hidden !== false);
  });

  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.phase2Screen[data-tabsection="journalEntry"] .phase2SettingsJumpFloat');
    if (!wrap || !wrap.contains(e.target)) phase6SetJournalJumpFloatOpen(false);
  });

  const getPanels = () => [
    { key:'meals', el: document.querySelector('.phase2JournalPanel--meals') },
    { key:'activity', el: document.querySelector('.phase2JournalPanel--activity') },
    { key:'sleep', el: document.querySelector('.phase2JournalPanel--sleep') },
    { key:'metrics', el: document.querySelector('.phase2JournalPanel--metrics') },
    { key:'diabetes', el: document.querySelector('.phase2JournalPanel--diabetes') },
  ].filter(item => item.el && !item.el.classList.contains('hidden'));

  if (!getPanels().length) return;

  const syncActive = () => {
    const panels = getPanels();
    if (!panels.length) {
      phase6SetJournalJumpActive('');
      phase6SyncJournalJumpFloatVisibility();
      return;
    }
    const shellOffset = phase6GetSettingsShellOffset();
    const hero = document.querySelector('.phase2Screen[data-tabsection="journalEntry"] .phase2HeroCard--journal');
    const appbar = document.querySelector('.appbar');
    const threshold = Math.ceil((appbar?.getBoundingClientRect().height || 0) + 12);
    const heroRect = hero?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > threshold) {
      phase6SetJournalJumpActive('');
      phase6SyncJournalJumpFloatVisibility();
      return;
    }
    let current = panels[0].key;
    for (const item of panels) {
      const rect = item.el.getBoundingClientRect();
      if (rect.top - shellOffset <= 24) current = item.key;
    }
    phase6SetJournalJumpActive(current);
    phase6SyncJournalJumpFloatVisibility();
  };

  syncActive();
  phase6SetJournalJumpFloatOpen(false);
  let rafId = 0;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      syncActive();
      rafId = 0;
    });
  };

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', () => { phase6SyncAppbarHeightVar(); onScroll(); });
}

phase6BindJournalJumpNav();


function phase6GetHistoryJumpTarget(key){
  const target = key === 'calendar'
    ? document.querySelector('#historyMainPanel')
    : key === 'trend'
      ? document.querySelector('#historyTrendPanel')
      : key === 'health'
        ? document.querySelector('#historyHealthPanel')
        : key === 'diab'
          ? document.querySelector('#historyDiabPanel')
          : null;
  if (!target || target.classList.contains('hidden')) return null;
  return target;
}

function phase6SetHistoryJumpActive(key){
  const activeKey = key || '';
  document.querySelectorAll('[data-history-jump]').forEach((btn) => {
    btn.classList.toggle('is-active', !!activeKey && btn.getAttribute('data-history-jump') === activeKey);
  });
}

function phase6SetHistoryJumpFloatOpen(isOpen){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="history"] .phase2SettingsJumpFloat');
  const toggle = $('historyJumpFloatToggle');
  const panel = $('historyJumpFloatPanel');
  if (!wrap || !toggle || !panel) return;
  wrap.classList.toggle('is-open', !!isOpen);
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  panel.hidden = !isOpen;
}

function phase6SyncHistoryJumpFloatVisibility(){
  const wrap = document.querySelector('.phase2Screen[data-tabsection="history"] .phase2SettingsJumpFloat');
  const hero = document.querySelector('.phase2Screen[data-tabsection="history"] .phase2HeroCard--history');
  const panel = $('historyJumpFloatPanel');
  if (!wrap || !hero) return;
  const mobile = window.matchMedia('(max-width: 860px)').matches;
  if (!mobile) {
    wrap.classList.remove('is-visible','is-open');
    if (panel) panel.hidden = true;
    $('historyJumpFloatToggle')?.setAttribute('aria-expanded', 'false');
    return;
  }
  const appbar = document.querySelector('.appbar');
  const threshold = Math.ceil((appbar?.getBoundingClientRect().height || 0) + 12);
  const heroRect = hero.getBoundingClientRect();
  const shouldShow = heroRect.bottom <= threshold;
  wrap.classList.toggle('is-visible', shouldShow);
  if (!shouldShow) phase6SetHistoryJumpFloatOpen(false);
}

function phase6GetHistoryJumpButton(key){
  return key === 'calendar'
    ? $('btnHistoryGoCalendar')
    : key === 'trend'
      ? $('btnHistoryGoTrend')
      : key === 'health'
        ? $('btnHistoryGoHealth')
        : key === 'diab'
          ? $('btnHistoryGoDiab')
          : null;
}

function phase6BindHistoryJumpNav(){
  phase6SyncAppbarHeightVar();
  phase6SetHistoryJumpFloatOpen(false);

  document.querySelectorAll('[data-history-jump]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.getAttribute('data-history-jump');
      const delegate = phase6GetHistoryJumpButton(key);
      if (!delegate || delegate.disabled) return;
      const target = phase6GetHistoryJumpTarget(key);
      phase6SetHistoryJumpActive(key);
      phase6SetHistoryJumpFloatOpen(false);
      if (target && typeof phase6ScrollToSettingsPanel === 'function') {
        phase6ScrollToSettingsPanel(target);
        return;
      }
      delegate.click();
    });
  });

  $('historyJumpFloatToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const panel = $('historyJumpFloatPanel');
    phase6SetHistoryJumpFloatOpen(panel?.hidden !== false);
  });

  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.phase2Screen[data-tabsection="history"] .phase2SettingsJumpFloat');
    if (!wrap || !wrap.contains(e.target)) phase6SetHistoryJumpFloatOpen(false);
  });

  const getPanels = () => [
    { key:'calendar', el: document.querySelector('#historyMainPanel') },
    { key:'trend', el: document.querySelector('#historyTrendPanel') },
    { key:'health', el: document.querySelector('#historyHealthPanel') },
    { key:'diab', el: document.querySelector('#historyDiabPanel') },
  ].filter(item => item.el && !item.el.classList.contains('hidden'));

  const syncActive = () => {
    const panels = getPanels();
    if (!panels.length) {
      phase6SetHistoryJumpActive('');
      phase6SyncHistoryJumpFloatVisibility();
      return;
    }
    const shellOffset = phase6GetSettingsShellOffset();
    const hero = document.querySelector('.phase2Screen[data-tabsection="history"] .phase2HeroCard--history');
    const appbar = document.querySelector('.appbar');
    const threshold = Math.ceil((appbar?.getBoundingClientRect().height || 0) + 12);
    const heroRect = hero?.getBoundingClientRect();
    if (heroRect && heroRect.bottom > threshold) {
      phase6SetHistoryJumpActive('');
      phase6SyncHistoryJumpFloatVisibility();
      return;
    }
    let current = panels[0].key;
    for (const item of panels) {
      const rect = item.el.getBoundingClientRect();
      if (rect.top - shellOffset <= 24) current = item.key;
    }
    phase6SetHistoryJumpActive(current);
    phase6SyncHistoryJumpFloatVisibility();
  };

  syncActive();
  phase6SetHistoryJumpFloatOpen(false);
  let rafId = 0;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      syncActive();
      rafId = 0;
    });
  };

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', () => { phase6SyncAppbarHeightVar(); onScroll(); });
}

phase6BindHistoryJumpNav();

$("termsGateClose")?.addEventListener("click", closeTermsGateModal);
$("termsGateFootClose")?.addEventListener("click", closeTermsGateModal);
$("settingsCloudClose")?.addEventListener("click", closeSettingsCloudModal);
$("settingsCloudFootClose")?.addEventListener("click", closeSettingsCloudModal);
$("settingsHelpClose")?.addEventListener("click", closeSettingsHelpModal);
$("settingsHelpFootClose")?.addEventListener("click", closeSettingsHelpModal);
$("settingsTutoClose")?.addEventListener("click", closeSettingsTutoModal);
$("settingsTutoFootClose")?.addEventListener("click", closeSettingsTutoModal);
document.querySelector("#termsGateModal .modal__backdrop")?.addEventListener("click", closeTermsGateModal);
document.querySelector("#settingsCloudModal .modal__backdrop")?.addEventListener("click", closeSettingsCloudModal);
document.querySelector("#settingsHelpModal .modal__backdrop")?.addEventListener("click", closeSettingsHelpModal);
document.querySelector("#settingsTutoModal .modal__backdrop")?.addEventListener("click", closeSettingsTutoModal);




  $("profileSelect")?.addEventListener("change", (e) => {
    runDomain('handleProfileChange', e.target.value);
  });

  // --- Profils : création / suppression (fix) ---
  $("btnCreateProfile")?.addEventListener("click", () => {
    const name = $("profileName")?.value || "";
    runProfile('createOrActivate', name);
    if ($("profileName")) $("profileName").value = "";
  });
  $("profileName")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("btnCreateProfile")?.click();
    }
  });
  $("btnDeleteProfile")?.addEventListener("click", () => {
    const active = getActiveProfile();
    if (active === "default") {
      runProfile('deleteActive');
      if (typeof isTermsAccepted === 'function' && isTermsAccepted()) {
        openTab(phase6GetUnlockTarget(), { delay:0 });
      }
      return;
    }
    if (confirm("Supprimer cet utilisateur et ses données locales ?")) {
      runProfile('deleteActive');
      if (typeof isTermsAccepted === 'function' && isTermsAccepted()) {
        openTab(phase6GetUnlockTarget(), { delay:0 });
      }
    }
  });

  // --- Diabète : rendre l'option réellement inaccessible si OFF ---
  function updateDiabEnabledUI(){
    const enabled = !!($("diabEnabled")?.checked);

    // 1) Menu & onglet Diabète
    document.querySelectorAll('.menuItem[data-tab="diab"], .tabBtn[data-tab="diab"]').forEach(el=>{
      el.classList.toggle("is-disabled", !enabled);
      el.setAttribute("aria-disabled", String(!enabled));
    });

    // 2) Section Diabète (page) + accordéon historique diabète (journal)
    const diabSec = document.querySelector('.tabSection[data-tabsection="diab"]');
    if (diabSec) diabSec.classList.toggle("hidden", !enabled);

    const diabHist = $("accDiabHistoryFull");
    if (diabHist) diabHist.classList.remove("hidden");

    // 3) Panneau rapide (repas) : UI verrouillée si OFF
    try{ diab_setQuickPanelLocked(!enabled); }catch(e){}

    // 4) Si l'utilisateur est sur l'onglet diabète et désactive → retour journal
    try{
      const activeTab = document.querySelector(".tabSection.is-active")?.dataset?.tabsection || "";
      if (!enabled && activeTab === "diab") {
        openTab("journal", { delay:0, source:'diabetes-disabled-redirect' });
      }
    }catch(e){}
  }
  window.__phase67LegacyDiabUI = updateDiabEnabledUI;
  window.__updateDiabEnabledUI = function(){
    return window.__Phase6.Contracts.require('LegacyBridges', 'updateDiabetesVisibility')();
  };

  $("diabEnabled")?.addEventListener("change", () => {
    runDomain('handleDiabetesToggle');
  });

  // appliquer au démarrage (après loadProfileSettings ci-dessus)
  applyDiabEnabled();

  // --- Sommeil : calcul automatique de la durée à partir coucher/lever ---
  function computeSleepHoursFromTimes(){
    const bed = String($("sleepBed")?.value || "");
    const wake = String($("sleepWake")?.value || "");
    if (!bed || !wake) return;

    const [bh,bm] = bed.split(":").map(n=>parseInt(n,10));
    const [wh,wm] = wake.split(":").map(n=>parseInt(n,10));
    if (![bh,bm,wh,wm].every(n=>Number.isFinite(n))) return;

    let bMin = bh*60 + bm;
    let wMin = wh*60 + wm;
    let diff = wMin - bMin;
    if (diff < 0) diff += 24*60; // nuit qui passe minuit

    const hm = minutesToHM(diff);
    if ($("sleepHh")) $("sleepHh").value = String(hm.h);
    if ($("sleepMm")) $("sleepMm").value = String(hm.m);
    // compat (si d'autres morceaux lisent encore sleepH)
    if ($("sleepH")) $("sleepH").value = String(Math.round((diff/60)*10)/10);
  }
  $("sleepBed")?.addEventListener("change", computeSleepHoursFromTimes);
  $("sleepWake")?.addEventListener("change", computeSleepHoursFromTimes);


  function syncSleepHMToHidden(){
    const mins = hmToMinutes($("sleepHh")?.value, $("sleepMm")?.value);
    if ($("sleepH")) $("sleepH").value = String(Math.round((mins/60)*10)/10);
  }
  $("sleepHh")?.addEventListener("input", syncSleepHMToHidden);
  $("sleepMm")?.addEventListener("input", syncSleepHMToHidden);

  function syncSportHMToHidden(){
    const mins = hmToMinutes($("sportHh")?.value, $("sportMm")?.value);
    if ($("sportMin")) $("sportMin").value = String(mins);
  }
  $("sportHh")?.addEventListener("input", syncSportHMToHidden);
  $("sportMm")?.addEventListener("input", syncSportHMToHidden);



  // Montre
  $("watchBrand")?.addEventListener("change", () => {
    runSettings('handleWatchBrandChange');
  });

  // Régime
  $("dietMode")?.addEventListener("change", () => {
    runSettings('handleDietModeChange');
  });

  // Repères glucidiques — binding local unique
  window.bindCarbUiZoneEvents?.(runSettings);

  $("fatFloorGPerKg")?.addEventListener("input", () => {
    runSettings('handleFatFloorInput');
  });
  $("fatFloorGPerKg")?.addEventListener("change", () => {
    runSettings('handleFatFloorChange');
  });

  // Mode d’usage
  $("useMode")?.addEventListener("change", () => {
    runSettings('handleUseModeChange');
  });

  // Compromis nutritionnel
  $("compromiseSelect")?.addEventListener("change", () => {
    runSettings('handleCompromiseChange');
  });

  // Diabète
  $("diabEnabled")?.addEventListener("change", () => {
    runSettings('handleDiabetesModeMirror');
  });

window.addEventListener("diab:carbs-pushed", (e) => {
  const d = e?.detail?.date || (getSelectedDate?.() || "");
  if (typeof diab_renderDayKpis === "function") diab_renderDayKpis(d);
});


  // Modal montre
  $("watchProfileInfo")?.addEventListener("keydown", (e) => {
    if (!isSportOrExpert()) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    openWatchInfoModal(e.currentTarget.getAttribute("data-modaltext") || "");
  });
  $("watchProfileInfo")?.addEventListener("click", () => {
    if (!isSportOrExpert()) return;
    openWatchInfoModal($("watchProfileInfo").getAttribute("data-modaltext") || "");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeWatchInfoModal();
    closeTermsGateModal();
    closeSettingsCloudModal();
  });
  $("watchInfoClose")?.addEventListener("click", closeWatchInfoModal);
  $("watchInfoOk")?.addEventListener("click", closeWatchInfoModal);
  document.querySelector("#watchInfoModal .modal__backdrop")?.addEventListener("click", closeWatchInfoModal);

  // Preset edit -> custom
  ["goalPct","fatPerKg"].forEach(id => {
    $(id)?.addEventListener("change", () => {
      return runSettings('handlePresetFieldChange', id);
    });
  });

  $("protPerKg")?.addEventListener("change", () => {
    runSettings('handleProtPerKgChange');
  });
  $("ratioCP")?.addEventListener("change", () => {
    runSettings('handleRatioCPChange');
  });

  // Calcul + scroll
  $("calcSpendBtn")?.addEventListener("click", () => recompute(true, true));

  // Repas
  $("btnAddMeal")?.addEventListener("click", addMealFromInputs);
  $("btnClearMeals")?.addEventListener("click", clearMealsForDay);

  // Repas — UI: Manuel vs Rapide /100g (réduit le bruit)
  function mealUI_setMode(mode){
    const isQuick = mode === "quick";
    const bM = $("mealModeManual");
    const bQ = $("mealModeQuick");
    const pM = $("mealPanelManual");
    const pQ = $("mealPanelQuick");

    if (bM){ bM.classList.toggle("is-active", !isQuick); bM.setAttribute("aria-selected", (!isQuick).toString()); }
    if (bQ){ bQ.classList.toggle("is-active", isQuick);  bQ.setAttribute("aria-selected", (isQuick).toString()); }
    if (pM) pM.classList.toggle("hidden", isQuick);
    if (pQ) pQ.classList.toggle("hidden", !isQuick);
  }
  $("mealModeManual")?.addEventListener("click", () => mealUI_setMode("manual"));
  $("mealModeQuick")?.addEventListener("click", () => mealUI_setMode("quick"));

  // Action unique en mode /100g : calcule puis ajoute le repas
  $("btnQuickAddMeal")?.addEventListener("click", () => {
    applyPer100ToMeal();
    addMealFromInputs();
  });

  // Valeur par défaut : Manuel
  mealUI_setMode("manual");
// Sommeil : édition explicite (1 nuit = 1 enregistrement)
$("btnSleepEdit")?.addEventListener("click", () => {
  sleepUI_setEditMode(true);
});
$("btnSleepSave")?.addEventListener("click", () => {
  const d = getSelectedDate();
  runSportSleep('saveSleep', d, { closeEditor:true, showPill:true });
});

// Sport : multi-séances (journal empilable)
$("btnSportAdd")?.addEventListener("click", () => {
  sportUI_setEditor(true);
});
$("btnSportSave")?.addEventListener("click", () => {
  const d = getSelectedDate();
  runSportSleep('addSportSession', d, { closeEditor:true, showPill:true });
});

// Suppression séance (event delegation)
$("sportSessionsList")?.addEventListener("click", (ev) => {
  const btn = ev.target?.closest?.("[data-sportdel]");
  if (!btn) return;
  const d = getSelectedDate();
  const id = btn.getAttribute("data-sportdel") || "";
  runSportSleep('deleteSportSession', d, id, { showPill:true });
});



  // Historique : delete all
  $("btnDeleteDay")?.addEventListener("click", () => {
    const n = loadDays().length;
    if (!n) return;
    if (!confirm(`Supprimer TOUT l’historique (${n} journée(s)) ?`)) return;
    deleteAllDays();
    const d = isoToday();
    if ($("dayDate")) $("dayDate").value = d;
    renderMealsTable(d);
    updateBodyCompUI(d);
    recompute(true);
    phase6CompatRenderHistoryPanels(d);
  });

  $("btnExportDays")?.addEventListener("click", exportDays);
  $("btnImportDays")?.addEventListener("click", importDays);
  $("btnClearDays")?.addEventListener("click", clearDays);

  // Cloud
  $("btnCloudLogin")?.addEventListener("click", () => cloudLoginWithEmail($("cloudEmail")?.value));
  $("btnCloudLogout")?.addEventListener("click", cloudLogout);
  $("btnCloudPull")?.addEventListener("click", cloudPull);
  $("btnCloudPush")?.addEventListener("click", cloudPush);
  $("btnCloudSync")?.addEventListener("click", cloudSync);

  // Date change
  $("dayDate")?.addEventListener("change", () => {
    runDomain('handleDateChange', getSelectedDate());
  });

  // Autosave générique — exclut les champs déjà frontés par des entry points dédiés
  const autoSaveIds = (settingsConsolidation?.getGenericAutoSaveIds?.() || ["sex","age","height","weight","montre","errPct","errMode"]);
  autoSaveIds.forEach(id => $(id)?.addEventListener("change", () => {
    return runSettings('handleAutoSaveChange', id);
  }));

  ["morningWeight","fatPct","musclePct","boneKg"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("change", () => {
      const dateStr = getSelectedDate();
      return runSettings('handleBodyCompChange', dateStr, { fieldId:id });
    });
  });

}

/* =====================================================================
   14) App Init (ordre d’exécution explicite)
   ===================================================================== */
function initApp(){
  const result = window.__Phase6.Contracts.require('InitializationEntryPoints', 'bootApp')({ forceToday:true, source:'initApp-global' });
  setTimeout(() => {
    try{ phase6SyncSettingsAccessUi(); }catch(e){}
    try{ phase6MaybeOpenTermsGateOnLockedApp(); }catch(e){}
  }, 40);
  return result;
}


/* =====================================================================
   PATCH v17.2 — corrections ciblées (sans refonte)
   - Fix mapping carbGoal (UI values) -> internal keys (FAT_FLOORS + steps)
   - Fix repères glucidiques (updateCarbSteps) + plancher lipides
   - Fix rappel rapide (setPositioningCopy) : doublon écrasant
   ===================================================================== */



function phase6PruneJournalCarbGuardExplain(){
  const removeExplain = () => {
    const explain = document.getElementById('carbGuardExplain');
    if (explain) explain.remove();
  };
  removeExplain();
  const mealsSlot = document.getElementById('journalMealsSlot');
  if (!mealsSlot || typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver(() => removeExplain());
  observer.observe(mealsSlot, { childList:true, subtree:true });
}

phase6PruneJournalCarbGuardExplain();
