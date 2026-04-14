// Phase 6.29 — extracted legacy shell observers bundle

/* ======================================================
   PHASE 1 — structure d’écran / hiérarchie visuelle
   ====================================================== */
function phase1ShortDate(dateStr){
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) return "—";
  try{
    const [y,m,d] = String(dateStr).split('-').map(Number);
    return new Date(y, m-1, d).toLocaleDateString('fr-BE', { weekday:'short', day:'2-digit', month:'short' });
  }catch(e){ return dateStr; }
}
function phase1ActiveProfileLabel(){
  const sel = $('profileSelect');
  if (!sel) return '—';
  return sel.options?.[sel.selectedIndex]?.textContent?.trim() || sel.value || '—';
}
function phase1ModeLabel(){
  const v = $('useMode')?.value || '';
  if (v === 'simple') return 'Simple';
  if (v === 'sport') return 'Sportif';
  if (v === 'expert') return 'Expert';
  return '—';
}
function phase1SettingsGoalLabel(){
  const sel = $('dietMode');
  const mode = sel?.value || 'none';
  const rawPct = Number($('goalPct')?.value);
  const pct = Number.isFinite(rawPct) && rawPct > 0 ? Math.round(rawPct) : null;
  let label = '—';
  if (typeof dietLabel === 'function' && mode && mode !== 'none') label = dietLabel(mode);
  else if (sel && mode && mode !== 'none') label = sel.options?.[sel.selectedIndex]?.textContent?.trim() || mode;
  else if (pct != null) label = 'Personnalisé';
  if (label === '—' && pct == null) return '—';
  return pct != null ? `${label} · ${pct}%` : label;
}

function phase1SettingsCompromiseState(){
  const sel = $('compromiseSelect');
  const value = sel?.value || '';
  const map = {
    eq_global: { value:'Équilibre global', meta:'Base santé / stabilité.' },
    simple_maintain: { value:'Maintien simple', meta:'Routine stable / long terme.' },
    recomp: { value:'Recomposition équilibrée', meta:'Équilibre / transition.' },
    simple_recomp: { value:'Recomposition simple', meta:'Progression lente / adhérence.' },
    gly_satiety: { value:'Stabilité glycémique', meta:'Équilibrage satiété / stabilité.' },
    protect_cut: { value:'Protection musculaire', meta:'Léger déficit / masse maigre.' },
    recovery: { value:'Récupération optimisée', meta:'Fatigue / volume.' },
    cut_sport: { value:'Sèche progressive', meta:'Référence amaigrissement.' },
    cut_fast: { value:'Sèche rapide', meta:'Court terme.' },
    endurance_volume: { value:'Endurance optimisée', meta:'Volume / entraînement.' },
    endurance_comp: { value:'Performance compétition', meta:'Carb-loading / courte fenêtre.' }
  };
  if (!value || !map[value]) return { value:'Personnalisé', meta:'Aucun compromis sélectionné.' };
  return map[value];
}
function phase1SettingsProfileMetaLabel(){
  return 'Profil local piloté par l’app.';
}
function phase1SettingsModeDiabLabel(){
  return `${phase1ModeLabel()} · ${$('diabEnabled')?.checked ? 'Diabète activé' : 'Diabète inactif'}`;
}
function phase1SetText(id, value){ const el = $(id); if (el) el.textContent = value; }
function phase1RenderContext(){
  const dateStr = (typeof getSelectedDate === 'function') ? getSelectedDate() : ($('dayDate')?.value || '');
  const monthStr = $('histMonth')?.value || (dateStr ? String(dateStr).slice(0,7) : '—');
  const profile = phase1ActiveProfileLabel();
  phase1SetText('p1TodayDate', phase1ShortDate(dateStr));
  phase1SetText('p1JournalDate', phase1ShortDate(dateStr));
  phase1SetText('p1JournalProfile', profile);
  phase1SetText('p1HistoryMonth', monthStr || '—');
  phase1SetText('p1HistoryDate', phase1ShortDate(dateStr));
  const compromise = phase1SettingsCompromiseState();
}
function phase1RenderTodayPulse(){
  const dateStr = (typeof getSelectedDate === 'function') ? getSelectedDate() : ($('dayDate')?.value || '');
  const d = (typeof getDay === 'function' && dateStr) ? (getDay(dateStr) || { date:dateStr }) : null;
  const meals = (typeof getMealsForDay === 'function' && dateStr) ? getMealsForDay(dateStr) : (Array.isArray(d?.meals) ? d.meals : []);
  const sessions = (typeof getSportSessionsForDay === 'function' && dateStr) ? getSportSessionsForDay(dateStr) : (Array.isArray(d?.sportSessions) ? d.sportSessions : []);
  const sleepMinutes = (typeof getSleepMinutesFromObj === 'function') ? getSleepMinutesFromObj(d?.sleep || {}) : 0;
  const spend = Math.round(Number(d?.montreAdjusted ?? d?.montreRaw ?? $('montre')?.value ?? 0) || 0);
  const sportMins = sessions.reduce((acc,x)=> acc + (Number(x?.minutes)||0), 0);
  const diabOn = !!$('diabEnabled')?.checked;
  const diabMeals = Array.isArray(d?.diabMeals) ? d.diabMeals.length : 0;
  const diabGlucose = Array.isArray(d?.diabGlucose) ? d.diabGlucose.length : 0;

  phase1SetText('p1TodayMeals', meals.length ? `${meals.length} repas` : 'Aucun repas');
  phase1SetText('p1TodaySpend', spend > 0 ? `${spend} kcal` : '—');
  phase1SetText('p1TodaySport', sportMins > 0 ? `${fmtSportMinutes ? fmtSportMinutes(sportMins) : (sportMins + ' min')}` : 'Aucune séance');
  phase1SetText('p1TodaySleep', sleepMinutes > 0 ? `${fmtHM ? fmtHM(sleepMinutes) : (sleepMinutes + ' min')}` : 'Aucune donnée');
  if (!diabOn) phase1SetText('p1TodayDiab', 'Module off');
  else phase1SetText('p1TodayDiab', (diabMeals || diabGlucose) ? `${diabMeals} repas · ${diabGlucose} mesures` : 'Aucune donnée');
}
function phase1DecorateCards(){
  const adv = $('accHistAdvanced');
  if (adv){
    const sum = adv.querySelector('summary');
    if (sum) sum.textContent = 'Poids et composition du jour';
    const body = adv.querySelector('.accBody');
    if (body && !body.querySelector('.phase1SplitNote')){
      const note = document.createElement('div');
      note.className = 'phase1SplitNote';
      note.innerHTML = '<b>À retenir :</b> tu saisis ton poids et ta composition dans le Journal. Ici, tu relis les repères associés à la journée active et la tendance 7 jours.';
      body.prepend(note);
    }
    const weightLabel = adv.querySelector('label[for="morningWeight"], #morningWeight')?.closest?.('.accTile')?.querySelector('label');
    if (weightLabel) weightLabel.textContent = 'Poids du jour';
  }
  const trend = $('accTrendExpert');
  if (trend){
    const sum = trend.querySelector('summary');
    if (sum) sum.textContent = 'Tendances 7 jours — lecture avancée';
  }
  const sport = $('sportCard');
  if (sport && !sport.querySelector('.phase1SplitNote')){
    const note = document.createElement('div');
    note.className = 'phase1SplitNote';
    note.textContent = 'Ce bloc est maintenant considéré comme de la saisie du jour. L’historique sport vit dans l’espace Historique / Analyse.';
    const anchor = sport.querySelector('#sportSessionsList') || sport.firstElementChild?.nextElementSibling;
    if (anchor) sport.insertBefore(note, anchor);
  }
  const sleep = $('sleepCard');
  if (sleep && !sleep.querySelector('.phase1SplitNote')){
    const note = document.createElement('div');
    note.className = 'phase1SplitNote';
    note.textContent = 'Le sommeil reste éditable uniquement ici. La lecture de cohérence multi-jours est déportée dans l’Historique.';
    const anchor = sleep.querySelector('#sleepSummary') || sleep.firstElementChild?.nextElementSibling;
    if (anchor) sleep.insertBefore(note, anchor);
  }
  const sourcesCard = Array.from(document.querySelectorAll('section.card')).find(sec => sec.querySelector('h2')?.textContent?.trim() === 'Sources');
  const helpSlot = $('settingsHelpSlot');
  if (sourcesCard && helpSlot && sourcesCard.parentNode !== helpSlot){ helpSlot.appendChild(sourcesCard); }
}
function phase1MoveAnalyticalBlocks(){
  const flow = $('calFlowCard');
  const trendSlot = $('historyTrendSlot');
  if (flow && trendSlot && flow.parentNode !== trendSlot){ trendSlot.appendChild(flow); }
}
function phase1Refresh(){
  try{ phase1RenderContext(); }catch(e){}
  try{ phase1RenderTodayPulse(); }catch(e){}
}
function initPhase1Shell(){
  if (window.__phase1ShellInit) return;
  window.__phase1ShellInit = true;
  phase1MoveAnalyticalBlocks();
  phase1DecorateCards();
  phase1Refresh();

  ['dayDate','histMonth','profileSelect','useMode','diabEnabled','montre','dietMode','goalPct','compromiseSelect'].forEach(id => {
    $(id)?.addEventListener('change', ()=> setTimeout(phase1Refresh, 30));
    $(id)?.addEventListener('input', ()=> setTimeout(phase1Refresh, 30));
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('#btnAddMeal,#btnClearMeals,#btnSportSave,#btnSleepSave,#diab_btnAddMeal,#diab_btnClearMeals,#diab_btnAddGlucose,#diab_btnClearGlucose,#btnCreateProfile,#btnDeleteProfile');
    if (!t) return;
    setTimeout(phase1Refresh, 60);
  });
}



