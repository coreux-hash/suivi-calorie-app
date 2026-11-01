/* Mobile daily surface. It ports existing DOM nodes only: data, persistence and calculation stay legacy-owned. */
(function mobileDailySurface(global, doc){
  'use strict';
  const BREAKPOINT = '(max-width: 860px)';
  const $ = (id) => doc.getElementById(id);
  const qa = (selector) => Array.from(doc.querySelectorAll(selector));
  const media = global.matchMedia(BREAKPOINT);
  let activeView = 'today';
  let syncTimer = null;
  let activeAction = 'spend';
  let previousEssentialCount = null;
  let previousSetupComplete = null;
  let contextObserver = null;
  const mobileSetupPorts = { mode:null, watch:null, errMode:null };

  const SETUP_STEPS = {
    profile: { panel: '.settingsPanel--profile', target: '.settingsPanel--profile' },
    watch: { panel: '.settingsPanel--watch', target: '.settingsPanel--watch' },
    compromise: { panel: '.settingsPanel--goals', target: '#settingsMacrosCard' },
    goals: { panel: '.settingsPanel--goals', target: '#dietMode', targetLabel:true }
  };

  const PORTS = [
    { selector: '.phase1PulseCard--spendEdit', mobile: 'mobileDailySpendSlot', desktop: '.phase1PulseGrid' },
    { selector: '.phase2JournalPanel--meals', mobile: 'mobileDailyMealsSlot', desktop: '.phase2Grid--journal' },
    { selector: '#mealsTableWrap', mobile: 'mobileDailyMealsHistorySlot', desktop: '#mealsTableDesktopSlot' },
    { selector: '.phase2JournalPanel--activity', mobile: 'mobileDailyActivitySlot', desktop: '.phase2Grid--journal' },
    { selector: '.phase2JournalPanel--sleep', mobile: 'mobileDailyMoreSlot', desktop: '.phase2Grid--journal' },
    { selector: '.phase2JournalPanel--metrics', mobile: 'mobileDailyMoreSlot', desktop: '.phase2Grid--journal' },
    { selector: '.phase2JournalPanel--diabetes', mobile: 'mobileDailyMoreSlot', desktop: '.phase2Grid--journal' },
    { selector: '#historyMainPanel', mobile: 'mobileDailyHistoryMainSlot', desktop: '.phase2Grid--history .phase2MainCol' },
    { selector: '#playfulTrajectoryPanel', mobile: 'mobileDailyHistoryPlayfulSlot', desktop: '.phase2Screen[data-tabsection="history"]' },
    { selector: '#playfulBadgesPanel', mobile: 'mobileDailyHistoryPlayfulSlot', desktop: '.phase2Screen[data-tabsection="history"]' },
    { selector: '#historyTrendPanel', mobile: 'mobileDailyHistoryMoreSlot', desktop: '.phase2HistoryRail' },
    { selector: '#historyHealthPanel', mobile: 'mobileDailyHistoryMoreSlot', desktop: '.phase2HistoryRail' },
    { selector: '#historyDiabPanel', mobile: 'mobileDailyHistoryMoreSlot', desktop: '.phase2HistoryRail' },
    { selector: '.phase2Grid--settings', mobile: 'mobileDailySettingsSlot', desktop: '.phase2Screen[data-tabsection="settings"]' }
  ];

  function portNodes(isMobile){
    PORTS.forEach((port) => {
      const node = doc.querySelector(port.selector);
      const destination = doc.querySelector(isMobile ? `#${port.mobile}` : port.desktop);
      if (node && destination && node.parentElement !== destination) destination.appendChild(node);
    });
  }

  function moveForMobile(node, destination, portKey){
    if (!node || !destination) return false;
    if (!mobileSetupPorts[portKey]) {
      const marker = doc.createComment(`mobile-setup-${portKey}`);
      node.parentNode?.insertBefore(marker, node);
      mobileSetupPorts[portKey] = marker;
    }
    if (node.parentElement !== destination) destination.appendChild(node);
    return true;
  }

  function restoreFromMobile(node, portKey){
    const marker = mobileSetupPorts[portKey];
    if (!node || !marker?.parentNode) return false;
    marker.parentNode.replaceChild(node, marker);
    mobileSetupPorts[portKey] = null;
    return true;
  }

  function setMobileUseMode(node, value){
    if (!node || node.dataset.mobilePortUseMode != null) return;
    node.dataset.mobilePortUseMode = node.getAttribute('data-um') || '';
    node.setAttribute('data-um', value);
  }

  function restoreMobileUseMode(node){
    if (!node || node.dataset.mobilePortUseMode == null) return;
    const original = node.dataset.mobilePortUseMode;
    if (original) node.setAttribute('data-um', original);
    else node.removeAttribute('data-um');
    delete node.dataset.mobilePortUseMode;
  }

  function portMobileSetupContext(isMobile){
    const modeDetails = $('useMode')?.closest('details.notice');
    const modeBlock = modeDetails?.parentElement;
    const modeSlot = $('mobileSetupModeSlot');
    const watchCard = Array.from(doc.querySelectorAll('.settingsPanel--watch .card')).find((card) => card.querySelector('h2')?.textContent?.trim() === 'Ma dépense du jour (montre)');
    const watchProfile = Array.from(watchCard?.querySelectorAll('[data-um="sport"]') || []).find((node) => /Profil de la montre/.test(node.textContent || ''));
    const watchBrandRow = $('watchBrand')?.closest('.row');
    const errModeField = $('errMode')?.parentElement;
    const errModeRow = $('errMode')?.closest('.row');
    if (isMobile){
      if (moveForMobile(modeBlock, modeSlot, 'mode')) {
        modeBlock.classList.add('mobileSetupModeBlock');
        if (!modeDetails.dataset.mobileSetupInitialOpen) {
          modeDetails.dataset.mobileSetupInitialOpen = modeDetails.open ? '1' : '0';
          modeDetails.open = false;
        }
      }
      if (watchProfile && watchCard && moveForMobile(watchProfile, watchCard, 'watch')) {
        setMobileUseMode(watchProfile, 'sport');
        watchProfile.classList.add('mobileWatchProfile');
        watchCard.classList.add('mobileWatchCard');
        const title = watchCard.querySelector('h2');
        if (title?.nextElementSibling !== watchProfile) title?.insertAdjacentElement('afterend', watchProfile);
      }
      if (errModeField && watchBrandRow && moveForMobile(errModeField, watchBrandRow, 'errMode')) {
        setMobileUseMode(errModeField, 'expert');
        errModeField.classList.add('mobileWatchErrMode');
        errModeRow?.classList.add('mobileWatchEmptyRow');
      }
      return;
    }
    if (modeBlock) {
      if (modeDetails.dataset.mobileSetupInitialOpen) {
        modeDetails.open = modeDetails.dataset.mobileSetupInitialOpen === '1';
        delete modeDetails.dataset.mobileSetupInitialOpen;
      }
      modeBlock.classList.remove('mobileSetupModeBlock');
      restoreFromMobile(modeBlock, 'mode');
    }
    if (watchProfile) {
      restoreMobileUseMode(watchProfile);
      watchProfile.classList.remove('mobileWatchProfile');
      watchCard?.classList.remove('mobileWatchCard');
      restoreFromMobile(watchProfile, 'watch');
    }
    if (errModeField) {
      const sourceRow = mobileSetupPorts.errMode?.parentElement;
      restoreMobileUseMode(errModeField);
      errModeField.classList.remove('mobileWatchErrMode');
      restoreFromMobile(errModeField, 'errMode');
      sourceRow?.classList.remove('mobileWatchEmptyRow');
    }
  }

  /* v23 (D1) : la surface mobile ignore le mode d'affichage Simple/Sportif/Expert
     pour ses cartes de saisie. #sportCard et #sleepCard portent data-um="sport"
     (masqués hors Sportif/Expert par visibility.css) ; on neutralise l'attribut
     pendant le portage mobile et on le restaure au retour desktop. */
  const MOBILE_UNGATED_CARDS = ['sportCard', 'sleepCard'];
  /* Seconde garde legacy : le registre de navigation (phase6SyncShellPanels,
     legacy-shell-observers.js) pose .hidden/aria-hidden sur ces panneaux hors
     mode Sportif. Le mécanisme reste intact ; sur mobile on annule son effet
     sur ces deux panneaux seulement, et on le laisse rejouer au retour desktop. */
  const MOBILE_UNGATED_PANELS = ['.phase2JournalPanel--activity', '.phase2JournalPanel--sleep'];
  let panelGateObserver = null;
  function revealMobilePanel(panel){
    if (!panel) return;
    if (panel.classList.contains('hidden')) panel.classList.remove('hidden');
    if (panel.getAttribute('aria-hidden') === 'true') panel.setAttribute('aria-hidden', 'false');
  }
  function ungateMobileCards(){
    MOBILE_UNGATED_CARDS.forEach((id) => setMobileUseMode($(id), 'mobile'));
    const panels = MOBILE_UNGATED_PANELS.map((selector) => doc.querySelector(selector)).filter(Boolean);
    panels.forEach(revealMobilePanel);
    if (!panelGateObserver && panels.length) {
      panelGateObserver = new MutationObserver((records) => records.forEach((record) => revealMobilePanel(record.target)));
      panels.forEach((panel) => panelGateObserver.observe(panel, { attributes:true, attributeFilter:['class', 'aria-hidden'] }));
    }
  }
  function regateMobileCards(){
    if (panelGateObserver) { panelGateObserver.disconnect(); panelGateObserver = null; }
    MOBILE_UNGATED_CARDS.forEach((id) => restoreMobileUseMode($(id)));
    try { if (typeof global.phase6SyncShellAvailability === 'function') global.phase6SyncShellAvailability(); } catch (_) { }
  }

  /* v23 (D2) : bouton « Confirmer » 1 tap dans la carte Dépense. Il rejoue le
     chemin existant (événement change sur #todaySpendEdit → commit explicite),
     sans nouveau calcul ni nouvelle clé. Créé/retiré avec la surface mobile. */
  function installSpendConfirm(){
    const slot = $('mobileDailySpendSlot');
    if (!slot || $('mobileDailySpendConfirm')) return;
    const button = doc.createElement('button');
    button.type = 'button';
    button.id = 'mobileDailySpendConfirm';
    button.className = 'mobileDailySpendConfirm';
    button.textContent = 'Confirmer cette dépense';
    button.addEventListener('click', () => {
      const edit = $('todaySpendEdit');
      if (!edit) return;
      edit.dispatchEvent(new Event('change', { bubbles:true }));
      queueSync(140);
    });
    slot.appendChild(button);
  }
  function removeSpendConfirm(){ $('mobileDailySpendConfirm')?.remove(); }

  /* v23 : décompte du jour — lecture de #rK (reste à consommer, calculé par le
     moteur legacy) et #eK (déjà consommé). Aucun calcul ici. */
  function syncRemaining(){
    const el = $('mobileDailyRemaining');
    if (!el) return;
    const rest = text('rK');
    const eaten = text('eK');
    if (!rest) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `Reste <strong>${rest} kcal</strong>${eaten ? ` <span>· ${eaten} kcal consommées</span>` : ''}`;
  }

  function text(id){ return $(id)?.textContent?.trim() || ''; }
  function activeDay(){
    const date = $('dayDate')?.value;
    try { return typeof global.getDay === 'function' ? global.getDay(date) : null; } catch (_) { return null; }
  }
  function hasSpend(){ return activeDay()?.energyExplicit === true; }
  function missions(){
    try { return global.__PlayfulTracking?.missionsDuJour?.(activeDay() || {}) || []; } catch (_) { return []; }
  }
  function hasMission(key){ return missions().some((mission) => mission.key === key && mission.done); }
  function hasMeals(){ return hasMission('meals'); }
  /* v23 (D4) : l'essentiel « Activité » ne compte qu'une séance réellement saisie.
     La mission playful « activity » vaut aussi pour une simple dépense montre
     (hasSpend || hasSport) — sémantique des badges, pas celle d'un geste du jour. */
  function hasActivity(){
    const day = activeDay() || {};
    const sessions = Array.isArray(day.sportSessions) ? day.sportSessions : [];
    const sport = day.sport || {};
    return sessions.length > 0 || Number(sport.minutes) > 0 || Number(sport.kcal) > 0;
  }

  /* Optional cues never participate in the 3 essentials.  The panels themselves
     remain legacy-owned; this only controls their mobile visibility and adds
     presentational hooks to the real diabetes controls. */
  function syncOptionalPanels(){
    const diabetesPanel = doc.querySelector('.phase2JournalPanel--diabetes');
    const diabetesEnabled = $('diabEnabled')?.checked === true;
    if (diabetesPanel) diabetesPanel.hidden = !diabetesEnabled;

    const contextCard = $('diab_dayActivity')?.closest('.card');
    const glucoseCard = $('diab_gValue')?.closest('.card');
    contextCard?.classList.add('mobileDailyDiabetesContext');
    glucoseCard?.classList.add('mobileDailyDiabetesGlucose');
    $('diab_dayActivity')?.closest('.row')?.classList.add('mobileDailyDiabetesContextMain');
    $('diab_daySick')?.closest('.row')?.classList.add('mobileDailyDiabetesContextMore');
    $('diab_gValue')?.closest('.row')?.classList.add('mobileDailyDiabetesGlucoseFields');
    $('diab_gNote')?.closest('.row')?.classList.add('mobileDailyDiabetesGlucoseNote');
  }

  function installMobileTruncationHints(){
    qa('.phase2HistoryPanel--trend .accTile label, .phase2HistoryPanel--trend .accTile .muted.tiny, .phase2HistoryPanel--health .accTile label, .phase2HistoryPanel--health .accTile .muted.tiny, .phase2HistoryPanel--diab .historyDiabTable__label--short').forEach((element) => {
      const fullText = element.dataset.mobileFulltext || element.getAttribute('title') || element.textContent.trim();
      if (!fullText) return;
      element.dataset.mobileFulltext = fullText;
      element.setAttribute('title', fullText);
      element.setAttribute('aria-label', fullText);
      element.classList.add('mobileTruncationHint');
    });
  }

  /* Le panneau peut être remonté par le shell legacy après son portage mobile.
     On cible donc les contrôles réels, plutôt qu'un ancêtre de présentation. */
  function applyMobileDiabetesHistoryToolbar(){
    const date = $('diabHistDate');
    const toolbar = date?.closest('.historyDiabToolbar');
    const field = date?.closest('.historyDiabToolbarField');
    const actions = $('btnDiabHistRefresh')?.closest('.historyDiabToolbarActions');
    if (!toolbar || !field || !actions) return false;
    toolbar.style.display = 'grid';
    toolbar.style.gridTemplateColumns = 'minmax(0, 1fr) minmax(104px, .72fr)';
    toolbar.style.gap = '8px';
    toolbar.style.alignItems = 'end';
    field.style.minWidth = '0';
    actions.style.minWidth = '0';
    actions.style.width = 'auto';
    return true;
  }

  function clearMobileDiabetesHistoryToolbar(){
    const date = $('diabHistDate');
    const toolbar = date?.closest('.historyDiabToolbar');
    const field = date?.closest('.historyDiabToolbarField');
    const actions = $('btnDiabHistRefresh')?.closest('.historyDiabToolbarActions');
    if (toolbar){
      toolbar.style.display = '';
      toolbar.style.gridTemplateColumns = '';
      toolbar.style.gap = '';
      toolbar.style.alignItems = '';
    }
    if (field) field.style.minWidth = '';
    if (actions){
      actions.style.minWidth = '';
      actions.style.width = '';
    }
  }

  function setCard(id, complete, status){
    const card = $(id);
    if (card) card.dataset.complete = String(complete);
    const statusEl = $(id.replace('Card', 'Status'));
    if (statusEl) statusEl.textContent = status;
  }

  function setAction(action, options = {}){
    if (!['spend', 'meals', 'activity'].includes(action)) return;
    activeAction = action;
    ['spend', 'meals', 'activity'].forEach((key) => {
      const card = $(`mobileDaily${key[0].toUpperCase()}${key.slice(1)}Card`);
      const slot = $(`mobileDaily${key[0].toUpperCase()}${key.slice(1)}Slot`);
      const button = doc.querySelector(`[data-mobile-action="${key}"]`);
      const open = key === action;
      if (card) card.dataset.open = String(open);
      if (slot) slot.hidden = !open;
      if (button) button.setAttribute('aria-expanded', String(open));
    });
    if (options.focus) global.setTimeout(() => $(`mobileDaily${action[0].toUpperCase()}${action.slice(1)}Slot`)?.querySelector('input, button, select')?.focus(), 40);
  }

  function syncNextBadge(){
    let next = null;
    try { next = global.__PlayfulTracking?.prochainBadge?.(global.loadDays?.() || [], $('dayDate')?.value); } catch (_) { }
    if (!next) return;
    if ($('mobileDailyNextBadgeIcon')) $('mobileDailyNextBadgeIcon').textContent = next.icon || '🏅';
    if ($('mobileDailyNextBadgeTitle')) $('mobileDailyNextBadgeTitle').textContent = next.label || 'À découvrir';
    if ($('mobileDailyNextBadgeDesc')) $('mobileDailyNextBadgeDesc').textContent = next.description || '';
    if ($('mobileDailyNextBadgeProgress')) $('mobileDailyNextBadgeProgress').textContent = `${next.current || 0}/${next.target || 1}`;
  }

  function showCompletionFeedback(){
    const state = $('mobileDailyState');
    if (!state) return;
    state.classList.remove('is-celebrating');
    void state.offsetWidth;
    state.classList.add('is-celebrating');
    global.setTimeout(() => state.classList.remove('is-celebrating'), 900);
  }

  function syncDailyState(){
    if (!media.matches) return;
    installMobileInfoDots();
    installMobileTruncationHints();
    applyMobileDiabetesHistoryToolbar();
    syncOptionalPanels();
    const spend = hasSpend();
    const meals = hasMeals();
    const activity = hasActivity();
    const count = [spend, meals, activity].filter(Boolean).length;
    const state = $('mobileDailyState');
    const countEl = $('mobileDailyCount');
    const progressEl = $('mobileDailyProgress');
    const label = $('mobileDailyStateLabel');
    const date = $('dayDate')?.value;
    const dateText = date ? new Intl.DateTimeFormat('fr-BE', { weekday:'long', day:'numeric', month:'long' }).format(new Date(`${date}T12:00:00`)) : 'Aujourd’hui';
    if ($('mobileDailyDate')) $('mobileDailyDate').textContent = dateText;
    if (countEl) { countEl.setAttribute('aria-label', `${count} essentiels renseignés sur 3`); countEl.innerHTML = `${count}<span>/3</span>`; }
    if (progressEl) progressEl.textContent = `${count}/3 essentiels renseignés`;
    if (label) label.textContent = count === 3 ? 'Les essentiels sont là' : count ? 'Journée en cours' : 'Journée lancée';
    if (state) state.dataset.tone = count === 3 ? 'ok' : (count ? 'warn' : 'muted');
    setCard('mobileDailySpendCard', spend, spend ? `${text('p1TodaySpend') || 'Dépense confirmée'}` : 'Confirmer la dépense du jour');
    setCard('mobileDailyMealsCard', meals, meals ? text('p1TodayMeals') : 'Ajouter le premier repas');
    setCard('mobileDailyActivityCard', activity, activity ? text('p1TodaySport') : 'Ajouter une séance si nécessaire');
    const mealCount = Array.isArray(activeDay()?.meals) ? activeDay().meals.length : 0;
    if ($('mobileDailyHistoryMealsCount')) $('mobileDailyHistoryMealsCount').textContent = `· ${mealCount}`;
    syncRemaining();
    syncNextBadge();
    syncMobileSetup();
    if (previousEssentialCount !== null && previousEssentialCount < 3 && count === 3) showCompletionFeedback();
    previousEssentialCount = count;
  }

  function mobileSetupState(){
    try { return typeof global.phase6GetSetupState === 'function' ? global.phase6GetSetupState() : null; } catch (_) { return null; }
  }

  function setupStatus(section){
    if (!section) return 'À compléter';
    if (section.ready) return 'Prêt';
    const remaining = Math.max(0, Number(section.totalCount || 0) - Number(section.completeCount || 0));
    return remaining > 1 ? `${remaining} éléments à compléter` : '1 élément à compléter';
  }

  function syncMobileSetup(){
    if (!media.matches) return;
    const setup = mobileSetupState();
    if (!setup) return;
    const sections = new Map(setup.sections.map((section) => [section.key, section]));
    const readyCount = Number(setup.readyCount || 0);
    const complete = setup.complete === true;
    const state = $('mobileSetupState');
    const stateLabel = $('mobileSetupStateLabel');
    const progress = $('mobileSetupProgress');
    const count = $('mobileSetupCount');
    const title = $('mobileSetupTitle');
    const lead = $('mobileSetupLead');
    const today = $('mobileSetupToday');
    if (state) state.dataset.complete = String(complete);
    if (stateLabel) stateLabel.textContent = complete ? 'Votre cadre est prêt' : `${readyCount} étape${readyCount > 1 ? 's' : ''} prête${readyCount > 1 ? 's' : ''}`;
    if (progress) progress.textContent = complete ? 'Vous pouvez passer au suivi du jour.' : `${readyCount}/4 étapes complétées`;
    if (count) { count.setAttribute('aria-label', `${readyCount} étapes complétées sur 4`); count.innerHTML = `${readyCount}<span>/4</span>`; }
    if (title) title.textContent = complete ? 'Réglages' : 'Configurons votre suivi';
    if (lead) lead.textContent = complete ? 'Modifiez uniquement le repère dont vous avez besoin.' : 'Quatre étapes courtes pour préparer les repères du quotidien.';
    if (today) today.hidden = !complete;
    qa('[data-mobile-setup]').forEach((button) => {
      const key = button.dataset.mobileSetup;
      const section = sections.get(key);
      const status = button.querySelector('small');
      button.dataset.complete = String(section?.ready === true);
      if (status) status.textContent = setupStatus(section);
    });
    const slot = $('mobileDailySettingsSlot');
    const open = slot?.dataset.mobileSettingsOpen;
    if (!open || (!complete && previousSetupComplete !== false)) openMobileSetupStep(setup.firstIncomplete?.key || 'profile', { scroll:false });
    previousSetupComplete = complete;
  }

  function collapseMobileSetup(){
    const slot = $('mobileDailySettingsSlot');
    if (slot) slot.hidden = true;
    qa('[data-mobile-setup]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  }

  /* Accordéon Réglages : comme « Aujourd'hui », la carte s'ouvre directement sous
     l'onglet tapé. On déplace le slot (qui porte les panneaux) juste après le bouton
     de l'étape, puis on le rend visible ; il se referme via collapseMobileSetup(). */
  function openMobileSetupStep(key, options = {}){
    const step = SETUP_STEPS[key];
    const slot = $('mobileDailySettingsSlot');
    if (!step || !slot) return;
    const stepBtn = doc.querySelector(`[data-mobile-setup="${key}"]`);
    slot.dataset.mobileSettingsOpen = key;
    slot.hidden = false;
    // Positionne la carte directement sous l'étape ouverte (idempotent).
    if (stepBtn && stepBtn.nextElementSibling !== slot) stepBtn.after(slot);
    qa('[data-mobile-setup]').forEach((button) => button.setAttribute('aria-expanded', String(button.dataset.mobileSetup === key)));
    if (options.scroll === false) return;
    global.setTimeout(() => {
      /* On amène l'onglet ouvert juste sous l'appbar fixe (block:'start' l'alignerait
         sur y=0, sous l'appbar). La carte reste ainsi visible directement en dessous. */
      const anchor = stepBtn || slot;
      const appbar = doc.querySelector('.appbar__inner') || doc.querySelector('.appbar');
      const appbarH = appbar
        ? appbar.getBoundingClientRect().bottom
        : (parseInt(global.getComputedStyle(doc.documentElement).getPropertyValue('--appbar-h'), 10) || 56);
      const y = anchor.getBoundingClientRect().top + global.scrollY - appbarH - 12;
      global.scrollTo({ top: Math.max(0, y), behavior:'smooth' });
    }, 20);
  }

  /* Clic utilisateur : re-clic sur l'étape ouverte => on referme (la carte disparaît). */
  function toggleMobileSetupStep(key){
    const slot = $('mobileDailySettingsSlot');
    if (slot && !slot.hidden && slot.dataset.mobileSettingsOpen === key) {
      collapseMobileSetup();
      return;
    }
    openMobileSetupStep(key);
  }

  function queueSync(delay){
    global.clearTimeout(syncTimer);
    syncTimer = global.setTimeout(syncDailyState, typeof delay === 'number' ? delay : 80);
  }

  function setView(view, options = {}){
    if (!['today','history','settings'].includes(view)) view = 'today';
    activeView = view;
    const map = { today:'mobileDailyToday', history:'mobileDailyHistory', settings:'mobileDailySettings' };
    Object.entries(map).forEach(([key, id]) => {
      const el = $(id); if (!el) return;
      const current = key === view;
      el.hidden = !current; el.classList.toggle('is-active', current);
    });
    qa('[data-mobile-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.mobileView === view));
    if (options.runLegacy !== false && typeof global.setActiveTab === 'function') {
      const legacyTab = view === 'today' ? 'journalEntry' : view;
      try { global.setActiveTab(legacyTab); } catch (error) { console.warn('mobile daily tab synchronization failed', error); }
    }
    if (options.scroll !== false) global.scrollTo(0, 0);
    if (view === 'settings') syncMobileSetup();
    queueSync(20);
  }

  function activate(){
    $('mobileDailyApp').hidden = false;
    doc.documentElement.classList.add('mobile-daily-active');
    portNodes(true);
    portMobileSetupContext(true);
    ungateMobileCards();
    installSpendConfirm();
    installMobileInfoDots();
    applyMobileDiabetesHistoryToolbar();
    syncOptionalPanels();
    watchContextDrawer();
    setAction(activeAction);
    const locked = doc.documentElement.classList.contains('app-locked');
    setView(locked ? 'settings' : activeView, { runLegacy:false, scroll:false });
    queueSync(120);
  }

  function deactivate(){
    if (contextObserver) { contextObserver.disconnect(); contextObserver = null; }
    restoreMobileInfoDots();
    clearMobileDiabetesHistoryToolbar();
    const diabetesPanel = doc.querySelector('.phase2JournalPanel--diabetes');
    if (diabetesPanel) diabetesPanel.hidden = false;
    removeSpendConfirm();
    regateMobileCards();
    portMobileSetupContext(false);
    portNodes(false);
    $('mobileDailyApp').hidden = true;
    doc.documentElement.classList.remove('mobile-daily-active');
  }

  function installMobileInfoDot({ cardId, label, className }){
    const card = $(cardId);
    const note = card?.querySelector('.phase1SplitNote');
    const header = card?.querySelector('.row');
    if (!note || !header || header.querySelector(`[data-mobile-info-source="${cardId}"]`)) return;
    const dot = doc.createElement('span');
    dot.className = `info-dot mobileDailyInlineInfo ${className}`;
    dot.dataset.mobileInfoSource = cardId;
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-label', `Informations — ${label}`);
    dot.setAttribute('data-modaltext', note.textContent.trim());
    dot.textContent = 'ℹ️';
    note.classList.add('mobileDailyInfoSource');
    header.classList.add('mobileDailyInfoHeader');
    header.appendChild(dot);
    if (dot.dataset.mobileInfoKeyBound !== 'true') {
      dot.dataset.mobileInfoKeyBound = 'true';
      dot.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); dot.click();
      });
    }
  }

  function installMobileInfoDots(){
    installMobileInfoDot({ cardId:'sportCard', label:'Activité', className:'mobileDailyActivityInfo' });
    installMobileInfoDot({ cardId:'sleepCard', label:'Sommeil', className:'mobileDailySleepInfo' });
  }

  function restoreMobileInfoDots(){
    ['sportCard', 'sleepCard'].forEach((cardId) => {
      const card = $(cardId);
      if (!card) return;
      card.querySelector('.phase1SplitNote.mobileDailyInfoSource')?.classList.remove('mobileDailyInfoSource');
      card.querySelector('.mobileDailyInlineInfo[data-mobile-info-source]')?.remove();
      if (!card.querySelector('.mobileDailyInlineInfo')) card.querySelector('.mobileDailyInfoHeader')?.classList.remove('mobileDailyInfoHeader');
    });
  }

  function installContextDrawer(){
    const bar = $('phase5StatusBar');
    const button = $('mobileDailyContextBtn');
    if (!bar || !button) return false;
    if (bar.dataset.mobileDrawerReady === 'true') return true;
    bar.dataset.mobileDrawerReady = 'true';
    bar.classList.add('phase5StatusBar--drawer');
    const settingsAction = doc.createElement('button');
    settingsAction.className = 'mobileDailyDrawerSettings';
    settingsAction.type = 'button';
    settingsAction.textContent = 'Modifier le cadre';
    settingsAction.addEventListener('click', () => {
      bar.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      setView('settings');
    });
    bar.appendChild(settingsAction);
    button.addEventListener('click', () => {
      const open = bar.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
    return true;
  }

  /* phase5StatusBar is assembled after the shell on some startup paths. */
  function watchContextDrawer(){
    if (installContextDrawer() || contextObserver) return;
    contextObserver = new MutationObserver(() => {
      if (!media.matches || !installContextDrawer()) return;
      contextObserver.disconnect();
      contextObserver = null;
    });
    contextObserver.observe(doc.body, { childList:true, subtree:true });
  }

  function bind(){
    if (global.__mobileDailySurfaceBound) return;
    global.__mobileDailySurfaceBound = true;
    qa('[data-mobile-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.mobileView)));
    qa('[data-mobile-setup]').forEach((button) => button.addEventListener('click', () => toggleMobileSetupStep(button.dataset.mobileSetup)));
    qa('[data-mobile-menu-view]').forEach((button) => button.addEventListener('click', () => {
      setView(button.dataset.mobileMenuView);
      $('menuBtn')?.click();
    }));
    [['btnMobileMenuOpenHelp', 'btnMenuOpenHelpModal'], ['btnMobileMenuOpenCloud', 'btnMenuOpenCloudModal'], ['btnMobileMenuOpenTerms', 'btnMenuOpenTermsGate']].forEach(([mobileId, legacyId]) => {
      $(mobileId)?.addEventListener('click', () => $(legacyId)?.click());
    });
    qa('[data-mobile-action]').forEach((button) => button.addEventListener('click', () => setAction(button.dataset.mobileAction, { focus:true })));
    $('mobileDailySettingsSlot')?.addEventListener('input', () => queueSync(40));
    $('mobileDailySettingsSlot')?.addEventListener('change', () => queueSync(40));
    $('mobileDailyNextBadge')?.addEventListener('click', () => setView('history'));
    ['dayDate','todaySpendEdit','btnAddMeal','btnClearMeals','btnSportSave','diabEnabled'].forEach((id) => $(id)?.addEventListener('change', () => queueSync()));
    doc.addEventListener('click', (event) => {
      if (event.target.closest('#btnAddMeal, #btnClearMeals, #btnSportSave, [data-sportdel], .calDay')) queueSync(140);
    });
    const observer = new MutationObserver(() => queueSync());
    ['p1TodayMeals','p1TodaySpend','p1TodaySport','rK','eK'].forEach((id) => { const el = $(id); if (el) observer.observe(el, { childList:true, characterData:true, subtree:true }); });
    media.addEventListener?.('change', (event) => event.matches ? activate() : deactivate());
    media.matches ? activate() : deactivate();
  }

  global.__MobileDailySurface = Object.freeze({ activate, deactivate, setView, sync:syncDailyState });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => global.setTimeout(bind, 160));
  else global.setTimeout(bind, 160);
})(window, document);
