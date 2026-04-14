/* ======================================================
   PHASE 6 — monolithe modulaire interne
   Objectif : réduire le couplage navigation / état / rendu / recalcul
   sans changer la structure produit ni casser le moteur existant.
   ====================================================== */
function initPhase6Shell(){
  if (window.__phase6ShellInit) return window.__Phase6;
  window.__phase6ShellInit = true;

  const originals = {
    setActiveTab: typeof window.setActiveTab === 'function' ? window.setActiveTab : null,
    compute: typeof window.compute === 'function' ? window.compute : null,
    renderDaysHistory: typeof window.renderDaysHistory === 'function' ? window.renderDaysHistory : null,
    historyV2_render: typeof window.historyV2_render === 'function' ? window.historyV2_render : null,
    loadDayIntoForm: typeof window.loadDayIntoForm === 'function' ? window.loadDayIntoForm : null,
    loadProfileSettings: typeof window.loadProfileSettings === 'function' ? window.loadProfileSettings : null,
    saveProfileSettings: typeof window.saveProfileSettings === 'function' ? window.saveProfileSettings : null,
    createOrActivateProfile: typeof window.createOrActivateProfile === 'function' ? window.createOrActivateProfile : null,
    deleteActiveProfile: typeof window.deleteActiveProfile === 'function' ? window.deleteActiveProfile : null,
    initApp: typeof window.initApp === 'function' ? window.initApp : null,
    getSelectedDate: typeof window.getSelectedDate === 'function' ? window.getSelectedDate : null,
    loadProfiles: typeof window.loadProfiles === 'function' ? window.loadProfiles : null,
    saveProfiles: typeof window.saveProfiles === 'function' ? window.saveProfiles : null,
    getActiveProfile: typeof window.getActiveProfile === 'function' ? window.getActiveProfile : null,
    setActiveProfile: typeof window.setActiveProfile === 'function' ? window.setActiveProfile : null,
    ensureDefaultProfile: typeof window.ensureDefaultProfile === 'function' ? window.ensureDefaultProfile : null,
    refreshProfileSelect: typeof window.refreshProfileSelect === 'function' ? window.refreshProfileSelect : null,
    daysKeyFor: typeof window.daysKeyFor === 'function' ? window.daysKeyFor : null,
    settingsKeyFor: typeof window.settingsKeyFor === 'function' ? window.settingsKeyFor : null,
    DAYS_KEY: typeof window.DAYS_KEY === 'function' ? window.DAYS_KEY : null,
    SETTINGS_KEY: typeof window.SETTINGS_KEY === 'function' ? window.SETTINGS_KEY : null
  };

  function safeCall(fn){
    if (typeof fn !== 'function') return undefined;
    try{ return fn.apply(null, Array.prototype.slice.call(arguments, 1)); }
    catch(err){ console.warn('[Phase6]', err); return undefined; }
  }

  function readJsonStorage(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if (raw == null || raw === '') return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    }catch(err){
      console.warn('[Phase6:storage:read]', key, err);
      return fallback;
    }
  }

  function writeJsonStorage(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }catch(err){
      console.warn('[Phase6:storage:write]', key, err);
      return false;
    }
  }

  const coreFactory = window.__Phase6Factories?.createCore;
  if (typeof coreFactory !== 'function') throw new Error('[Phase6] Missing phase6-core.js / __Phase6Factories.createCore');
  const domById = (typeof $ !== "undefined") ? $ : (globalThis.$ || null);
  const isoTodayFn = (typeof isoToday !== "undefined") ? isoToday : (globalThis.isoToday || function(){ return new Date().toISOString().slice(0,10); });

  const coreCtx = {
    $: domById,
    isoToday: isoTodayFn,
    originals,
    safeCall,
    readJsonStorage,
    writeJsonStorage,
    resolvePhase0Tab: typeof resolvePhase0Tab === 'function' ? resolvePhase0Tab : null,
    modules: null,
    resolve: null
  };
  const { AppShell, AppState, Contracts, GlobalSurface, StateBridge } = coreFactory(coreCtx);

  

  

  const boundariesFactory = window.__Phase6Factories?.createBoundaries;
  if (typeof boundariesFactory !== 'function') throw new Error('[Phase6] Missing phase6-boundaries.js / __Phase6Factories.createBoundaries');
  const boundariesCtx = {
    safeCall,
    originals,
    AppState,
    resolve: (name) => (typeof coreCtx.resolve === 'function' ? coreCtx.resolve(name) : null),
    modules: () => coreCtx.modules || window.__Phase6 || null
  };
  const { CoreBoundaryPort, LegacyBoundaryPort, LegacyLoaders, LegacyBridges } = boundariesFactory(boundariesCtx);

  const renderFactory = window.__Phase6Factories?.createRender;
  if (typeof renderFactory !== 'function') throw new Error('[Phase6] Missing phase6-render.js / __Phase6Factories.createRender');
  const renderCtx = {
    safeCall,
    AppShell,
    AppState,
    CoreBoundaryPort,
    LegacyLoaders,
    resolve: (name) => (typeof coreCtx.resolve === 'function' ? coreCtx.resolve(name) : null),
    modules: () => coreCtx.modules || window.__Phase6 || null
  };
  const { RenderPorts, TodayUI, JournalUI, HistoryUI, SettingsUI, DiabetesUI, DomainRenderers, RenderCoordinator } = renderFactory(renderCtx);

  const flowsFactory = window.__Phase6Factories?.createFlows;
  if (typeof flowsFactory !== 'function') throw new Error('[Phase6] Missing phase6-flows.js / __Phase6Factories.createFlows');
  const flowsCtx = {
    $: domById,
    isoToday: isoTodayFn,
    safeCall,
    AppShell,
    AppState,
    CoreBoundaryPort,
    LegacyBridges,
    RenderPorts,
    RenderCoordinator,
    SettingsUI,
    DiabetesUI
  };
  const { CalculationCoordinator, RefreshFlows, TabSideEffects, CompositeEntryPoints, NavigationFacade, DomainOrchestrator } = flowsFactory(flowsCtx);

  // phase6-flows chunk1 extracted to external factory in ./phase6-flows.js

  const featuresFactory = window.__Phase6Factories?.createFeatures;
  if (typeof featuresFactory !== 'function') throw new Error('[Phase6] Missing phase6-features.js / __Phase6Factories.createFeatures');
  const featuresCtx = {
    $: domById,
    safeCall,
    AppState,
    DomainRenderers,
    LegacyBridges,
    RenderPorts,
    SettingsUI,
    RefreshFlows,
    RenderCoordinator,
    DomainOrchestrator,
    resolve: (name) => (typeof coreCtx.resolve === 'function' ? coreCtx.resolve(name) : null)
  };
  const { LocalMutationFlows, SettingsMutationFlows, SettingsEntryPoints, SettingsConsolidation, SportSleepEntryPoints, DiabetesEntryPoints, ProfileEntryPoints, HistoryEntryPoints, InitializationEntryPoints } = featuresFactory(featuresCtx);

  // phase6-features extracted to external factory in ./phase6-features.js

  const DependencyAudit = {
    summarize(){
      return {
        isolatedNow: [
          'JournalUI.renderForDate no longer invokes compute directly',
          'CalculationCoordinator owns explicit compute calls inside phase-6 flows',
          'RefreshFlows orchestrates render + compute order for date/profile/diabetes mutations',
          'DomainOrchestrator delegates to RefreshFlows instead of chaining UI work inline',
          'LegacyLoaders now fronts the main composite loaders used by phase-6 modules',
          'ProfileEntryPoints / HistoryEntryPoints / InitializationEntryPoints now front the last composite legacy entry sequences',
          'SportSleepEntryPoints and DiabetesEntryPoints now front local journal/diabetes mutations',
          'DomainRenderers now fronts the repeated sport/sleep/diabetes history refresh sequences',
          'SettingsEntryPoints now fronts the main settings autosaves and wireEvents mutations',
          'SettingsConsolidation now removes generic autosave duplicates for fields that already have dedicated entry points',
          'wireEvents critical bindings now route directly through Phase-6 runner helpers; dead fallbacks are disabled unless explicitly re-enabled for QA',
          'orphaned global composite functions are now neutralized into thin delegates owned by Phase-6 entry points'
        ],
        boundaryPortNowOwns: [
          'loadDayIntoForm is now invoked through LegacyBoundaryPort.loadJournalDay',
          'loadProfileSettings is now invoked through LegacyBoundaryPort.loadProfileSettings',
          'historyV2_render is now invoked through LegacyBoundaryPort.renderHistory',
          'renderDaysHistory is now invoked through CoreBoundaryPort.renderHistoryPanels',
          'saveProfileSettings is now invoked through CoreBoundaryPort.saveProfileSettings',
          'compute is now invoked through CoreBoundaryPort.compute and phase-6 RuntimeHooks own post-compute shell refreshes'
        ],
        remainingLegacyCouplings: [
          'loadDayIntoForm remains legacy, but now passes through LegacyLoaders when phase-6 renders an existing day',
          '__updateDiabEnabledUI is now fronted by LegacyBridges, with the legacy implementation kept underneath',
          'compute core logic remains legacy, but CoreBoundaryPort now owns the execution boundary',
          'some legacy flows still target setActiveTab directly, but phase-6 now fronts the main navigation redirects',
          'historyV2_render remains legacy rendering core, but history month/date entry points are now fronted',
          'diab_* storage mutators remain legacy functions, but key entry sequences now pass through phase-6 entry points'
        ],
        nextTargets: [
          'continue replacing residual direct tab intents with NavigationFacade / CompositeEntryPoints',
          'reduce direct DOM mutation inside legacy loaders',
          'continue reducing residual direct setting mutations outside SettingsEntryPoints',
          'remove or neutralize additional orphaned globals once their last callers are verified',
          'collapse residual wireEvents local fallback blocks into module-owned entry points',
          'defer removal of global bridges until wrappers are complete'
        ]
      };
    }
  };


  const LegacyNeutralization = {
    summarize(){
      return {
        neutralizedFunctions: [
          'phase0RunLegacyTabSideEffects',
          'createOrActivateProfile',
          'deleteActiveProfile',
          'initApp',
          'diab_initHistorySuivi'
        ],
        delegatedTo: {
          createOrActivateProfile: 'ProfileEntryPoints.createOrActivate',
          deleteActiveProfile: 'ProfileEntryPoints.deleteActive',
          initApp: 'InitializationEntryPoints.bootApp',
          diab_initHistorySuivi: ['DiabetesEntryPoints.selectHistoryDate','DiabetesEntryPoints.refreshHistoryUI']
        },
        removedFallbacks: [
          'profile mutation inline fallback chain',
          'diabetes history date-change fallback chain',
          'init boot composite body from global initApp()',
          'legacy phase0 tab side-effects placeholder'
        ]
      };
    }
  };


  const ExtractionReadiness = {
    summarize(){
      return {
        canLeaveHistoricalHtmlNext: [
          'phase1/phase3/phase4/phase5 observer shells as a grouped external shell-observers bundle',
          'day storage CRUD helper block around loadDays/saveDays/upsertDay/deleteDay/deleteAllDays/importDays/clearDays',
          'sport/sleep compatibility block that still refreshes history via local helper calls',
          'cloud post-merge refresh tail once folded behind a single phase-6 helper'
        ],
        shouldStayInlineForNow: [
          'compute legacy body',
          'historyV2_render / historyV2_renderCalendar / historyV2_renderSidebar core rendering bodies',
          'loadDayIntoForm legacy body',
          'loadProfileSettings legacy body',
          'saveProfileSettings legacy body'
        ],
        why: [
          'the next extractable HTML blocks are now mostly observer/helpers, not core business logic',
          'internal historical callers have been reduced for saveProfileSettings/renderDaysHistory/historyV2_render',
          'remaining heavy legacy bodies are still the engine and should not move before a deeper port rewrite'
        ]
      };
    }
  };

  

  

  

  coreCtx.resolve = function(name){
    switch(name){
      case 'AppState': return AppState;
      case 'LegacyBoundaryPort': return LegacyBoundaryPort;
      case 'CoreBoundaryPort': return CoreBoundaryPort;
      case 'LegacyBridges': return LegacyBridges;
      case 'GlobalSurface': return GlobalSurface;
      default: return coreCtx.modules?.[name] || window.__Phase6?.[name] || null;
    }
  };

  StateBridge.installLegacyWrappers();

  const RuntimeHooks = {
    afterTabChange(meta = {}){
      ['phase1Refresh','phase4Refresh','phase5Refresh'].forEach((name) => {
        if (typeof window[name] === 'function') safeCall(window[name]);
      });
      return { kind:'after-tab', meta, refreshed:['phase1Refresh','phase4Refresh','phase5Refresh'] };
    },
    afterCompute(meta = {}){
      ['phase1Refresh','phase3Refresh','phase4Refresh','phase5Refresh'].forEach((name) => {
        if (typeof window[name] === 'function') safeCall(window[name]);
      });
      return { kind:'after-compute', meta, refreshed:['phase1Refresh','phase3Refresh','phase4Refresh','phase5Refresh'] };
    },
    summarize(){
      return {
        afterTabChange: ['phase1Refresh','phase4Refresh','phase5Refresh'].filter((name) => typeof window[name] === 'function'),
        afterCompute: ['phase1Refresh','phase3Refresh','phase4Refresh','phase5Refresh'].filter((name) => typeof window[name] === 'function')
      };
    }
  };

  const modules = {
    version: 'phase627_reduce_legacy_surface_and_readiness',
    contracts: {
      keepIds: ['dayDate','profileSelect','histMonth','diabEnabled','out','menuBtn','menuPanel'],
      keepGlobals: [],
      compatibilityGlobals: ['renderDaysHistory','historyV2_render','loadDayIntoForm','loadProfileSettings','saveProfileSettings','__updateDiabEnabledUI'],
      phase6OwnedGlobals: ['setActiveTab','compute'],
      keepFlows: ['tab->render', 'date->journal', 'profile->settings/day', 'diabEnabled->visibility/history'],
      stateBridge: ['loadDayIntoForm','loadProfileSettings','saveProfileSettings','renderDaysHistory','historyV2_render','compute','__updateDiabEnabledUI'],
      split: ['phase6-core','LegacyBoundaryPort','CoreBoundaryPort','LegacyLoaders','DomainRenderers','LegacyBridges','ProfileEntryPoints','HistoryEntryPoints','SportSleepEntryPoints','DiabetesEntryPoints','InitializationEntryPoints','SettingsMutationFlows','SettingsEntryPoints','SettingsConsolidation','NavigationFacade','RenderCoordinator','CalculationCoordinator','RefreshFlows','LocalMutationFlows','TabSideEffects','CompositeEntryPoints','Contracts','DependencyAudit','LegacyNeutralization','ExtractionReadiness','GlobalSurface','RenderPorts'],
      extractedFiles: ['phase6-core.js','phase6-boundaries.js','phase6-render.js','phase6-flows.js','phase6-features.js','phase6-bootstrap.js']
    },
    originals,
    AppShell,
    AppState,
    CoreBoundaryPort,
    CalculationCoordinator,
    LegacyBoundaryPort,
    LegacyLoaders,
    DomainRenderers,
    LegacyBridges,
    RenderPorts,
    TodayUI,
    JournalUI,
    HistoryUI,
    SettingsUI,
    DiabetesUI,
    RenderCoordinator,
    RefreshFlows,
    LocalMutationFlows,
    SettingsMutationFlows,
    SettingsEntryPoints,
    SettingsConsolidation,
    ProfileEntryPoints,
    HistoryEntryPoints,
    SportSleepEntryPoints,
    DiabetesEntryPoints,
    InitializationEntryPoints,
    TabSideEffects,
    CompositeEntryPoints,
    Contracts,
    NavigationFacade,
    DomainOrchestrator,
    DependencyAudit,
    LegacyNeutralization,
    ExtractionReadiness,
    GlobalSurface,
    StateBridge,
    RuntimeHooks
  };

  coreCtx.modules = modules;

  window.__Phase6 = modules;
  window.AppModules = modules;
  window.phase6QA = function(){
    return {
      activeTab: AppShell.getActiveTab(),
      activeDate: AppState.getActiveDate(),
      activeProfile: AppState.getActiveProfile(),
      historyMonth: AppState.getHistoryMonth(),
      diabEnabled: DiabetesUI.isEnabled(),
      daysKey: AppState.getDaysKey(),
      settingsKey: AppState.getSettingsKey(),
      wrappedStateFns: window.__phase63StateWrapped ? Object.keys(window.__phase63StateWrapped).filter(k => window.__phase63StateWrapped[k]) : [],
      coreBoundaryPort: ['run','renderHistoryPanels','saveProfileSettings','compute'].filter(k => typeof CoreBoundaryPort[k] === 'function'),
      compositeEntryPoints: ['openJournal','openHistory','openSettings','openDiabetesJournal','openTodaySummary','openTab'].filter(k => typeof CompositeEntryPoints[k] === 'function'),
      navigationFacade: ['openTab','openJournal','openHistory','openSettings','openDiabetesJournal','openTodaySummary'].filter(k => typeof NavigationFacade[k] === 'function'),
      profileEntryPoints: ['createOrActivate','deleteActive'].filter(k => typeof ProfileEntryPoints[k] === 'function'),
      historyEntryPoints: ['changeMonthBy','setMonth','selectDate','deleteDay','deleteDiabetesData'].filter(k => typeof HistoryEntryPoints[k] === 'function'),
      sportSleepEntryPoints: ['addSportSession','deleteSportSession','saveSleep','renderContext'].filter(k => typeof SportSleepEntryPoints[k] === 'function'),
      diabetesEntryPoints: ['renderAll','refreshHistoryUI','selectHistoryDate','saveSettings','saveMeta','addMeal','clearMeals','applyPer100','addGlucose','clearGlucose','deleteHistoryRow'].filter(k => typeof DiabetesEntryPoints[k] === 'function'),
      renderPorts: ['renderMealsTable','updateBodyCompUI','loadSportSleepIntoUI','renderSportSleep7d','updateQuickDiabetes','renderSportSessionsList','renderSleepSummaryForDay','renderDiabetesAll','refreshDiabetesHistory','refreshDaySelect','syncEatenFromMeals','applyUseMode'].filter(k => typeof RenderPorts[k] === 'function'),
      settingsEntryPoints: ['saveAndRecompute','handleWatchBrandChange','handleDietModeChange','handleCarbGoalChange','handleCarbStepChange','handleCarbCapInput','handleCarbCapChange','handleFatFloorInput','handleFatFloorChange','handleUseModeChange','handlePresetFieldChange','handleProtPerKgChange','handleAutoSaveChange','handleBodyCompChange','handleCarbGuardToggle','handleLowCarbToggle','handleLowCarbLevelChange','handleLowCarbStepChange'].filter(k => typeof SettingsEntryPoints[k] === 'function'),
      settingsConsolidation: SettingsConsolidation.summarize(),
      legacyNeutralization: LegacyNeutralization.summarize(),
      extractionReadiness: ExtractionReadiness.summarize(),
      globalSurface: GlobalSurface.summarize(),
      stateBridge: StateBridge.summarize(),
      runtimeHooks: RuntimeHooks.summarize(),
      shellWrappers: {
        phase1Tab: !!window.__phase1TabWrapped,
        phase1Compute: !!window.__phase1ComputeWrapped,
        phase3Compute: !!window.__phase3ComputeWrapped,
        phase4Tab: !!window.__phase4TabWrapped,
        phase4Compute: !!window.__phase4ComputeWrapped,
        phase5Tab: !!window.__phase5TabWrapped,
        phase5Compute: !!window.__phase5ComputeWrapped
      },
      contractsAudit: Contracts.audit(),
      initializationEntryPoints: ['bootApp'].filter(k => typeof InitializationEntryPoints[k] === 'function'),
      audit: DependencyAudit.summarize(),
      modules: Object.keys(modules).filter(k => typeof modules[k] === 'object')
    };
  };

  if (typeof window.setActiveTab === 'function' && !window.__phase6SetActiveTabWrapped){
    const __setActiveTab = window.setActiveTab;
    window.setActiveTab = function(){
      const targetTab = arguments[0];
      const activeEl = document.activeElement;
      const currentSection = activeEl?.closest?.('section[data-tabsection]')?.dataset?.tabsection || null;
      const nextSection = AppShell.resolveTab(targetTab);
      if (activeEl && currentSection && nextSection && currentSection !== nextSection && typeof activeEl.blur === 'function') {
        try{ activeEl.blur(); }catch(e){}
      }
      return __setActiveTab.apply(this, arguments);
    };
    window.__phase6SetActiveTabWrapped = true;
  }

  return modules;
}

function __phase6BootStart(){
  initPhase6Shell();
  if (typeof wireEvents !== 'function') throw new ReferenceError('wireEvents is not defined');
  wireEvents();
  window.__Phase6?.StateBridge?.attachPostWireBridges?.();
  if (typeof initApp !== 'function') throw new ReferenceError('initApp is not defined');
  initApp();
  if (typeof initPhase1Shell === 'function') initPhase1Shell();
  if (typeof initPhase2Shell === 'function') initPhase2Shell();
  if (typeof initPhase3Shell === 'function') initPhase3Shell();
  if (typeof initPhase4Shell === 'function') initPhase4Shell();
  if (typeof initPhase5Shell === 'function') initPhase5Shell();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __phase6BootStart, { once:true });
} else {
  __phase6BootStart();
}