function phase2GotoJournal(slotId){
  return window.__Phase6.Contracts.require('CompositeEntryPoints', 'openJournal')(slotId, { delay:60, behavior:'smooth', block:'start' });
}
function phase2GotoHistory(slotId){
  return window.__Phase6.Contracts.require('CompositeEntryPoints', 'openHistory')(slotId, { delay:60, behavior:'smooth', block:'start' });
}
function phase2ScrollToPanel(target){
  if (!target) return;
  if (typeof window.phase6ScrollToSettingsPanel === 'function') window.phase6ScrollToSettingsPanel(target);
  else target.scrollIntoView({behavior:'smooth', block:'start'});
}
function phase2GotoJournalPanel(selector){
  window.__Phase6.Contracts.require('CompositeEntryPoints', 'openTab')('journalEntry', { delay:0 });
  setTimeout(() => {
    const panel = document.querySelector(selector);
    if (!panel) return;
    phase2ScrollToPanel(panel);
  }, 80);
}
function phase2GotoSettingsPanel(selector){
  window.__Phase6.Contracts.require('CompositeEntryPoints', 'openTab')('settings', { delay:0 });
  setTimeout(() => {
    const panel = document.querySelector(selector);
    if (!panel) return;
    phase2ScrollToPanel(panel);
  }, 80);
}
function phase2GotoTodayPanel(selector){
  window.__Phase6.Contracts.require('CompositeEntryPoints', 'openTab')('today', { delay:0 });
  setTimeout(() => {
    const panel = document.querySelector(selector);
    if (!panel) return;
    phase2ScrollToPanel(panel);
  }, 40);
}
function phase2HandleTodayJump(key){
  if (key === 'reading') return phase2GotoTodayPanel('#todayReadingPanel');
  if (key === 'summary') return phase2GotoTodayPanel('#out');
  if (key === 'meals') return phase2GotoJournalPanel('.phase2JournalPanel--meals');
  if (key === 'activity') return phase2GotoJournalPanel('.phase2JournalPanel--activity');
  if (key === 'sleep') return phase2GotoJournalPanel('.phase2JournalPanel--sleep');
  if (key === 'settings') return phase2GotoSettingsPanel('.settingsPanel--goals');
}
function phase2InjectMicroHead(cardId, title, desc){
  const card = $(cardId);
  if (!card || card.querySelector('.phase2MicroHead')) return;
  const head = document.createElement('div');
  head.className = 'phase2MicroHead';
  head.innerHTML = `<div><h3>${title}</h3><p>${desc}</p></div><span class="phase2SectionTag">Rapide</span>`;
  card.prepend(head);
}
function phase2DecorateCards(){
  try{ document.body.classList.add('phase2Shell'); }catch(e){}


  const out = $('out');
  if (out && !out.querySelector('.phase2MicroHead')){
    const head = document.createElement('div');
    head.className = 'phase2MicroHead';
    head.innerHTML = '<div><h3>Lecture consolidée</h3><p>Objectif, consommé et reste sur la journée active. C’est le cœur du cockpit Pilotage.</p></div><span class="phase2SectionTag">Central</span>';
    out.prepend(head);
  }

  const flow = $('calFlowCard');
  if (flow){
    const h2 = flow.querySelector('h2');
    if (h2) h2.textContent = 'Répartition et logique de calcul';
    const p = flow.querySelector('p.muted');
    if (p) p.textContent = 'Bloc analytique déplacé hors du cockpit quotidien : il explique le modèle, il ne doit plus polluer la lecture immédiate du jour.';
  }

  const profileSlot = $('settingsProfileSlot');
  if (profileSlot && !profileSlot.querySelector('.phase2CompactNotice')){
    const notice = document.createElement('div');
    notice.className = 'phase2CompactNotice';
    notice.textContent = 'Le bloc ci-dessous mélange encore profils, préférences d’usage et montre. Il reste regroupé ici tant que le JS n’est pas découplé plus finement.';
    profileSlot.prepend(notice);
  }
  const goalsSlot = $('settingsGoalsSlot');
  if (goalsSlot && !goalsSlot.querySelector('.phase2CompactNotice')){
    const notice = document.createElement('div');
    notice.className = 'phase2CompactNotice';
    notice.textContent = 'Les objectifs restent inchangés côté moteur. La phase 2 clarifie seulement leur place : réglage, pas lecture quotidienne.';
    goalsSlot.prepend(notice);
  }
}
function phase2WireActions(){
  if (window.__phase2ActionsBound) return;
  window.__phase2ActionsBound = true;

  document.querySelectorAll('[data-today-jump]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      phase2HandleTodayJump(btn.getAttribute('data-today-jump'));
      $('todayJumpFloatPanel') && ($('todayJumpFloatPanel').hidden = true);
      $('todayJumpFloatToggle')?.setAttribute('aria-expanded', 'false');
      document.querySelector('.phase2Screen[data-tabsection="today"] .phase2SettingsJumpFloat')?.classList.remove('is-open');
    });
  });

  $('btnTodayGotoJournalMeals')?.addEventListener('click', ()=> phase2GotoJournal('journalMealsSlot'));
  $('btnTodayGotoJournalActivity')?.addEventListener('click', ()=> phase2GotoJournal('journalActivitySlot'));
  $('btnTodayGotoJournalSleep')?.addEventListener('click', ()=> phase2GotoJournal('journalSleepSlot'));
  $('btnTodayGotoHistory')?.addEventListener('click', ()=> phase2GotoHistory('historyTrendSlot'));

}
function phase6GetShellUseMode(){
  return $('useMode')?.value || document.body?.dataset?.usemode || 'simple';
}
function phase6GetShellDiabEnabled(){
  return !!$('diabEnabled')?.checked;
}
function phase6IsElementActuallyVisible(el){
  return !!(el && !el.classList.contains('hidden') && el.offsetParent !== null);
}
function phase6MatchesMinimumMode(required){
  const mode = phase6GetShellUseMode();
  if (!required || required === 'all') return true;
  if (required === 'sport') return mode === 'sport' || mode === 'expert';
  if (required === 'expert') return mode === 'expert';
  return mode === required;
}
function phase6GetShellAvailabilityMap(){
  const diabEnabled = phase6GetShellDiabEnabled();
  return {
    settings:{
      profile:true,
      watch:true,
      goals:true,
    },
    today:{
      meal:true,
      sport:phase6MatchesMinimumMode('sport'),
      sleep:phase6MatchesMinimumMode('sport'),
      settings:true,
      history:phase6MatchesMinimumMode('expert'),
    },
    journalEntry:{
      meals:true,
      activity:phase6MatchesMinimumMode('sport'),
      sleep:phase6MatchesMinimumMode('sport'),
      metrics:true,
      diabetes:diabEnabled,
    },
    history:{
      calendar:true,
      trend:phase6MatchesMinimumMode('expert'),
      health:true,
      diab:diabEnabled,
    },
  };
}
function phase6IsAvailable(section, key){
  return !!phase6GetShellAvailabilityMap()?.[section]?.[key];
}
function phase6ApplyControlAvailability(control, available){
  if (!control) return;
  control.disabled = !available;
  control.classList.toggle('is-disabled', !available);
  control.setAttribute('aria-disabled', available ? 'false' : 'true');
  control.tabIndex = available ? 0 : -1;
}
function phase6ApplyPanelAvailability(panel, available){
  if (!panel) return;
  panel.classList.toggle('hidden', !available);
  panel.setAttribute('aria-hidden', available ? 'false' : 'true');
}
function phase6SyncShellPanels(){
  phase6ApplyPanelAvailability(document.querySelector('.phase2JournalPanel--activity'), phase6IsAvailable('journalEntry', 'activity'));
  phase6ApplyPanelAvailability(document.querySelector('.phase2JournalPanel--sleep'), phase6IsAvailable('journalEntry', 'sleep'));
  phase6ApplyPanelAvailability(document.querySelector('.phase2JournalPanel--diabetes'), phase6IsAvailable('journalEntry', 'diabetes'));
  phase6ApplyPanelAvailability(document.querySelector('.phase2HistoryPanel--trend'), phase6IsAvailable('history', 'trend'));
  phase6ApplyPanelAvailability(document.querySelector('.phase2HistoryPanel--diab'), phase6IsAvailable('history', 'diab'));
}
function phase6SyncShellQuickNav(){
  const journalMap = {
    meals:'meals',
    activity:'activity',
    sleep:'sleep',
    metrics:'metrics',
    diabetes:'diabetes',
  };
  document.querySelectorAll('[data-journal-jump]').forEach(btn => {
    const key = btn.getAttribute('data-journal-jump');
    phase6ApplyControlAvailability(btn, phase6IsAvailable('journalEntry', journalMap[key] || key));
  });

  const settingsMap = {
    profile:'profile',
    watch:'watch',
    goals:'goals',
  };
  document.querySelectorAll('[data-settings-jump]').forEach(btn => {
    const key = btn.getAttribute('data-settings-jump');
    phase6ApplyControlAvailability(btn, phase6IsAvailable('settings', settingsMap[key] || key));
  });

  [
    ['btnTodayQuickMeal', 'today', 'meal'],
    ['btnTodayQuickMealFloat', 'today', 'meal'],
    ['btnTodayQuickSport', 'today', 'sport'],
    ['btnTodayQuickSportFloat', 'today', 'sport'],
    ['btnTodayQuickSleep', 'today', 'sleep'],
    ['btnTodayQuickSleepFloat', 'today', 'sleep'],
    ['btnTodayQuickSettings', 'today', 'settings'],
    ['btnTodayQuickSettingsFloat', 'today', 'settings'],
    ['btnTodayGotoJournalMeals', 'today', 'meal'],
    ['btnTodayGotoJournalActivity', 'today', 'sport'],
    ['btnTodayGotoJournalSleep', 'today', 'sleep'],
    ['btnTodayGotoHistory', 'today', 'history'],
    ['btnPhase5TodayToJournal', 'today', 'meal'],
    ['btnPhase5TodayToHistory', 'today', 'history'],
    ['btnHistoryGoCalendar', 'history', 'calendar'],
  ].forEach(([id, section, key]) => {
    phase6ApplyControlAvailability($(id), phase6IsAvailable(section, key));
  });

  const historyJumpMap = {
    calendar: { section:'history', key:'calendar', target:'historyMainPanel' },
    trend: { section:'history', key:'trend', target:'historyTrendPanel' },
    health: { section:'history', key:'health', target:'historyHealthPanel' },
    diab: { section:'history', key:'diab', target:'historyDiabPanel' },
  };
  document.querySelectorAll('[data-history-jump]').forEach(btn => {
    const jumpKey = btn.getAttribute('data-history-jump');
    const config = historyJumpMap[jumpKey];
    if (!config) return;
    const target = config.target ? $(config.target) : null;
    const available = config.target
      ? phase6IsAvailable(config.section, config.key) && phase6IsElementActuallyVisible(target)
      : phase6IsAvailable(config.section, config.key);
    phase6ApplyControlAvailability(btn, available);
  });
}
function phase6SyncShellAvailability(){
  phase6SyncShellPanels();
  phase6SyncShellQuickNav();
}
function phase2SyncHistoryQuickNavState(){
  phase6SyncShellAvailability();
}
function initPhase2Shell(){
  if (window.__phase2ShellInit) return;
  window.__phase2ShellInit = true;
  phase2DecorateCards();
  phase2WireActions();
  phase2SyncHistoryQuickNavState();
}


