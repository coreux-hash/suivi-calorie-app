/* Extracted from legacy-engine-compute.js — wireEvents + initApp */

let phase6LastFocusedBeforeModal = null;
const phase6ManagedModalIds = [
  'pilotagePlanModal',
  'appUnderstandingModal',
  'termsGateModal',
  'settingsCloudModal',
  'settingsHelpModal',
  'settingsTutoModal'
];
const phase6ModalFocusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function phase6GetFocusableInModal(modal){
  if (!modal) return [];
  return Array.from(modal.querySelectorAll(phase6ModalFocusableSelector))
    .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
}

function phase6RefreshModalScrollLock(){
  const hasOpenManagedModal = phase6ManagedModalIds.some(id => $(id)?.classList.contains('is-open'));
  document.body?.classList.toggle('phase6ModalLock', hasOpenManagedModal);
}

function phase6FocusModal(modal){
  if (!modal) return;
  const target = phase6GetFocusableInModal(modal)[0] || modal.querySelector('[role="dialog"]') || modal;
  try{ target.focus({ preventScroll:true }); }catch(e){ try{ target.focus(); }catch(err){} }
}

function phase6ToggleModal(id, open){
  const modal = $(id);
  if (!modal) return;
  const wantsOpen = !!open;
  const wasOpen = modal.classList.contains('is-open');

  if (wantsOpen && !wasOpen) {
    phase6LastFocusedBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  modal.classList.toggle('is-open', wantsOpen);
  modal.setAttribute('aria-hidden', wantsOpen ? 'false' : 'true');
  phase6RefreshModalScrollLock();

  if (wantsOpen) {
    window.setTimeout(() => phase6FocusModal(modal), 0);
    return;
  }

  if (wasOpen && phase6LastFocusedBeforeModal && document.contains(phase6LastFocusedBeforeModal)) {
    const focusTarget = phase6LastFocusedBeforeModal;
    phase6LastFocusedBeforeModal = null;
    window.setTimeout(() => {
      try{ focusTarget.focus({ preventScroll:true }); }catch(e){ try{ focusTarget.focus(); }catch(err){} }
    }, 0);
  }
}

function phase6GetTopOpenModal(){
  const openModals = Array.from(document.querySelectorAll('.modal.is-open'));
  return openModals.length ? openModals[openModals.length - 1] : null;
}

function phase6CloseTopModal(){
  const modal = phase6GetTopOpenModal();
  if (!modal) return false;
  if (modal.id === 'pilotagePlanModal') closePilotagePlanModal();
  else if (modal.id === 'appUnderstandingModal') closeAppUnderstandingModal();
  else if (modal.id === 'termsGateModal') closeTermsGateModal();
  else if (modal.id === 'settingsCloudModal') closeSettingsCloudModal();
  else if (modal.id === 'settingsHelpModal') closeSettingsHelpModal();
  else if (modal.id === 'settingsTutoModal') closeSettingsTutoModal();
  else if (modal.id === 'watchInfoModal' && typeof closeWatchInfoModal === 'function') closeWatchInfoModal();
  else {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    phase6RefreshModalScrollLock();
  }
  return true;
}

function phase6TrapModalFocus(e){
  if (e.key !== 'Tab') return;
  const modal = phase6GetTopOpenModal();
  if (!modal) return;
  const focusable = phase6GetFocusableInModal(modal);
  const panel = modal.querySelector('[role="dialog"]') || modal;
  if (!focusable.length) {
    e.preventDefault();
    try{ panel.focus({ preventScroll:true }); }catch(err){ try{ panel.focus(); }catch(ignore){} }
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openPilotagePlanModal(){
  const modal = $('pilotagePlanModal');
  const panel = modal?.querySelector('[role="dialog"]');
  if (panel) panel.scrollTop = 0;
  phase6ToggleModal('pilotagePlanModal', true);
}
function closePilotagePlanModal(){ phase6ToggleModal('pilotagePlanModal', false); }
function openAppUnderstandingModal(){
  const panel = $('appUnderstandingModal')?.querySelector('[role="dialog"]');
  if (panel) panel.scrollTop = 0;
  phase6ToggleModal('appUnderstandingModal', true);
}
function closeAppUnderstandingModal(){ phase6ToggleModal('appUnderstandingModal', false); }
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

function phase6ResolveFieldValue(key, options = {}){
  const stored = phase6GetActiveSettingsPayload();
  if (options.storedOnly) return stored?.[key];
  const el = $(key);
  const domValue = el?.type === 'checkbox' ? !!el.checked : el?.value;
  return domValue != null && String(domValue).trim() !== '' ? domValue : stored?.[key];
}

function phase6GetValidCompromiseIds(){
  try{
    const applyMap = window.__CompromiseUI?.getApplyMap?.();
    if (applyMap && typeof applyMap === 'object') return Object.keys(applyMap);
  }catch(e){}
  return Array.from($('compromiseSelect')?.options || [])
    .map(option => String(option.value || ''))
    .filter(value => value && value !== '__create_custom__');
}

function phase6CollectConfigurationInput(options = {}){
  const storedCompromiseId = phase6ResolveFieldValue('compromiseId', { storedOnly:true });
  const compromiseSelect = $('compromiseSelect');
  const compromiseId = options.storedOnly
    ? storedCompromiseId
    : (compromiseSelect ? compromiseSelect.value : storedCompromiseId);
  return {
    sex:phase6ResolveFieldValue('sex', options),
    age:phase6ResolveFieldValue('age', options),
    height:phase6ResolveFieldValue('height', options),
    weight:phase6ResolveFieldValue('weight', options),
    watchBrand:phase6ResolveFieldValue('watchBrand', options),
    montre:phase6ResolveFieldValue('montre', options),
    dietMode:phase6ResolveFieldValue('dietMode', options),
    compromiseId:compromiseId || '',
    validCompromiseIds:phase6GetValidCompromiseIds()
  };
}

function phase6GetSetupState(options = {}){
  const stateApi = window.__SCAStateNavigation;
  if (!stateApi?.computeConfigurationState) {
    throw new Error('[State] computeConfigurationState is unavailable.');
  }
  return stateApi.computeConfigurationState(phase6CollectConfigurationInput(options));
}

function phase6HasUsableProfile(options = {}){
  return !!phase6GetSetupState(options).complete;
}

function phase6GetUnlockTarget(){
  return phase6GetSetupState().initialDestination;
}

function phase6GetInitialEntryTarget(){
  return phase6GetSetupState().initialDestination;
}

function phase6SyncSetupNudgeUi(options = {}){
  const setup = options.setup || phase6GetSetupState();
  const quickNav = document.querySelector('.phase2HeroQuickNav--settings');
  if (quickNav) quickNav.setAttribute('data-setup-state', setup.key);
  try{ document.body?.setAttribute('data-setup-state', setup.key); }catch(e){}
  return setup;
}
function phase6SyncSettingsAccessUi(){
  const accepted = !!(typeof isTermsAccepted === 'function' && isTermsAccepted());
  const setup = phase6GetSetupState();
  const frame = { ready:setup.configurationComplete, sections:setup.sections };
  const profile = frame.sections.find(section => section.key === 'profile');
  const watch = frame.sections.find(section => section.key === 'watch');
  const goals = frame.sections.find(section => section.key === 'goals');
  const compromise = frame.sections.find(section => section.key === 'compromise');
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
  const quickCompromise = document.querySelector('.phase2HeroQuickNav__btn--settings[data-settings-jump="compromise"]');
  const quickProfileLabel = $('settingsQuickStatusProfile');
  const quickWatchLabel = $('settingsQuickStatusWatch');
  const quickGoalsLabel = $('settingsQuickStatusGoals');
  const quickCompromiseLabel = $('settingsQuickStatusCompromise');

  const missingSections = frame.sections.filter(section => !section.ready).map(section => section.label);
  const missingText = missingSections.length ? missingSections.join(', ') : '';
  const lockedTitle = 'Application verrouillée';
  const unlockedTitle = 'Application déverrouillée';
  const lockedMeta = "Les espaces restent inactifs tant que les conditions d’accès ne sont pas lues et acceptées.";
  const unlockedMeta = "Les conditions d’accès ont déjà été acceptées sur cet appareil.";

  if (state) state.textContent = accepted ? 'Déverrouillée' : 'Verrouillée';
  if (meta) meta.textContent = accepted
    ? (frame.ready
        ? 'Conditions acceptées. Configuration et compromis sont prêts : entrée sur Pilotage.'
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
  if (quickCompromise) quickCompromise.setAttribute('data-ready', compromise.ready ? 'ready' : 'missing');
  if (quickProfileLabel) quickProfileLabel.innerHTML = profile.ready
    ? 'Base + préférences · <strong>prêt</strong>'
    : `Base + préférences · ${profile.completeCount}/${profile.totalCount} requis`;
  if (quickWatchLabel) quickWatchLabel.innerHTML = watch.ready
    ? 'Dépense + calories · <strong>prêt</strong>'
    : `Dépense + calories · ${watch.completeCount}/${watch.totalCount} requis`;
  if (quickGoalsLabel) quickGoalsLabel.innerHTML = goals.ready
    ? 'Preset + cible · <strong>prêt</strong>'
    : 'Preset + cible · preset requis';
  if (quickCompromiseLabel) quickCompromiseLabel.innerHTML = compromise.ready
    ? 'Choix nutritionnel · <strong>prêt</strong>'
    : 'Choix nutritionnel · requis';
  phase6SyncSetupNudgeUi({ setup });
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
  const navigationRegistry = window.__SCAStateNavigation;

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

  function phase6GetNavigationContext(){
    return {
      useMode:$('useMode')?.value || document.body?.dataset?.usemode || 'simple',
      diabEnabled:!!$('diabEnabled')?.checked
    };
  }

  function phase6ResolveRegisteredTarget(entry){
    for (const selector of (entry?.targetSelectors || [])) {
      const target = document.querySelector(selector);
      if (target && !target.classList.contains('hidden')) return target;
    }
    return null;
  }

  function phase6NavigateRegisteredEntry(entry, event, options = {}){
    if (!entry || !navigationRegistry?.isNavigationEntryAvailable(entry, phase6GetNavigationContext())) return false;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const finish = () => {
      const target = phase6ResolveRegisteredTarget(entry);
      if (target) phase6ScrollToSettingsPanel(target);
      options.setActive?.(entry.key);
      options.closeFloat?.(false);
    };
    if (entry.crossSpace || entry.destinationSpace !== entry.sourceSpace) {
      openTab(entry.destinationSpace, { delay:0, source:`registry:${entry.sourceSpace}:${entry.key}` });
      window.setTimeout(finish, Number.isFinite(options.delay) ? options.delay : 80);
    } else {
      finish();
    }
    return true;
  }

  function phase6BindRegisteredNavigation(sourceSpace, options = {}){
    navigationRegistry?.getNavigationEntries(sourceSpace).forEach(entry => {
      const includeControls = sourceSpace === 'shared';
      navigationRegistry.getEntrySelectors(entry, { includeControls }).forEach(selector => {
        document.querySelectorAll(selector).forEach(control => {
          if (control.dataset.scaNavigationBound === '1') return;
          control.dataset.scaNavigationBound = '1';
          control.addEventListener('click', event => phase6NavigateRegisteredEntry(entry, event, options));
        });
      });
    });
  }

  function phase6GetTrackedNavigationPanels(sourceSpace){
    return navigationRegistry.getNavigationEntries(sourceSpace)
      .filter(entry => entry.track && !entry.crossSpace)
      .map(entry => ({ key:entry.key, el:phase6ResolveRegisteredTarget(entry) }))
      .filter(item => item.el && !item.el.classList.contains('hidden'));
  }

  window.phase6NavigateRegisteredEntry = (sourceSpace, key, event, options = {}) => {
    const entry = navigationRegistry?.getNavigationEntry(sourceSpace, key);
    return phase6NavigateRegisteredEntry(entry, event, options);
  };

  // Les deux pastilles restent visuellement distinctes et partagent cette
  // destination déclarée : Historique -> Calendrier.
  phase6BindRegisteredNavigation('shared');

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
$("btnHeaderOpenPilotageGuide")?.addEventListener("click", () => { openPilotagePlanModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenPilotagePlan")?.addEventListener("click", () => { openAppUnderstandingModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenTermsGate")?.addEventListener("click", () => { openTermsGateModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenCloudModal")?.addEventListener("click", () => { openSettingsCloudModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenTutoModal")?.addEventListener("click", () => { openSettingsTutoModal(); try{ closeMenu(); }catch(e){} });
$("btnMenuOpenHelpModal")?.addEventListener("click", () => { openSettingsHelpModal(); try{ closeMenu(); }catch(e){} });

  ['sex','age','height','weight','watchBrand','montre','dietMode','compromiseSelect','profileSelect'].forEach(id => {
    $(id)?.addEventListener('change', () => setTimeout(phase6SyncSettingsAccessUi, 30));
    $(id)?.addEventListener('input', () => setTimeout(phase6SyncSettingsAccessUi, 30));
  });
  ['btnCreateProfile','btnDeleteProfile'].forEach(id => {
    $(id)?.addEventListener('click', () => setTimeout(phase6SyncSettingsAccessUi, 80));
  });

function phase6SyncAppbarHeightVar(){
  const appbar = document.querySelector('.appbar');
  const statusbar = $('phase5StatusBar');
  const h = Math.ceil(appbar?.getBoundingClientRect().height || 72);
  const narrow = window.matchMedia ? window.matchMedia('(max-width: 860px)').matches : false;
  const touch = window.matchMedia ? window.matchMedia('(hover: none), (pointer: coarse)').matches : false;
  const dockStatusbar = !!statusbar && narrow && touch;
  document.documentElement.style.setProperty('--appbar-h', h + 'px');
  document.body.classList.toggle('phase5MobileStatusFixed', dockStatusbar);
  const statusH = dockStatusbar ? Math.ceil(statusbar.getBoundingClientRect().height || 0) : 0;
  document.documentElement.style.setProperty('--phase5-statusbar-h', statusH + 'px');
}
window.phase6SyncAppbarHeightVar = phase6SyncAppbarHeightVar;

function phase6GetSettingsShellOffset(){
  let offset = 12;
  const appbar = document.querySelector('.appbar');
  const nav = document.querySelector('.phase1PrimaryNav');
  const statusbar = $('phase5StatusBar');
  if (appbar) offset += Math.ceil(appbar.getBoundingClientRect().height || 0);
  if (document.body.classList.contains('phase5MobileStatusFixed') && statusbar) {
    offset += Math.ceil(statusbar.getBoundingClientRect().height || 0) + 8;
  }
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
  phase6BindRegisteredNavigation('settings', {
    setActive:phase6SetSettingsJumpActive,
    closeFloat:phase6SetSettingsJumpFloatOpen
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

  const panels = phase6GetTrackedNavigationPanels('settings');

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
  phase6BindRegisteredNavigation('today', { closeFloat:phase6SetTodayJumpFloatOpen });

  $('todayJumpFloatToggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const panel = $('todayJumpFloatPanel');
    phase6SetTodayJumpFloatOpen(panel?.hidden !== false);
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
  phase6BindRegisteredNavigation('journalEntry', {
    setActive:phase6SetJournalJumpActive,
    closeFloat:phase6SetJournalJumpFloatOpen
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

  const getPanels = () => phase6GetTrackedNavigationPanels('journalEntry');

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

function phase6BindHistoryJumpNav(){
  phase6SyncAppbarHeightVar();
  phase6SetHistoryJumpFloatOpen(false);
  phase6BindRegisteredNavigation('history', {
    setActive:phase6SetHistoryJumpActive,
    closeFloat:phase6SetHistoryJumpFloatOpen
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

  const getPanels = () => phase6GetTrackedNavigationPanels('history');

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

$("pilotagePlanClose")?.addEventListener("click", closePilotagePlanModal);
$("pilotagePlanFootClose")?.addEventListener("click", closePilotagePlanModal);
$("appUnderstandingClose")?.addEventListener("click", closeAppUnderstandingModal);
$("appUnderstandingFootClose")?.addEventListener("click", closeAppUnderstandingModal);
$("termsGateClose")?.addEventListener("click", closeTermsGateModal);
$("termsGateFootClose")?.addEventListener("click", closeTermsGateModal);
$("settingsCloudClose")?.addEventListener("click", closeSettingsCloudModal);
$("settingsCloudFootClose")?.addEventListener("click", closeSettingsCloudModal);
$("settingsHelpClose")?.addEventListener("click", closeSettingsHelpModal);
$("settingsHelpFootClose")?.addEventListener("click", closeSettingsHelpModal);
$("settingsTutoClose")?.addEventListener("click", closeSettingsTutoModal);
$("settingsTutoFootClose")?.addEventListener("click", closeSettingsTutoModal);
document.querySelector("#pilotagePlanModal .modal__backdrop")?.addEventListener("click", closePilotagePlanModal);
document.querySelector("#appUnderstandingModal .modal__backdrop")?.addEventListener("click", closeAppUnderstandingModal);
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
    // Le mode Rapide dépend du mode d'usage : resynchroniser après application.
    setTimeout(() => mealUI_setMode(mealUI_currentMode()), 0);
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
    phase6TrapModalFocus(e);
    if (e.key !== "Escape") return;
    if (phase6CloseTopModal()) e.preventDefault();
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
  // La dépense (#montre) recalcule automatiquement au changement — remplace
  // l'ancien bouton « Recalculer l'objectif ». Vaut pour l'édition en réglages
  // ET pour l'éditeur de Pilotage (qui déclenche un 'change' sur #montre).
  $("montre")?.addEventListener("change", (event) => {
    const date = (typeof getSelectedDate === 'function') ? getSelectedDate() : ($('dayDate')?.value || '');
    if (event.isTrusted || window.__scaEnergyExplicitCommitDate === date) {
      window.__scaEnergyExplicitCommitDate = date;
    }
    try { recompute(true); }
    catch(_) {}
    finally {
      if (window.__scaEnergyExplicitCommitDate === date) window.__scaEnergyExplicitCommitDate = '';
    }
  });

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
    const pL = $("mealPanelQuickLocked");
    const aRow = document.querySelector(".mealActions");

    if (bM){ bM.classList.toggle("is-active", !isQuick); bM.setAttribute("aria-selected", (!isQuick).toString()); }
    if (bQ){ bQ.classList.toggle("is-active", isQuick);  bQ.setAttribute("aria-selected", (isQuick).toString()); }

    if (pM) pM.classList.toggle("hidden", isQuick);
    // v23 (décision D3, 2026-11-01) : la garde A11 est levée. Le panneau
    // Rapide /100 g est disponible dans tous les modes d'affichage ; l'aperçu
    // verrouillé n'est plus jamais affiché.
    if (pQ) pQ.classList.toggle("hidden", !isQuick);
    if (pL) pL.classList.add("hidden");
    // « Ajouter ce repas » (champs manuels) n'a pas de sens en mode Rapide :
    // le panneau Rapide ajoute déjà via « Calculer & ajouter », et l'aperçu
    // verrouillé n'ajoute rien. On masque donc l'action générique en Rapide.
    if (aRow) aRow.classList.toggle("hidden", isQuick);
  }
  function mealUI_currentMode(){
    return $("mealModeQuick")?.classList.contains("is-active") ? "quick" : "manual";
  }
  $("mealModeManual")?.addEventListener("click", () => mealUI_setMode("manual"));
  $("mealModeQuick")?.addEventListener("click", () => mealUI_setMode("quick"));

  // Action unique en mode /100g : calcule puis ajoute le repas
  $("btnQuickAddMeal")?.addEventListener("click", () => {
    applyPer100ToMeal();
    addMealFromInputs();
  });

  // N°2 — Éditer la dépense énergétique totale du jour depuis Pilotage.
  // Écrit dans #montre (source unique, champ des réglages) puis déclenche le
  // recalcul complet via window.compute : réglages, reste à consommer, charge,
  // compromis — tout s'ajuste comme une édition en réglages. Aucun calcul dupliqué.
  (function initTodaySpendEditor(){
    const edit = document.getElementById("todaySpendEdit");
    if (!edit) return;
    const getMontre = () => document.getElementById("montre");
    let syncing = false;

    const mirror = () => { const m = getMontre(); if (m){ syncing = true; m.value = edit.value; syncing = false; } };
    const commit = () => {
      const m = getMontre(); if (!m) return;
      window.__scaEnergyExplicitCommitDate = (typeof getSelectedDate === 'function') ? getSelectedDate() : (document.getElementById('dayDate')?.value || '');
      syncing = true;
      m.value = edit.value;
      m.dispatchEvent(new Event("input",  { bubbles:true }));
      m.dispatchEvent(new Event("change", { bubbles:true }));
      syncing = false;
      // Le recalcul est déclenché par l'écouteur global sur #montre ('change').
    };
    const pull = () => { if (syncing) return; const m = getMontre(); if (m) edit.value = m.value; };

    edit.addEventListener("input",  mirror);
    edit.addEventListener("change", commit);
    const m0 = getMontre();
    if (m0){ m0.addEventListener("input", pull); m0.addEventListener("change", pull); }
    document.getElementById("dayDate")?.addEventListener("change", () => setTimeout(pull, 60));
    setTimeout(pull, 0);
    setTimeout(pull, 250);
  })();

  // Valeur par défaut : Manuel
  window.__sca_js_build = "A16";
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
  try{ clearSportInputs(); }catch(e){}
  sportUI_setEditor(true);
});
$("btnSportSave")?.addEventListener("click", () => {
  const d = getSelectedDate();
  runSportSleep('addSportSession', d, { closeEditor:true, showPill:true });
});

// Suppression séance (event delegation)
$("sportSessionsList")?.addEventListener("click", (ev) => {
  const editBtn = ev.target?.closest?.("[data-sportedit]");
  if (editBtn){
    const d = getSelectedDate();
    const id = editBtn.getAttribute("data-sportedit") || "";
    try{ editSportSession(d, id); }catch(e){}
    return;
  }
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

  // Transfert manuel entre appareils (presse-papier / fichier)
  $("btnCopyDays")?.addEventListener("click", () => window.copyDaysJson?.());
  $("btnDownloadDays")?.addEventListener("click", () => window.downloadDaysJson?.());
  $("btnImportDaysFile")?.addEventListener("click", () => $("daysJsonFile")?.click());
  $("daysJsonFile")?.addEventListener("change", (ev) => {
    const file = ev.target?.files?.[0];
    if (file) window.importDaysFromFile?.(file);
    if (ev.target) ev.target.value = "";
  });

  // Sauvegarde : signaler la méthode disponible, sans allonger la modale sur mobile.
  // En file://, la synchro par email ne peut pas fonctionner (pas d'origine web).
  (function initBackupBlocksDefault(){
    const isFile = (window.location?.protocol === "file:");
    const transfer = $("syncTransferBlock");
    const account  = $("cloudAccountBlock");
    const hint     = $("cloudAvailabilityHint");
    try {
      // L'indication de disponibilité est toujours posée : elle se lit sans déplier.
      if (hint) hint.textContent = isFile ? " — nécessite http/https" : "";

      // Sur petit écran, tout reste replié : la modale doit tenir sans défilement inutile.
      const roomy = window.matchMedia?.("(min-width: 641px)")?.matches ?? true;
      if (!roomy) {
        if (transfer) transfer.open = false;
        if (account)  account.open  = false;
        return;
      }

      if (isFile) {
        if (transfer) transfer.open = true;
        if (account)  account.open  = false;
      } else {
        if (account)  account.open  = true;
      }
    } catch (_) {}
  })();

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
