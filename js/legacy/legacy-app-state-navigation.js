/* Central application states + declarative navigation registry.
   Browser-compatible legacy script; also exported for Node's native test runner. */
(function(root, factory){
  const api = factory();
  if (root) root.__SCAStateNavigation = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){
  'use strict';

  const REQUIRED_ENERGY_DAYS = 7;

  function nonEmpty(value){
    return String(value ?? '').trim() !== '';
  }

  function positiveNumber(value){
    return Number(value) > 0;
  }

  function createSection(key, label, fields){
    const missing = fields.filter(field => !field.ready).map(field => field.label);
    return {
      key,
      label,
      ready: missing.length === 0,
      missing,
      fields,
      completeCount: fields.length - missing.length,
      totalCount: fields.length
    };
  }

  function normalizeValidIds(values){
    return new Set((Array.isArray(values) ? values : [])
      .map(value => String(value ?? '').trim())
      .filter(Boolean));
  }

  function computeInitialDestination(input = {}){
    const configurationComplete = typeof input === 'boolean'
      ? input
      : input.configurationComplete === true;
    // "today" is the internal legacy id of the Pilotage space.
    return configurationComplete ? 'today' : 'settings';
  }

  function computeConfigurationState(input = {}){
    const validCompromiseIds = normalizeValidIds(input.validCompromiseIds);
    const compromiseId = String(input.compromiseId ?? '').trim();

    const profile = createSection('profile', 'Profils', [
      { key:'sex', label:'Sexe', ready:input.sex === 'M' || input.sex === 'F', value:input.sex },
      { key:'age', label:'Âge', ready:positiveNumber(input.age), value:input.age },
      { key:'height', label:'Taille', ready:positiveNumber(input.height), value:input.height },
      { key:'weight', label:'Poids', ready:positiveNumber(input.weight), value:input.weight }
    ]);
    const watch = createSection('watch', 'Montre', [
      { key:'watchBrand', label:'Marque', ready:nonEmpty(input.watchBrand), value:input.watchBrand },
      { key:'montre', label:'Calories', ready:positiveNumber(input.montre), value:input.montre }
    ]);
    const goals = createSection('goals', 'Objectifs', [
      {
        key:'dietMode',
        label:'Preset',
        ready:nonEmpty(input.dietMode) && input.dietMode !== 'none',
        value:input.dietMode
      }
    ]);
    const compromise = createSection('compromise', 'Compromis', [
      {
        key:'compromiseId',
        label:'Compromis',
        ready:nonEmpty(compromiseId) && validCompromiseIds.has(compromiseId),
        value:compromiseId
      }
    ]);

    const sections = [profile, watch, goals, compromise];
    const firstIncomplete = sections.find(section => !section.ready) || null;
    const configurationComplete = !firstIncomplete;
    return {
      key: configurationComplete ? 'complete' : `${firstIncomplete.key}_incomplete`,
      configurationComplete,
      complete: configurationComplete,
      ready: configurationComplete,
      initialDestination: computeInitialDestination({ configurationComplete }),
      firstIncomplete,
      sections,
      readyCount: sections.filter(section => section.ready).length,
      totalCount: sections.length
    };
  }

  function computeSportLoadAvailable(input = {}){
    // A positive duration is the existing definition of usable sport evidence.
    // Its resulting level may still legitimately be L0.
    return Number(input.sportMinutes) > 0;
  }

  function computeEnergyLoadComplete(input = {}){
    const requiredDays = Number(input.energyRequiredDays ?? REQUIRED_ENERGY_DAYS);
    return requiredDays === REQUIRED_ENERGY_DAYS
      && Number(input.energyValidDays) === requiredDays;
  }

  function computeLoadAvailability(input = {}){
    const sportLoadAvailable = computeSportLoadAvailable(input);
    const energyLoadComplete = computeEnergyLoadComplete(input);
    const loadAvailable = sportLoadAvailable || energyLoadComplete;
    return {
      sportLoadAvailable,
      energyLoadComplete,
      loadAvailable,
      showLoadNudge: !loadAvailable
    };
  }

  function resolveUniqueExactCompromiseId(input = {}){
    if (input.legacySignatureComplete !== true) return '';
    const ids = Array.from(new Set((Array.isArray(input.exactIds) ? input.exactIds : [])
      .map(value => String(value ?? '').trim())
      .filter(Boolean)));
    return ids.length === 1 ? ids[0] : '';
  }

  const NAVIGATION_ENTRIES = Object.freeze([
    // Réglages
    { key:'profile', sourceSpace:'settings', destinationSpace:'settings', targetSelectors:['.settingsPanel--profile'], desktopSelector:'.phase2HeroQuickNav--settings [data-settings-jump="profile"]', mobileSelector:'#settingsJumpFloatPanel [data-settings-jump="profile"]', availability:'always', behavior:'scroll', track:true },
    { key:'watch', sourceSpace:'settings', destinationSpace:'settings', targetSelectors:['.settingsPanel--watch'], desktopSelector:'.phase2HeroQuickNav--settings [data-settings-jump="watch"]', mobileSelector:'#settingsJumpFloatPanel [data-settings-jump="watch"]', availability:'always', behavior:'scroll', track:true },
    { key:'goals', sourceSpace:'settings', destinationSpace:'settings', targetSelectors:['.settingsPanel--goals'], desktopSelector:'.phase2HeroQuickNav--settings [data-settings-jump="goals"]', mobileSelector:'#settingsJumpFloatPanel [data-settings-jump="goals"]', availability:'always', behavior:'scroll', track:true },
    { key:'load', sourceSpace:'settings', destinationSpace:'settings', targetSelectors:['#settingsLoadAnchor','#compromiseSummary','.settingsPanel--goals'], desktopSelector:'.phase2HeroQuickNav--settings [data-settings-jump="load"]', mobileSelector:'#settingsJumpFloatPanel [data-settings-jump="load"]', availability:'always', behavior:'scroll', track:false },
    { key:'compromise', sourceSpace:'settings', destinationSpace:'settings', targetSelectors:['#settingsMacrosAnchor','#settingsCompromiseCard','.settingsPanel--goals'], desktopSelector:'.phase2HeroQuickNav--settings [data-settings-jump="compromise"]', mobileSelector:'#settingsJumpFloatPanel [data-settings-jump="compromise"]', availability:'always', behavior:'scroll', track:true },

    // Pilotage (internal id: today)
    { key:'reading', sourceSpace:'today', destinationSpace:'today', targetSelectors:['#todayReadingPanel'], desktopSelector:'.phase2HeroQuickNav--today [data-today-jump="reading"]', mobileSelector:'#todayJumpFloatPanel [data-today-jump="reading"]', availability:'always', behavior:'scroll' },
    { key:'summary', sourceSpace:'today', destinationSpace:'today', targetSelectors:['#out'], desktopSelector:'.phase2HeroQuickNav--today [data-today-jump="summary"]', mobileSelector:'#todayJumpFloatPanel [data-today-jump="summary"]', availability:'always', behavior:'scroll' },
    { key:'meals', sourceSpace:'today', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--meals'], desktopSelector:'.phase2HeroQuickNav--today [data-today-jump="meals"]', mobileSelector:'#todayJumpFloatPanel [data-today-jump="meals"]', controlSelectors:['#btnTodayGotoJournalMeals','#btnPhase5TodayToJournal'], availability:'always', behavior:'open-and-scroll', crossSpace:true },
    { key:'activity', sourceSpace:'today', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--activity'], desktopSelector:'.phase2HeroQuickNav--today [data-today-jump="activity"]', mobileSelector:'#todayJumpFloatPanel [data-today-jump="activity"]', controlSelectors:['#btnTodayGotoJournalActivity'], availability:'sport', behavior:'open-and-scroll', crossSpace:true },
    { key:'sleep', sourceSpace:'today', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--sleep'], desktopSelector:'.phase2HeroQuickNav--today [data-today-jump="sleep"]', mobileSelector:'#todayJumpFloatPanel [data-today-jump="sleep"]', controlSelectors:['#btnTodayGotoJournalSleep'], availability:'sport', behavior:'open-and-scroll', crossSpace:true },
    { key:'settings', sourceSpace:'today', destinationSpace:'settings', targetSelectors:['.settingsPanel--goals'], desktopSelector:'.phase2HeroQuickNav--today [data-today-jump="settings"]', mobileSelector:'#todayJumpFloatPanel [data-today-jump="settings"]', availability:'always', behavior:'open-and-scroll', crossSpace:true },
    { key:'history', sourceSpace:'today', destinationSpace:'history', targetSelectors:['#historyTrendPanel'], controlSelectors:['#btnTodayGotoHistory','#btnPhase5TodayToHistory'], availability:'expert', behavior:'open-and-scroll', crossSpace:true, bindRegisteredControls:false },

    // Journal
    { key:'meals', sourceSpace:'journalEntry', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--meals'], desktopSelector:'.phase2HeroQuickNav--journal [data-journal-jump="meals"]', mobileSelector:'#journalJumpFloatPanel [data-journal-jump="meals"]', panelSelector:'.phase2JournalPanel--meals', availability:'always', behavior:'scroll', track:true },
    { key:'activity', sourceSpace:'journalEntry', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--activity'], desktopSelector:'.phase2HeroQuickNav--journal [data-journal-jump="activity"]', mobileSelector:'#journalJumpFloatPanel [data-journal-jump="activity"]', panelSelector:'.phase2JournalPanel--activity', hidePanelWhenUnavailable:true, availability:'sport', behavior:'scroll', track:true },
    { key:'sleep', sourceSpace:'journalEntry', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--sleep'], desktopSelector:'.phase2HeroQuickNav--journal [data-journal-jump="sleep"]', mobileSelector:'#journalJumpFloatPanel [data-journal-jump="sleep"]', panelSelector:'.phase2JournalPanel--sleep', hidePanelWhenUnavailable:true, availability:'sport', behavior:'scroll', track:true },
    { key:'metrics', sourceSpace:'journalEntry', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--metrics'], desktopSelector:'.phase2HeroQuickNav--journal [data-journal-jump="metrics"]', mobileSelector:'#journalJumpFloatPanel [data-journal-jump="metrics"]', panelSelector:'.phase2JournalPanel--metrics', availability:'always', behavior:'scroll', track:true },
    { key:'diabetes', sourceSpace:'journalEntry', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--diabetes'], desktopSelector:'.phase2HeroQuickNav--journal [data-journal-jump="diabetes"]', mobileSelector:'#journalJumpFloatPanel [data-journal-jump="diabetes"]', panelSelector:'.phase2JournalPanel--diabetes', hidePanelWhenUnavailable:true, availability:'diabetes', behavior:'scroll', track:true },

    // Historique
    { key:'calendar', sourceSpace:'history', destinationSpace:'history', targetSelectors:['#historyMainPanel'], desktopSelector:'.phase2HeroQuickNav--history [data-history-jump="calendar"]', mobileSelector:'#historyJumpFloatPanel [data-history-jump="calendar"]', controlSelectors:['#btnHistoryGoCalendar'], availability:'always', behavior:'scroll', track:true, requiresVisibleTarget:true },
    { key:'trend', sourceSpace:'history', destinationSpace:'history', targetSelectors:['#historyTrendPanel'], desktopSelector:'.phase2HeroQuickNav--history [data-history-jump="trend"]', mobileSelector:'#historyJumpFloatPanel [data-history-jump="trend"]', panelSelector:'.phase2HistoryPanel--trend', hidePanelWhenUnavailable:true, availability:'expert', behavior:'scroll', track:true, requiresVisibleTarget:true },
    { key:'health', sourceSpace:'history', destinationSpace:'history', targetSelectors:['#historyHealthPanel'], desktopSelector:'.phase2HeroQuickNav--history [data-history-jump="health"]', mobileSelector:'#historyJumpFloatPanel [data-history-jump="health"]', availability:'always', behavior:'scroll', track:true, requiresVisibleTarget:true },
    { key:'activity', sourceSpace:'history', destinationSpace:'journalEntry', targetSelectors:['.phase2JournalPanel--activity'], desktopSelector:'.phase2HeroQuickNav--history [data-history-jump="activity"]', mobileSelector:'#historyJumpFloatPanel [data-history-jump="activity"]', availability:'sport', behavior:'open-and-scroll', crossSpace:true },
    { key:'spend', sourceSpace:'history', destinationSpace:'today', targetSelectors:['#todayReadingPanel'], desktopSelector:'.phase2HeroQuickNav--history [data-history-jump="spend"]', mobileSelector:'#historyJumpFloatPanel [data-history-jump="spend"]', availability:'always', behavior:'open-and-scroll', crossSpace:true },
    { key:'diab', sourceSpace:'history', destinationSpace:'history', targetSelectors:['#historyDiabPanel'], desktopSelector:'.phase2HeroQuickNav--history [data-history-jump="diab"]', mobileSelector:'#historyJumpFloatPanel [data-history-jump="diab"]', panelSelector:'.phase2HistoryPanel--diab', hidePanelWhenUnavailable:true, availability:'diabetes', behavior:'scroll', track:true, requiresVisibleTarget:true },

    // Shared destination used by the two distinct load nudges.
    { key:'load-calendar', sourceSpace:'shared', destinationSpace:'history', targetSelectors:['#historyMainPanel'], controlSelectors:['#loadSeedNudge','#pilotageSettingsLoadNudge'], availability:'always', behavior:'open-and-scroll', crossSpace:true }
  ]);

  function modeMatches(required, mode){
    const current = String(mode || 'simple');
    if (required === 'always') return true;
    if (required === 'sport') return current === 'sport' || current === 'expert';
    if (required === 'expert') return current === 'expert';
    return false;
  }

  function isNavigationEntryAvailable(entry, context = {}){
    if (!entry) return false;
    if (entry.availability === 'diabetes') return context.diabEnabled === true;
    return modeMatches(entry.availability || 'always', context.useMode);
  }

  function getNavigationEntry(sourceSpace, key){
    return NAVIGATION_ENTRIES.find(entry => entry.sourceSpace === sourceSpace && entry.key === key) || null;
  }

  function getNavigationEntries(sourceSpace){
    return NAVIGATION_ENTRIES.filter(entry => !sourceSpace || entry.sourceSpace === sourceSpace);
  }

  function getEntrySelectors(entry, options = {}){
    if (!entry) return [];
    const selectors = [];
    if (entry.desktopSelector) selectors.push(entry.desktopSelector);
    if (entry.mobileSelector) selectors.push(entry.mobileSelector);
    if (options.includeControls !== false && Array.isArray(entry.controlSelectors)) {
      selectors.push(...entry.controlSelectors);
    }
    return Array.from(new Set(selectors.filter(Boolean)));
  }

  return Object.freeze({
    REQUIRED_ENERGY_DAYS,
    NAVIGATION_ENTRIES,
    computeConfigurationState,
    computeInitialDestination,
    computeSportLoadAvailable,
    computeEnergyLoadComplete,
    computeLoadAvailability,
    resolveUniqueExactCompromiseId,
    isNavigationEntryAvailable,
    getNavigationEntry,
    getNavigationEntries,
    getEntrySelectors
  });
});