function phase3HideLegacyTutorials(){
  document.querySelectorAll('details.notice').forEach(el => {
    const summaryText = el.querySelector('summary')?.textContent?.trim() || '';
    if (/^Mini-tuto/i.test(summaryText)) el.classList.add('legacy-host');
  });
}
function phase3SplitSettingsWatch(){
  const profileSlot = $('settingsProfileSlot');
  const watchSlot = $('settingsWatchSlot');
  if (!profileSlot || !watchSlot) return;
  const watchCard = Array.from(profileSlot.querySelectorAll('.card')).find(card => {
    return card.querySelector('h2')?.textContent?.trim() === 'Ma dépense du jour (montre)';
  });
  if (watchCard && watchCard.parentNode !== watchSlot){
    watchSlot.appendChild(watchCard);
  }
}
function phase3SplitBodyMetrics(){
  const journalMetricsSlot = $('journalMetricsSlot');
  const historyHealthSlot = $('historyHealthSlot');
  const histAdvanced = $('accHistAdvanced');
  if (!journalMetricsSlot || !histAdvanced) return;

  if (historyHealthSlot && histAdvanced.parentNode !== historyHealthSlot){
    historyHealthSlot.prepend(histAdvanced);
  }

  let card = $('phase3BodyMetricsCard');
  if (!card){
    card = document.createElement('div');
    card.className = 'card phase3BodyCard';
    card.id = 'phase3BodyMetricsCard';
    card.innerHTML = `
      <div class="phase3MiniGrid" id="phase3WeightGrid"></div>
      <div class="phase3Divider"></div>
      <div class="phase3Hint">Mesures optionnelles. Elles restent attachées à la date active et au profil actif.</div>
      <div class="phase3MiniGrid phase3MiniGrid--3" id="phase3BodyCompGrid"></div>
    `;
    journalMetricsSlot.prepend(card);
  }

  const accBody = histAdvanced.querySelector('.accBody');
  if (!accBody) return;

  const allTiles = Array.from(accBody.querySelectorAll('.accTile'));
  const weightTile = allTiles.find(tile => tile.querySelector('#morningWeight'));
  const compGrid = Array.from(accBody.children).find(el => el.classList?.contains('accGrid3') || (el.classList?.contains('accGrid') && el.querySelector('#fatPct')));
  const compTitle = Array.from(accBody.children).find(el => el.classList?.contains('accSubTitle') && /Composition/i.test(el.textContent || ''));

  const weightGrid = $('phase3WeightGrid');
  const bodyCompGrid = $('phase3BodyCompGrid');

  if (weightTile && weightGrid && weightTile.parentNode !== weightGrid){
    weightGrid.appendChild(weightTile);
  }
  if (compTitle) compTitle.remove();
  if (compGrid && bodyCompGrid){
    Array.from(compGrid.children).forEach(child => bodyCompGrid.appendChild(child));
    compGrid.remove();
  }

  const summary = histAdvanced.querySelector('summary');
  if (summary) summary.textContent = 'Analyse poids / IMC / tendance 7 jours';

  histAdvanced.querySelector('.phase3LegacyNote')?.remove();
}
function phase3CleanupLegacyStates(){
  ['welcome','dash','goal','repas','synth','journal','diab','cloud','lexicon'].forEach(tab => {
    const sec = document.querySelector(`section[data-tabsection="${tab}"]`);
    if (!sec) return;
    sec.classList.remove('is-active');
    sec.setAttribute('aria-hidden', 'true');
  });
}
function phase3Refresh(){
  const settingsWatchSlot = $('settingsWatchSlot');
  if (settingsWatchSlot && !settingsWatchSlot.classList.contains('phase3SlotTight')){
    settingsWatchSlot.classList.add('phase3SlotTight');
  }
  const journalMetricsSlot = $('journalMetricsSlot');
  if (journalMetricsSlot && !journalMetricsSlot.classList.contains('phase3SlotTight')){
    journalMetricsSlot.classList.add('phase3SlotTight');
  }
}
function initPhase3Shell(){
  if (window.__phase3ShellInit) return;
  window.__phase3ShellInit = true;
  try{ document.body.classList.add('phase3Shell'); }catch(e){}
  phase3HideLegacyTutorials();
  phase3SplitSettingsWatch();
  phase3SplitBodyMetrics();
  phase3CleanupLegacyStates();
  phase3Refresh();
  ['dayDate','profileSelect','useMode','diabEnabled','montre'].forEach(id => {
    $(id)?.addEventListener('change', ()=> setTimeout(phase3Refresh, 30));
    $(id)?.addEventListener('input', ()=> setTimeout(phase3Refresh, 30));
  });
}


