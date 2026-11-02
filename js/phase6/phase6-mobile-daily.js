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
    const watchCard = $('watchBrand')?.closest('.settingsPanel--watch .card') || null; /* v24.0 : ancre structurelle */
    const watchProfile = $('watchProfileInfo')?.closest('[data-um="sport"]') || null; /* v24.0 : ancre structurelle */
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

  /* v23.5 : libellés « Nom (unité) » des mesures de composition scindés en deux spans
     (texte identique) pour que le nom se tronque en ellipse et que l'unité reste visible.
     Fait une seule fois ; sans effet visuel hors mobile (spans inline). */
  const UNIT_LABEL_INPUTS = ['fatPct', 'musclePct', 'boneKg'];
  function splitUnitLabels(){
    UNIT_LABEL_INPUTS.forEach((id) => {
      const label = $(id)?.previousElementSibling;
      if (!label || label.tagName !== 'LABEL' || label.dataset.mobileUnitSplit === '1') return;
      const match = label.textContent.trim().match(/^(.*?)\s*(\([^)]*\))$/);
      if (!match) return;
      label.textContent = '';
      const name = doc.createElement('span'); name.className = 'mobileLabelName'; name.textContent = match[1];
      const unit = doc.createElement('span'); unit.className = 'mobileLabelUnit'; unit.textContent = match[2];
      label.append(name, ' ', unit);
      label.dataset.mobileUnitSplit = '1';
    });
  }

  /* v23.5 : carte « Montre et dépense » — libellés courts et aides masquées sur mobile,
     libellés d'origine restaurés au retour desktop. */
  const MOBILE_SHORT_LABELS = { watchBrand:'Ta montre', errMode:'Marge', montre:'Kcal / jour', errPct:'Marge (%)' };
  function shortenWatchLabels(isMobile){
    Object.entries(MOBILE_SHORT_LABELS).forEach(([id, short]) => {
      const control = $(id);
      const label = control?.parentElement?.querySelector('label');
      if (!label) return;
      if (isMobile) {
        if (label.dataset.mobileLabelOriginal == null) label.dataset.mobileLabelOriginal = label.textContent;
        label.textContent = short;
      } else if (label.dataset.mobileLabelOriginal != null) {
        label.textContent = label.dataset.mobileLabelOriginal;
        delete label.dataset.mobileLabelOriginal;
      }
    });
    const card = doc.querySelector('.mobileWatchCard') || $('watchBrand')?.closest('.card');
    card?.querySelectorAll('.muted').forEach((hint) => {
      if (hint.querySelector('.info-dot')) return;
      hint.classList.toggle('mobileWatchHint', isMobile);
    });
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
    /* v23.4 (a) : chaîne lisible « Montre → retenue (prudence) », lue depuis
       #todaySpendEdit (brut), #flow_spendKcal (retenue, calculée par le moteur),
       #errPct/#errMode (réglage). Aucun calcul ici. */
    const chain = doc.createElement('p');
    chain.id = 'mobileDailySpendChain';
    chain.className = 'mobileDailySpendChain';
    chain.hidden = true;
    chain.addEventListener('keydown', (event) => {
      const dot = event.target.closest?.('.info-dot');
      if (!dot || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault(); dot.click();
    });
    slot.appendChild(chain);
    const button = doc.createElement('button');
    button.type = 'button';
    button.id = 'mobileDailySpendConfirm';
    button.className = 'mobileDailySpendConfirm';
    button.textContent = 'Oui, c’est bien ça';
    button.addEventListener('click', () => {
      const edit = $('todaySpendEdit');
      if (!edit) return;
      edit.dispatchEvent(new Event('change', { bubbles:true }));
      queueSync(140);
    });
    slot.appendChild(button);
  }
  function removeSpendConfirm(){ $('mobileDailySpendConfirm')?.remove(); $('mobileDailySpendChain')?.remove(); }
  function syncSpendChain(){
    const el = $('mobileDailySpendChain');
    if (!el) return;
    const raw = Number($('todaySpendEdit')?.value);
    /* #flow_spendKcal = dépense ajustée écrite par le moteur à chaque recalcul, journée
       sauvegardée ou non (#p1TodaySpend retombe sur la valeur brute hors journée saisie). */
    const retained = Number((text('flow_spendKcal').match(/\d+/) || [])[0]);
    if (!(raw > 0) || !(retained > 0)) { el.hidden = true; return; }
    el.hidden = false;
    if (Math.round(retained) === Math.round(raw)) {
      el.innerHTML = `L’app retient <strong>${Math.round(raw)} kcal</strong>`;
      return;
    }
    const pct = Number($('errPct')?.value) || 0;
    const mode = $('errMode')?.value;
    const sign = mode === 'optimistic' ? '+' : '−';
    const modalText = `Ta montre dit ${Math.round(raw)} kcal.\nMarge de sécurité : ${sign}${pct} % (${mode === 'optimistic' ? 'ajoutée' : 'retirée'}).\nL’app retient ${Math.round(retained)} kcal, et c’est ce chiffre qui fixe ta cible du jour.\nTu peux changer la marge dans Mon cadre › Ce que tu brûles.`;
    el.innerHTML = `Ta montre dit <strong>${Math.round(raw)}</strong>, l’app retient <strong>${Math.round(retained)} kcal</strong> <span class="info-dot mobileDailyInlineInfo mobileDailySpendInfo" role="button" tabindex="0" aria-label="Pourquoi ${Math.round(retained)} kcal ?" data-modaltext="${modalText.replace(/"/g, '&quot;')}">ℹ️</span>`;
  }

  /* v23.2 : repas récents — ajout en 1 tap. La liste est déduite des journées déjà
     enregistrées (loadDays legacy) : aucune clé de stockage nouvelle. L'ajout remplit
     les champs du formulaire puis rejoue le clic sur #btnAddMeal, donc exactement le
     chemin existant (normalizeMeal, setMealsForDay, renderMealsTable, compute). */
  const RECENT_MEALS_MAX = 8;
  /* v24.4 : « oublier » un repas habituel. Clé dédiée par profil (nouvelle, aucune donnée
     existante touchée) : { [cléRepas]: dateDeLaDernièreNote }. Le repas reste caché tant que
     sa dernière note est antérieure ou égale à cette date ; une note un jour suivant le ramène. */
  function forgottenMealsKey(){
    let profile = 'default';
    try { profile = global.localStorage.getItem('secheapp.activeProfile.v1') || $('profileSelect')?.value || 'default'; } catch (_) { }
    return `secheapp.${profile}.forgottenMeals.v1`;
  }
  function loadForgottenMeals(){
    try { const parsed = JSON.parse(global.localStorage.getItem(forgottenMealsKey()) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
    catch (_) { return {}; }
  }
  function saveForgottenMeals(map){
    try { global.localStorage.setItem(forgottenMealsKey(), JSON.stringify(map || {})); } catch (_) { }
  }
  function recentMealKey(name, k, p, c, f){
    return name.toLowerCase() === 'repas' ? `repas|${k}|${p}|${c}|${f}` : name.toLowerCase();
  }
  function recentMeals(){
    let days = [];
    try { days = global.loadDays?.() || []; } catch (_) { days = []; }
    const forgotten = loadForgottenMeals();
    const seen = new Set();
    const out = [];
    const sorted = days.filter((day) => day && Array.isArray(day.meals)).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    for (const day of sorted) {
      for (const meal of [...day.meals].reverse()) {
        const name = String(meal?.name || '').trim();
        if (!name) continue;
        const k = Number(meal.k) || 0, p = Number(meal.p) || 0, c = Number(meal.c) || 0, f = Number(meal.f) || 0;
        /* Un repas nommé est identifié par son nom (la version la plus récente gagne) ;
           le nom générique « Repas » n'identifie rien : on le distingue par ses valeurs. */
        const key = recentMealKey(name, k, p, c, f);
        if (seen.has(key)) continue;
        seen.add(key);
        const lastDate = String(day.date || '');
        if (forgotten[key] && lastDate <= String(forgotten[key])) continue; /* oublié jusqu'à une future note */
        out.push({ name, k, p, c, f, key, lastDate });
        if (out.length >= RECENT_MEALS_MAX) return out;
      }
    }
    return out;
  }
  function forgetRecentMeal(meal){
    if (!meal?.key) return;
    const map = loadForgottenMeals();
    map[meal.key] = meal.lastDate || '';
    saveForgottenMeals(map);
  }
  function addRecentMeal(meal){
    if (!meal || !$('btnAddMeal')) return;
    const fields = { mealName:meal.name, mealK:meal.k, mealP:meal.p, mealC:meal.c, mealF:meal.f };
    Object.entries(fields).forEach(([id, value]) => { const el = $(id); if (el) el.value = String(value); });
    $('btnAddMeal').click();
    queueSync(140);
  }
  /* v23.4 : préremplissage par nom. Si le nom tapé correspond à un repas récent et
     que les quatre champs de valeurs sont vides ou à 0, on les préremplit ; on n'ajoute
     rien (l'utilisateur garde la main sur « Ajouter ce repas »). */
  function prefillMealFromName(){
    if (!media.matches) return;
    const name = String($('mealName')?.value || '').trim().toLowerCase();
    if (!name || name === 'repas') return;
    const untouched = ['mealK', 'mealP', 'mealC', 'mealF'].every((id) => !(Number($(id)?.value) > 0));
    if (!untouched) return;
    const meal = ($('mobileDailyRecentMeals')?.__recentMeals || recentMeals()).find((item) => item.name.toLowerCase() === name);
    if (!meal) return;
    $('mealK').value = String(meal.k); $('mealP').value = String(meal.p); $('mealC').value = String(meal.c); $('mealF').value = String(meal.f);
  }
  /* v24.5 : la liste vit sous le champ « Ce que tu as mangé ». Choisir un repas remplit le nom
     et les quatre valeurs (onglet « Les valeurs ») ; on ajoute ensuite avec « Ajouter ce repas ».
     La corbeille reste dans la liste. Le bloc est retiré à la désactivation mobile. */
  function fillMealForm(meal){
    if (!meal) return;
    const fields = { mealName:meal.name, mealK:meal.k, mealP:meal.p, mealC:meal.c, mealF:meal.f };
    Object.entries(fields).forEach(([id, value]) => { const el = $(id); if (el) el.value = String(value); });
    $('mealModeManual')?.click();
  }
  function installRecentMeals(){
    const nameInput = $('mealName');
    if (!nameInput || $('mobileDailyRecentMeals')) return;
    const box = doc.createElement('div');
    box.id = 'mobileDailyRecentMeals';
    box.className = 'mobileDailyRecentMeals';
    box.hidden = true;
    box.innerHTML = '<div class="mobileDailyRecentMeals__selectWrap">'
      + '<select id="mobileDailyRecentMealSelect" class="mobileDailyRecentMeals__select" aria-label="Tes habitudes"><option value="">Tes habitudes…</option></select>'
      + '<button type="button" class="mobileDailyRecentMeals__forget" id="mobileDailyRecentMealForget" title="Oublier ce repas" aria-label="Oublier ce repas" disabled>🗑</button></div>'
      + '<p class="mobileDailyRecentMeals__note muted" id="mobileDailyRecentMealNote" aria-live="polite" hidden></p>';
    const select = box.querySelector('#mobileDailyRecentMealSelect');
    const forget = box.querySelector('#mobileDailyRecentMealForget');
    const selected = () => select.value === '' ? null : box.__recentMeals?.[Number(select.value)];
    select.addEventListener('change', () => {
      const meal = selected();
      forget.disabled = !meal;
      fillMealForm(meal);
    });
    forget.addEventListener('click', () => {
      const meal = selected();
      if (!meal) return;
      forgetRecentMeal(meal);
      box.__recentMealNote = `« ${meal.name} » : oublié jusqu’à une future note.`;
      syncRecentMeals();
    });
    nameInput.insertAdjacentElement('afterend', box);
  }
  function syncRecentMeals(){
    const box = $('mobileDailyRecentMeals');
    if (!box) return;
    const meals = recentMeals();
    box.__recentMeals = meals;
    const note = box.querySelector('#mobileDailyRecentMealNote');
    if (note) {
      note.textContent = box.__recentMealNote || '';
      note.hidden = !box.__recentMealNote;
      box.__recentMealNote = '';
    }
    box.hidden = meals.length === 0 && !(note && !note.hidden);
    const select = box.querySelector('#mobileDailyRecentMealSelect');
    if (!select) return;
    /* Toujours remis sur l'invite : une sélection ne vaut que pour remplir le formulaire. */
    select.textContent = '';
    const prompt = doc.createElement('option');
    prompt.value = ''; prompt.textContent = 'Tes habitudes…';
    select.appendChild(prompt);
    meals.forEach((meal, index) => {
      const option = doc.createElement('option');
      option.value = String(index);
      option.textContent = `${meal.name} · ${Math.round(meal.k)} kcal`;
      select.appendChild(option);
    });
    select.value = '';
    const empty = meals.length === 0;
    select.disabled = empty;
    box.querySelector('#mobileDailyRecentMealForget').disabled = true;
    box.querySelector('.mobileDailyRecentMeals__selectWrap').hidden = empty;
  }
  function removeRecentMeals(){ $('mobileDailyRecentMeals')?.remove(); }

  /* v23 : décompte du jour — lecture de #rK (reste à consommer, calculé par le
     moteur legacy) et #eK (déjà consommé). Aucun calcul ici. */
  function syncRemaining(){
    const el = $('mobileDailyRemaining');
    if (!el) return;
    const rest = text('rK');
    if (!rest) { el.hidden = true; return; }
    el.hidden = false;
    const target = text('tK');
    el.innerHTML = `Reste <strong>${rest} kcal</strong>${target ? ` <span>sur cible de ${target} kcal</span>` : ''}`;
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
    if (options.scroll) scrollUnderAppbar(doc.querySelector(`[data-mobile-action="${action}"]`)); /* v24.5 : même geste que Mon cadre */
    if (options.focus) global.setTimeout(() => $(`mobileDaily${action[0].toUpperCase()}${action.slice(1)}Slot`)?.querySelector('input, button, select')?.focus({ preventScroll:true }), 40);
  }

  function collapseActions(){
    ['spend', 'meals', 'activity'].forEach((key) => {
      const card = $(`mobileDaily${key[0].toUpperCase()}${key.slice(1)}Card`);
      const slot = $(`mobileDaily${key[0].toUpperCase()}${key.slice(1)}Slot`);
      const button = doc.querySelector(`[data-mobile-action="${key}"]`);
      if (card) card.dataset.open = 'false';
      if (slot) slot.hidden = true;
      if (button) button.setAttribute('aria-expanded', 'false');
    });
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
    if (countEl) { countEl.setAttribute('aria-label', `${count} choses notées sur 3`); countEl.innerHTML = `${count}<span>/3</span>`; }
    if (progressEl) progressEl.textContent = `${count}/3 choses notées`;
    if (label) label.textContent = count === 3 ? 'Tout est noté' : count ? 'En cours' : 'C’est parti';
    if (state) state.dataset.tone = count === 3 ? 'ok' : (count ? 'warn' : 'muted');
    setCard('mobileDailySpendCard', spend, spend ? `${text('p1TodaySpend') || 'Confirmé'}` : 'À confirmer');
    setCard('mobileDailyMealsCard', meals, meals ? text('p1TodayMeals') : 'Rien noté encore');
    setCard('mobileDailyActivityCard', activity, activity ? text('p1TodaySport') : 'Si tu as bougé, note-le');
    const mealCount = Array.isArray(activeDay()?.meals) ? activeDay().meals.length : 0;
    if ($('mobileDailyHistoryMealsCount')) $('mobileDailyHistoryMealsCount').textContent = `· ${mealCount}`;
    syncRemaining();
    syncSpendChain();
    syncRecentMeals();
    syncNextBadge();
    syncMobileSetup();
    if (previousEssentialCount !== null && previousEssentialCount < 3 && count === 3) showCompletionFeedback();
    previousEssentialCount = count;
  }

  function mobileSetupState(){
    try { return typeof global.phase6GetSetupState === 'function' ? global.phase6GetSetupState() : null; } catch (_) { return null; }
  }

  function setupStatus(section){
    if (!section) return 'À faire';
    if (section.ready) return 'Prêt';
    const remaining = Math.max(0, Number(section.totalCount || 0) - Number(section.completeCount || 0));
    return remaining > 1 ? `encore ${remaining} choses` : 'encore 1 chose';
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
    if (stateLabel) stateLabel.textContent = complete ? 'Ton cadre est prêt' : `${readyCount} étape${readyCount > 1 ? 's' : ''} faite${readyCount > 1 ? 's' : ''}`;
    if (progress) progress.textContent = complete ? 'Tu peux passer à ta journée.' : `${readyCount}/4 étapes faites`;
    if (count) { count.setAttribute('aria-label', `${readyCount} étapes faites sur 4`); count.innerHTML = `${readyCount}<span>/4</span>`; }
    if (title) title.textContent = complete ? 'Mon cadre' : 'On règle ton suivi';
    if (lead) lead.textContent = complete ? 'Change seulement ce dont tu as besoin.' : 'Quatre étapes, cinq minutes, et l’app sait de quoi elle parle.';
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
    scrollUnderAppbar(stepBtn || slot);
  }

  /* v24.5 : commun Mon cadre / Aujourd'hui. On amène l'onglet ouvert juste sous l'appbar
     fixe (block:'start' l'alignerait sur y=0, sous l'appbar). */
  function scrollUnderAppbar(anchor){
    if (!anchor) return;
    global.setTimeout(() => {
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
    shortenWatchLabels(true);
    splitUnitLabels();
    installSpendConfirm();
    installRecentMeals();
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
    removeRecentMeals();
    shortenWatchLabels(false);
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
    settingsAction.textContent = 'Changer mon cadre';
    settingsAction.addEventListener('click', () => {
      bar.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      setView('settings');
    });
    bar.appendChild(settingsAction);
    /* v23.3 : fermeture explicite (croix) et fermeture au tap en dehors du tiroir. */
    const closeDrawer = () => {
      bar.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    };
    const closeAction = doc.createElement('button');
    closeAction.className = 'mobileDailyDrawerClose';
    closeAction.type = 'button';
    closeAction.setAttribute('aria-label', 'Fermer le contexte');
    closeAction.textContent = '✕';
    closeAction.addEventListener('click', closeDrawer);
    bar.prepend(closeAction);
    button.addEventListener('click', () => {
      const open = bar.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
    doc.addEventListener('click', (event) => {
      if (!bar.classList.contains('is-open')) return;
      if (bar.contains(event.target) || button.contains(event.target)) return;
      closeDrawer();
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
      /* v23.3 : setActiveTab() (via setView) ferme déjà le menu ; un clic simulé sur
         #menuBtn faisait un toggle et le rouvrait. On ferme explicitement. */
      try { if (typeof global.closeMenu === 'function') global.closeMenu(); } catch (_) { }
    }));
    [['btnMobileMenuOpenTuto', 'btnMenuOpenTutoModal'], ['btnMobileMenuOpenHelp', 'btnMenuOpenHelpModal'], ['btnMobileMenuOpenCloud', 'btnMenuOpenCloudModal'], ['btnMobileMenuOpenTerms', 'btnMenuOpenTermsGate']].forEach(([mobileId, legacyId]) => {
      $(mobileId)?.addEventListener('click', () => {
        /* v24.4 : la fenêtre « Comment ça marche » est rendue au dernier refresh legacy, qui peut
           précéder l'activation mobile ; on la re-rend pour la vue courante avant de l'ouvrir. */
        if (mobileId === 'btnMobileMenuOpenTuto') { try { global.phase5RenderTutorialGate?.(); } catch (_) { } }
        $(legacyId)?.click();
      });
    });
    /* v23.5 : re-tap sur le volet ouvert => il se referme (comme l'accordéon Réglages). */
    qa('[data-mobile-action]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.mobileAction;
      if (button.getAttribute('aria-expanded') === 'true') collapseActions();
      else setAction(key, { focus:true, scroll:true });
    }));
    $('mobileDailySettingsSlot')?.addEventListener('input', () => queueSync(40));
    $('mobileDailySettingsSlot')?.addEventListener('change', () => queueSync(40));
    $('mobileDailyNextBadge')?.addEventListener('click', () => setView('history'));
    ['input', 'change'].forEach((type) => $('mealName')?.addEventListener(type, prefillMealFromName));
    ['dayDate','todaySpendEdit','btnAddMeal','btnClearMeals','btnSportSave','diabEnabled'].forEach((id) => $(id)?.addEventListener('change', () => queueSync()));
    doc.addEventListener('click', (event) => {
      if (event.target.closest('#btnAddMeal, #btnClearMeals, #btnSportSave, [data-sportdel], .calDay')) queueSync(140);
    });
    const observer = new MutationObserver(() => queueSync());
    ['p1TodayMeals','p1TodaySpend','p1TodaySport','rK','eK','tK','flow_spendKcal'].forEach((id) => { const el = $(id); if (el) observer.observe(el, { childList:true, characterData:true, subtree:true }); });
    media.addEventListener?.('change', (event) => event.matches ? activate() : deactivate());
    media.matches ? activate() : deactivate();
  }

  global.__MobileDailySurface = Object.freeze({ activate, deactivate, setView, sync:syncDailyState });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => global.setTimeout(bind, 160));
  else global.setTimeout(bind, 160);
})(window, document);