function phase4SyncSectionState(){
  const activeEl = document.activeElement;
  document.querySelectorAll('section[data-tabsection]').forEach(sec => {
    const isActive = sec.classList.contains('is-active');
    if (!isActive && activeEl && sec.contains(activeEl) && typeof activeEl.blur === 'function') {
      try{ activeEl.blur(); }catch(e){}
    }
    sec.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });
}
function phase4NormalizeShellClasses(){
  document.querySelectorAll('section[data-tabsection="today"], section[data-tabsection="journalEntry"], section[data-tabsection="history"], section[data-tabsection="settings"]').forEach(sec => {
    sec.classList.remove('phase0Shell');
    sec.classList.add('phase4Screen');
  });
  ['todayMainSlot','todayQuickSlot','journalMealsSlot','journalActivitySlot','journalSleepSlot','journalDiabSlot','journalMetricsSlot','historyMainSlot','historyTrendSlot','historyHealthSlot','settingsWelcomeSlot','settingsProfileSlot','settingsWatchSlot','settingsGoalsSlot','settingsCloudSlot','settingsHelpSlot'].forEach(id => {
    const slot = $(id);
    if (!slot) return;
    slot.classList.remove('phase0Stack');
    slot.classList.add('phase4Slot');
  });
  $('settingsWatchSlot')?.classList.add('phase4Slot--tight');
  $('journalMetricsSlot')?.classList.add('phase4Slot--tight');
}
function phase4PruneLegacyDom(){
  const out = $('out');
  const todayMount = $('todayMainSlot');
  if (out && todayMount && out.parentNode !== todayMount) todayMount.prepend(out);

  ['outMountGoal','outMountRepas','outMountSynth'].forEach(id => $(id)?.remove());

  const noise = $('historyNoiseCard');
  if (noise && !noise.children.length) noise.remove();

  document.querySelectorAll('section[data-tabsection="welcome"], section[data-tabsection="dash"], section[data-tabsection="goal"], section[data-tabsection="repas"], section[data-tabsection="synth"], section[data-tabsection="journal"], section[data-tabsection="diab"], section[data-tabsection="cloud"], section[data-tabsection="lexicon"]').forEach(sec => {
    const hasMeaningfulChildren = Array.from(sec.children).some(ch => !(ch.classList && ch.classList.contains('legacy-host')));
    if (!hasMeaningfulChildren || sec.classList.contains('legacy-host')) sec.remove();
  });

  document.querySelectorAll('.phase2CompactNotice').forEach(n => n.remove());
}
function phase4StabilizePanels(){
  try{ document.body.classList.add('phase4Shell'); }catch(e){}
  const hint = document.querySelector('.phase1PrimaryNav__hint');
  if (hint) hint.textContent = 'Phase 4 : les wrappers de compatibilité tombent, les panneaux finaux se resserrent et seuls les ancrages encore utiles au JS restent en place.';
  const tag = document.querySelector('.phase1BlockTag');
  if (tag) tag.textContent = 'Phase 4 — stabilisation finale';
  const settingsLead = $('phase2HeroInfoSettings');
  if (settingsLead) settingsLead.dataset.modaltext = 'Les accès globaux vivent avant les espaces et expliquent immédiatement le verrouillage éventuel ; Réglages reste focalisé sur le paramétrage métier.';
}
function phase4Refresh(){
  phase4NormalizeShellClasses();
  phase4PruneLegacyDom();
  phase4StabilizePanels();
  phase4SyncSectionState();
}
function initPhase4Shell(){
  if (window.__phase4ShellInit) return;
  window.__phase4ShellInit = true;
  phase4Refresh();

  ['dayDate','profileSelect','useMode','diabEnabled','montre','histMonth'].forEach(id => {
    $(id)?.addEventListener('change', ()=> setTimeout(phase4Refresh, 30));
    $(id)?.addEventListener('input', ()=> setTimeout(phase4Refresh, 30));
  });
}



function phase5GetActiveSection(){
  return document.querySelector('.tabSection.is-active')?.dataset.tabsection || null;
}
function phase5GetProfileLabel(){
  const sel = $('profileSelect');
  if (!sel) return '—';
  return sel.options?.[sel.selectedIndex]?.text?.trim() || sel.value || '—';
}
function phase5GetModeLabel(){
  const sel = $('useMode');
  if (!sel) return '—';
  return sel.options?.[sel.selectedIndex]?.text?.trim() || sel.value || '—';
}
function phase5GetDateLabel(){
  return $('dayDate')?.value || '—';
}
function phase5GetDiabEnabled(){
  return !!$('diabEnabled')?.checked;
}
function phase5SectionLabel(tab){
  return ({today:'Pilotage',journalEntry:'Journal',history:'Historique',settings:'Réglages'})[tab] || '—';
}
function phase5NormalizeTutorialKey(title){
  const txt = String(title || '').trim();
  if (/Profil/i.test(txt)) return 'profile';
  if (/Objectif/i.test(txt)) return 'goal';
  if (/Dépense|Depense|Montre/i.test(txt)) return 'spend';
  if (/Repères glucides|Cadrage glucidique|Glucides/i.test(txt)) return 'carbs';
  if (/Repas/i.test(txt)) return 'meals';
  if (/Synthèse/i.test(txt)) return 'summary';
  if (/Lecture des tendances|Historique/i.test(txt)) return 'history';
  if (/Diabète/i.test(txt)) return 'diabetes';
  if (/Cloud/i.test(txt)) return 'cloud';
  if (/Lexicon|Lexique/i.test(txt)) return 'lexicon';
  return txt.toLowerCase();
}
function phase5TutorialSpaceMap(){
  return {
    today:['summary'],
    journalEntry:['meals','carbs'],
    history:['history'],
    settings:['profile','goal','spend']
  };
}
function phase5CollectTutorialSources(){
  return Array.from(document.querySelectorAll('details.notice')).map((el) => {
    const summary = el.querySelector('summary');
    const title = (summary?.textContent || '').replace(/\s+/g,' ').trim();
    if (!/^Mini-tuto/i.test(title)) return null;
    const key = phase5NormalizeTutorialKey(title);
    const clone = el.cloneNode(true);
    clone.querySelector('summary')?.remove();
    const bodyHtml = clone.innerHTML.trim();
    const bodyText = clone.textContent.replace(/\s+/g,' ').trim();
    return { key, title, bodyHtml, bodyText, sourceEl: el };
  }).filter(Boolean);
}
function phase5GetTutorialsForSpace(tab){
  const map = phase5TutorialSpaceMap();
  const wanted = map[tab] || [];
  const byKey = new Map(phase5CollectTutorialSources().map(item => [item.key, item]));
  return wanted.map(key => byKey.get(key)).filter(Boolean);
}
function phase5TutorialPreviewText(items){
  if (!items.length) return 'Aucun mini-tuto disponible pour cet espace.';
  const countLabel = items.length > 1 ? 'mini-tutos disponibles' : 'mini-tuto disponible';
  return `${items.length} ${countLabel} : ${items.map(item => item.title.replace(/^Mini-tuto\s*[—-]\s*/i,'')).join(' · ')}.`;
}
function phase5GetTutorialByKey(key){
  return phase5CollectTutorialSources().find(item => item.key === key) || null;
}
function phase5SyncCloudInfoDot(){
  const dot = $('phase5GateCloudInfo');
  if (!dot) return;
  const item = phase5GetTutorialByKey('cloud');
  dot.dataset.modaltext = item?.bodyText || 'Cloud, import/export JSON et opérations sensibles, accessibles depuis tous les espaces.';
  dot.setAttribute('aria-hidden', item ? 'false' : 'true');
  dot.style.display = item ? '' : 'none';
}
function phase5SyncLexiconInfoDot(){
  const dot = $('phase5GateLexiconInfo');
  if (!dot) return;
  const item = phase5GetTutorialByKey('lexicon');
  dot.dataset.modaltext = item?.bodyText || 'Définitions et repères d’usage accessibles à tout moment.';
  dot.setAttribute('aria-hidden', item ? 'false' : 'true');
  dot.style.display = item ? '' : 'none';
}
function phase5SyncGateDisclosureMode(forceDesktopOpen = false){
  const gateDisclosure = $('phase5GlobalGateDisclosure');
  if (!gateDisclosure || !window.matchMedia) return;
  const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prevDesktop = gateDisclosure.dataset.phase5DesktopMode === '1';
  gateDisclosure.dataset.phase5DesktopMode = desktop ? '1' : '0';
  if (!desktop){
    gateDisclosure.open = false;
    return;
  }
  if (forceDesktopOpen || !prevDesktop) gateDisclosure.open = true;
}
function phase5RenderTutorialGate(){
  const tab = phase5GetActiveSection();
  const items = phase5GetTutorialsForSpace(tab);
  const card = $('phase5GateTutoCard');
  const title = $('phase5GateTutoTitle');
  const meta = $('phase5GateTutoMeta');
  const menuBtn = $('btnMenuOpenTutoModal');
  const btn = $('btnGlobalOpenTutoModal');
  const modalTitle = $('settingsTutoTitle');
  const modalIntro = $('phase5TutoModalIntro');
  const modalList = $('phase5TutoModalList');
  const label = phase5SectionLabel(tab);
  if (card){
    card.dataset.space = tab || '';
    card.dataset.hasTutos = items.length ? '1' : '0';
  }
  if (title) title.textContent = `Mini-tutos — ${label}`;
  if (meta) meta.textContent = phase5TutorialPreviewText(items);
  if (menuBtn) menuBtn.disabled = !items.length;
  if (btn) btn.disabled = !items.length;
  if (modalTitle) modalTitle.textContent = `Mini-tutos — ${label}`;
  if (modalIntro) modalIntro.textContent = items.length
    ? `Repères contextuels disponibles pour l’espace ${label.toLowerCase()}.`
    : `Aucun mini-tuto disponible pour l’espace ${label.toLowerCase()}.`;
  if (modalList){
    modalList.innerHTML = items.map((item) => `
      <article class="phase5TutoCard">
        <h3 class="phase5TutoCard__title">${item.title.replace(/^Mini-tuto\s*[—-]\s*/i,'')}</h3>
        <div class="phase5TutoCard__body muted">${item.bodyHtml}</div>
      </article>
    `).join('') || '<div class="phase5EmptyState"><div class="phase5EmptyState__title">Aucun mini-tuto contextuel</div><div class="phase5EmptyState__text">Cet espace ne remonte actuellement aucun repère pédagogique dédié.</div></div>';
  }
}
function phase5EnsureTopContext(){
  const nav = document.querySelector('.phase1PrimaryNav');
  const shellLine = $('phase5ShellLine');
  const gateBar = $('phase5GlobalGateBar');
  if ((!nav && !shellLine) || $('phase5StatusBar')) return;
  const status = document.createElement('div');
  status.className = 'phase5StatusBar';
  status.id = 'phase5StatusBar';
  status.innerHTML = `
    <div class="phase5StatusCard"><div class="phase5StatusLabel">Espace actif</div><div class="phase5StatusValue" id="phase5ActiveSpace">—</div><div class="phase5StatusMeta">Lecture, saisie, analyse ou réglages.</div></div>
    <div class="phase5StatusCard"><div class="phase5StatusLabel">Date pilotée</div><div class="phase5StatusValue" id="phase5ActiveDate">—</div><div class="phase5StatusMeta">Source commune aux blocs journaliers.</div></div>
    <div class="phase5StatusCard"><div class="phase5StatusLabel">Profil actif</div><div class="phase5StatusValue" id="phase5ActiveProfile">—</div><div class="phase5StatusMeta">Toutes les données restent isolées par profil.</div></div>
    <div class="phase5StatusCard"><div class="phase5StatusLabel">Mode / diabète</div><div class="phase5StatusValue" id="phase5ModeDiab">—</div><div class="phase5StatusMeta">Densité d’interface et module conditionnel.</div></div>
    <div class="phase5StatusCard"><div class="phase5StatusLabel">Compromis choisi</div><div class="phase5StatusValue" id="phase5Compromise">Personnalisé</div><div class="phase5StatusMeta" id="phase5CompromiseMeta">Aucun compromis sélectionné.</div></div>
    <div class="phase5StatusCard"><div class="phase5StatusLabel">Objectif suivi</div><div class="phase5StatusValue" id="phase5Goal">—</div><div class="phase5StatusMeta">Preset + cible énergétique actuellement appliqués.</div></div>
  `;
  const gateDisclosure = $('phase5GlobalGateDisclosure');
  if (shellLine){
    if (gateDisclosure && gateDisclosure.parentNode === shellLine){
      shellLine.insertBefore(status, gateDisclosure.nextSibling);
    } else {
      shellLine.appendChild(status);
    }
  } else {
    const statusAnchor = gateDisclosure || $('phase5GlobalGateBar') || nav;
    statusAnchor.insertAdjacentElement('afterend', status);
  }

  const activeToday = document.querySelector('section[data-tabsection="today"] .phase2HeroCard');
  if (activeToday && !$('phase5TodayBanner')){
    const banner = document.createElement('div');
    banner.className = 'phase5Banner';
    banner.id = 'phase5TodayBanner';
    banner.innerHTML = `
      <div>
        <div class="phase5Banner__title">Règle produit stabilisée</div>
        <div class="phase5Banner__text">Pilotage sert à lire vite. Toute correction repart vers Journal. Toute tendance détaillée repart vers Historique.</div>
      </div>
      <div class="phase5Banner__actions">
        <button id="btnPhase5TodayToJournal" type="button">Corriger la journée</button>
        <button id="btnPhase5TodayToHistory" type="button">Voir l’analyse</button>
      </div>
    `;
    activeToday.insertAdjacentElement('afterend', banner);
  }
}
function phase5RenderTopContext(){
  const compromise = phase1SettingsCompromiseState();
  $('phase5ActiveSpace') && ($('phase5ActiveSpace').textContent = phase5SectionLabel(phase5GetActiveSection()));
  $('phase5ActiveDate') && ($('phase5ActiveDate').textContent = phase5GetDateLabel());
  $('phase5ActiveProfile') && ($('phase5ActiveProfile').textContent = phase5GetProfileLabel());
  $('phase5ModeDiab') && ($('phase5ModeDiab').textContent = `${phase5GetModeLabel()} · ${phase5GetDiabEnabled() ? 'Diabète activé' : 'Diabète inactif'}`);
  $('phase5Compromise') && ($('phase5Compromise').textContent = compromise.value);
  $('phase5CompromiseMeta') && ($('phase5CompromiseMeta').textContent = compromise.meta);
  $('phase5Goal') && ($('phase5Goal').textContent = phase1SettingsGoalLabel());

  document.querySelectorAll('.tabBtn[data-tab]').forEach(btn => {
    const active = btn.classList.contains('is-active');
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });
}
function phase5EnsureEmptyState(slotId, stateId, title, text, shouldShow){
  const slot = $(slotId);
  if (!slot) return;
  let state = $(stateId);
  const show = !!shouldShow();
  if (show){
    if (!state){
      state = document.createElement('div');
      state.className = 'phase5EmptyState';
      state.id = stateId;
      state.innerHTML = `<div class="phase5EmptyState__title">${title}</div><div class="phase5EmptyState__text">${text}</div>`;
      slot.appendChild(state);
    }
  } else if (state){
    state.remove();
  }
}
function phase5SlotHasContent(slotId, exceptIds=[]){
  const slot = $(slotId);
  if (!slot) return false;
  return Array.from(slot.children).some(ch => !exceptIds.includes(ch.id));
}
function phase5RenderEmptyStates(){
  phase5EnsureEmptyState(
    'journalDiabSlot',
    'phase5JournalDiabEmpty',
    'Module diabète inactif',
    'Active le module dans Réglages si tu veux saisir glycémies, contexte et suivi glucidique.',
    () => !phase5GetDiabEnabled() && !phase5SlotHasContent('journalDiabSlot', ['phase5JournalDiabEmpty'])
  );
  phase5EnsureEmptyState(
    'historyHealthSlot',
    'phase5HistoryHealthEmpty',
    'Aucun suivi santé détaillé à afficher',
    'L’historique santé reste ici. S’il n’y a pas encore de données ou si le module diabète est coupé, ce panneau reste volontairement léger.',
    () => !phase5SlotHasContent('historyHealthSlot', ['phase5HistoryHealthEmpty'])
  );
  phase5EnsureEmptyState(
    'todayQuickSlot',
    'phase5TodayQuickEmpty',
    'Repères rapides indisponibles',
    'Le cockpit reste lisible même sans mini-cartes secondaires. Les résultats complets du jour restent au centre.',
    () => !phase5SlotHasContent('todayQuickSlot', ['phase5TodayQuickEmpty'])
  );
}
function phase5FlashTarget(id){
  const el = $(id);
  if (!el) return;
  el.classList.remove('phase5TargetFlash');
  void el.offsetWidth;
  el.classList.add('phase5TargetFlash');
}
function phase5GotoJournalAndFlash(slotId){
  return window.__Phase6.Contracts.require('CompositeEntryPoints', 'openJournal')(slotId, { delay:40, behavior:'smooth', block:'start', flashPhase5:true });
}
function phase5GotoHistoryAndFlash(slotId){
  return window.__Phase6.Contracts.require('CompositeEntryPoints', 'openHistory')(slotId, { delay:40, behavior:'smooth', block:'start', flashPhase5:true });
}
function phase5WireButtons(){
  if (window.__phase5ButtonsWired) return;
  window.__phase5ButtonsWired = true;
  document.addEventListener('click', (e)=>{
    if (e.target?.id === 'btnPhase5TodayToJournal') phase5GotoJournalAndFlash('journalMealsSlot');
    if (e.target?.id === 'btnPhase5TodayToHistory') phase5GotoHistoryAndFlash('historyTrendSlot');
  });
  $('btnTodayQuickMeal')?.addEventListener('click', ()=> setTimeout(()=>phase5FlashTarget('journalMealsSlot'), 80));
  $('btnTodayQuickSport')?.addEventListener('click', ()=> setTimeout(()=>phase5FlashTarget('journalActivitySlot'), 80));
  $('btnTodayQuickSleep')?.addEventListener('click', ()=> setTimeout(()=>phase5FlashTarget('journalSleepSlot'), 80));
}
function phase5StabilizeCopy(){
  const hint = document.querySelector('.phase1PrimaryNav__hint');
  if (hint) hint.textContent = 'Phase 5 : hiérarchie stabilisée, états vides explicites, raccourcis cohérents et base QA vérifiable sans toucher au moteur métier.';
  const tag = document.querySelector('.phase1BlockTag');
  if (tag) tag.textContent = 'Phase 5 — stabilisation UX / QA';
  const todayLead = $('phase2HeroInfoToday');
  if (todayLead) todayLead.dataset.modaltext = 'Cockpit de lecture du jour stabilisé. Les corrections repartent dans Journal ; les comparaisons et tendances détaillées repartent dans Historique.';
  const historyLead = $('phase2HeroInfoHistory');
  if (historyLead) historyLead.dataset.modaltext = 'Lecture et compréhension stabilisées. On choisit une date, on relit une journée, puis on repart vers Journal seulement pour corriger.';
  const settingsLead = $('phase2HeroInfoSettings');
  if (settingsLead) settingsLead.dataset.modaltext = 'Les accès globaux vivent avant les espaces et expliquent immédiatement le verrouillage éventuel ; Réglages reste focalisé sur le paramétrage métier.';
}
function phase5ExposeQa(){
  window.phase5QA = function(){
    return {
      activeBtn: document.querySelector('.tabBtn.is-active')?.dataset.tab || null,
      activeSection: phase5GetActiveSection(),
      activeDate: phase5GetDateLabel(),
      activeProfile: phase5GetProfileLabel(),
      useMode: phase5GetModeLabel(),
      diabEnabled: phase5GetDiabEnabled(),
      sections: [...document.querySelectorAll('section[data-tabsection]')].map(el => el.dataset.tabsection),
      activeSections: [...document.querySelectorAll('section[data-tabsection].is-active')].map(el => el.dataset.tabsection),
      todayHasOut: !!$('out') && $('out')?.closest('[data-tabsection]')?.dataset.tabsection === 'today',
      todayQuickHasContent: phase5SlotHasContent('todayQuickSlot', ['phase5TodayQuickEmpty']),
      journalDiabEmptyState: !!$('phase5JournalDiabEmpty'),
      historyHealthHasContent: phase5SlotHasContent('historyHealthSlot', ['phase5HistoryHealthEmpty'])
    };
  };
}
function phase5Refresh(){
  try{ document.body.classList.add('phase5Shell'); }catch(e){}
  phase5EnsureTopContext();
  phase5StabilizeCopy();
  phase5RenderTopContext();
  phase5RenderTutorialGate();
  phase5SyncCloudInfoDot();
  phase5SyncLexiconInfoDot();
  phase5SyncGateDisclosureMode(false);
  phase5RenderEmptyStates();
  phase6SyncShellAvailability();
}

function phaseEllipsisTapGetSettingsCard(){
  return Array.from(document.querySelectorAll('.phase2Screen[data-tabsection="settings"] .card')).find(card => {
    const h2 = card.querySelector('h2');
    return /Répartition protéines\s*\/\s*glucides\s*\/\s*lipides/i.test(h2?.textContent || '');
  }) || null;
}
function phaseEllipsisTapWrapLabel(label){
  if (!label || label.dataset.phaseEllipsisWrapped === '1') return;
  const infoDot = label.querySelector('.info-dot');
  const textNodes = Array.from(label.childNodes).filter(node => {
    if (node === infoDot) return false;
    if (node.nodeType === Node.ELEMENT_NODE){
      if (node.classList?.contains('info-dot')) return false;
      if (node.matches?.('input,select,textarea,button')) return false;
    }
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return false;
    return true;
  });
  if (!textNodes.length) return;
  const span = document.createElement('span');
  span.className = 'phaseEllipsisTap__text';
  textNodes.forEach(node => span.appendChild(node));
  if (infoDot) label.insertBefore(span, infoDot);
  else label.appendChild(span);
  label.dataset.phaseEllipsisWrapped = '1';
}
function phaseEllipsisTapEnsureTarget(el){
  if (!el) return;
  el.classList.add('phaseEllipsisTapTarget');
  if (el.matches('label')){
    phaseEllipsisTapWrapLabel(el);
    el.dataset.phaseEllipsisReady = '1';
    return;
  }
  if (el.matches('select')){
    el.dataset.phaseEllipsisReady = '1';
    return;
  }
  let content = el.querySelector('.phaseEllipsisTap__content');
  if (!content){
    const txt = (el.textContent || '').trim();
    content = document.createElement('span');
    content.className = 'phaseEllipsisTap__content';
    content.textContent = txt;
    el.textContent = '';
    el.appendChild(content);
  } else {
    const looseText = Array.from(el.childNodes)
      .filter(node => node !== content && node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      .map(node => node.textContent)
      .join(' ')
      .trim();
    if (looseText) {
      content.textContent = ((content.textContent || '').trim() + ' ' + looseText).trim();
      Array.from(el.childNodes)
        .filter(node => node !== content && node.nodeType === Node.TEXT_NODE)
        .forEach(node => node.remove());
    }
  }
  el.dataset.phaseEllipsisReady = '1';
}
function phaseEllipsisTapContentNode(el){
  return el?.querySelector('.phaseEllipsisTap__text, .phaseEllipsisTap__content') || el;
}
function phaseEllipsisTapMeasureSelectText(select){
  if (!select) return 0;
  const cs = window.getComputedStyle(select);
  const canvas = phaseEllipsisTapMeasureSelectText._canvas || (phaseEllipsisTapMeasureSelectText._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  const font = [cs.fontStyle, cs.fontVariant, cs.fontWeight, cs.fontSize, cs.fontFamily].filter(Boolean).join(' ');
  ctx.font = font;
  const text = (select.options?.[select.selectedIndex]?.textContent || '').replace(/\s+/g, ' ').trim();
  return ctx.measureText(text).width;
}
function phaseEllipsisTapText(el){
  if (el?.matches?.('select')) {
    return (el.options?.[el.selectedIndex]?.textContent || '').replace(/\s+/g, ' ').trim();
  }
  const node = phaseEllipsisTapContentNode(el);
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}
function phaseEllipsisTapIsTruncated(el){
  if (!el) return false;
  if (el.matches?.('select')) {
    const cs = window.getComputedStyle(el);
    const padL = parseFloat(cs.paddingLeft || '0') || 0;
    const padR = parseFloat(cs.paddingRight || '0') || 0;
    const arrowReserve = 34;
    const available = Math.max(0, el.clientWidth - padL - padR - arrowReserve);
    return (phaseEllipsisTapMeasureSelectText(el) - available) > 1;
  }
  const node = phaseEllipsisTapContentNode(el);
  if (!node) return false;
  return (node.scrollWidth - node.clientWidth) > 1;
}
function phaseEllipsisTapRefreshTitles(scope){
  if (!scope) return;
  scope.querySelectorAll('.phaseEllipsisTapTarget').forEach(el => {
    phaseEllipsisTapEnsureTarget(el);
    const txt = phaseEllipsisTapText(el);
    if (txt && phaseEllipsisTapIsTruncated(el)) el.setAttribute('title', txt);
    else el.removeAttribute('title');
  });
}
function phaseEllipsisTapEnsurePopover(){
  let pop = document.getElementById('phaseEllipsisTapPopover');
  if (pop) return pop;
  pop = document.createElement('div');
  pop.id = 'phaseEllipsisTapPopover';
  pop.className = 'phaseEllipsisTapPopover';
  pop.hidden = true;
  document.body.appendChild(pop);
  return pop;
}
function phaseEllipsisTapHide(){
  const pop = document.getElementById('phaseEllipsisTapPopover');
  if (pop){
    pop.hidden = true;
    pop.textContent = '';
    pop.removeAttribute('data-owner-id');
  }
  document.querySelectorAll('.phaseEllipsisTapTarget.is-open').forEach(el => el.classList.remove('is-open'));
}
function phaseEllipsisTapPlace(pop, owner){
  if (!pop || !owner) return;
  pop.hidden = false;
  pop.style.left = '8px';
  pop.style.top = '8px';
  const rect = owner.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth || 0;
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  const margin = 8;
  const gap = 6;
  const popRect = pop.getBoundingClientRect();
  let left = rect.left;
  if (left + popRect.width > vw - margin) left = Math.max(margin, vw - margin - popRect.width);
  left = Math.max(margin, left);
  let top = rect.bottom + gap;
  if (top + popRect.height > vh - margin) top = Math.max(margin, rect.top - gap - popRect.height);
  top = Math.max(margin, top);
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(top)}px`;
}
function phaseEllipsisTapShow(owner){
  if (!owner) return;
  const txt = phaseEllipsisTapText(owner);
  if (!txt || !phaseEllipsisTapIsTruncated(owner)) return;
  const id = owner.dataset.phaseEllipsisId || `phase-ellipsis-${Math.random().toString(36).slice(2,10)}`;
  owner.dataset.phaseEllipsisId = id;
  const pop = phaseEllipsisTapEnsurePopover();
  document.querySelectorAll('.phaseEllipsisTapTarget.is-open').forEach(el => {
    if (el !== owner) el.classList.remove('is-open');
  });
  owner.classList.add('is-open');
  pop.textContent = txt;
  pop.dataset.ownerId = id;
  phaseEllipsisTapPlace(pop, owner);
}
function phaseEllipsisTapToggle(owner){
  const pop = phaseEllipsisTapEnsurePopover();
  if (!owner) return;
  if (!phaseEllipsisTapIsTruncated(owner)) return;
  const id = owner.dataset.phaseEllipsisId || '';
  if (!pop.hidden && pop.dataset.ownerId === id){
    phaseEllipsisTapHide();
    return;
  }
  phaseEllipsisTapShow(owner);
}
function initPhaseEllipsisTapSettings(){
  if (window.__phaseEllipsisTapSettingsInit) return;
  window.__phaseEllipsisTapSettingsInit = true;
  const settingsCard = phaseEllipsisTapGetSettingsCard();
  if (!settingsCard) return;
  const targets = settingsCard.querySelectorAll([
    '.settingsRow--macros label',
    '.settingsRow--macros .muted',
    '#protRangeHint',
    '#fatRangeHint',
    '#carbGoalHelp',
    '#lowCarbBox label',
    '#lowCarbBox .muted',
    '#carbCalcStatus',
    '#carbCalcCapKg',
    '#carbCalcCapSrc'
  ].join(','));
  targets.forEach(phaseEllipsisTapEnsureTarget);
  const refresh = ()=> requestAnimationFrame(()=> phaseEllipsisTapRefreshTitles(settingsCard));
  const queueHelpPopoverById = (targetId) => {
    const owner = targetId ? settingsCard.querySelector(`#${CSS.escape(String(targetId))}`) : null;
    phaseEllipsisTapHide();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!owner) return;
      phaseEllipsisTapEnsureTarget(owner);
      phaseEllipsisTapRefreshTitles(settingsCard);
      phaseEllipsisTapShow(owner);
    }));
  };
  window.phaseEllipsisTapRequestOpen = function(targetId){
    queueHelpPopoverById(targetId);
  };
  refresh();
  document.addEventListener('click', (e)=>{
    if (e.target.closest('.settingsCarbLowToggle')) {
      phaseEllipsisTapHide();
      return;
    }
    const target = e.target.closest('.phase2Screen[data-tabsection="settings"] .phaseEllipsisTapTarget');
    if (target && settingsCard.contains(target)){
      phaseEllipsisTapToggle(target);
      return;
    }
    if (!e.target.closest('#phaseEllipsisTapPopover')) phaseEllipsisTapHide();
  }, true);
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') phaseEllipsisTapHide(); });
  window.addEventListener('resize', ()=>{ phaseEllipsisTapHide(); refresh(); });
  window.addEventListener('scroll', phaseEllipsisTapHide, true);
  settingsCard.addEventListener('input', ()=>{
    refresh();
    phaseEllipsisTapHide();
  }, true);
  settingsCard.addEventListener('change', ()=>{
    refresh();
    phaseEllipsisTapHide();
  }, true);
  document.addEventListener('carb-ui:help-open-request', (e)=>{
    if (e?.detail?.zone !== 'settingsGoalsSlot') return;
    queueHelpPopoverById(e?.detail?.targetId || '');
  });
  document.addEventListener('carb-ui:help-close-request', (e)=>{
    if (e?.detail?.zone !== 'settingsGoalsSlot') return;
    phaseEllipsisTapHide();
  });
  if (window.ResizeObserver){
    const ro = new ResizeObserver(refresh);
    ro.observe(settingsCard);
  }
}

function initPhase5Shell(){
  if (window.__phase5ShellInit) return;
  window.__phase5ShellInit = true;
  phase5Refresh();
  phase5SyncGateDisclosureMode(true);
  phase5WireButtons();
  phase5ExposeQa();
  initPhaseEllipsisTapSettings();

  $('phase5GlobalGateDisclosure')?.addEventListener('toggle', ()=> {
    const gateDisclosure = $('phase5GlobalGateDisclosure');
    if (!gateDisclosure || !window.matchMedia) return;
    const desktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!desktop && gateDisclosure.open) gateDisclosure.open = false;
  });

  ['dayDate','profileSelect','useMode','diabEnabled','montre','histMonth'].forEach(id => {
    $(id)?.addEventListener('change', ()=> {
      setTimeout(phase5Refresh, 30);
      setTimeout(phase2SyncHistoryQuickNavState, 40);
    });
    $(id)?.addEventListener('input', ()=> {
      setTimeout(phase5Refresh, 30);
      setTimeout(phase2SyncHistoryQuickNavState, 40);
    });
  });
  window.addEventListener('resize', ()=> { setTimeout(phase2SyncHistoryQuickNavState, 40); setTimeout(()=> phase5SyncGateDisclosureMode(false), 20); });
}


