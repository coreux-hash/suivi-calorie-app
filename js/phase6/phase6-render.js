(function(global){
  const registry = global.__Phase6Factories || (global.__Phase6Factories = {});

  registry.createRender = function createPhase6Render(ctx){
    const safeCall = ctx.safeCall;
    const AppShell = ctx.AppShell;
    const AppState = ctx.AppState;
    const CoreBoundaryPort = ctx.CoreBoundaryPort;
    const LegacyLoaders = ctx.LegacyLoaders;

    function getPhase6(){
      if (typeof ctx.modules === 'function') return ctx.modules() || null;
      return ctx.modules || global.__Phase6 || null;
    }

    function getModule(name){
      if (typeof ctx.resolve === 'function') {
        const resolved = ctx.resolve(name);
        if (resolved) return resolved;
      }
      return getPhase6()?.[name] || null;
    }

    function getCalculationCoordinator(){
      return getModule('CalculationCoordinator') || null;
    }

    const RenderPorts = {
      renderMealsTable(dateStr){
        return safeCall(global.renderMealsTable, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      updateBodyCompUI(dateStr){
        return safeCall(global.updateBodyCompUI, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      loadSportSleepIntoUI(dateStr){
        return safeCall(global.loadSportSleepIntoUI, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      renderSportSleep7d(dateStr){
        return safeCall(global.renderSportSleep7d, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      updateQuickDiabetes(dateStr){
        return safeCall(global.diab_updateQuickKpis, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      renderSportSessionsList(dateStr){
        return safeCall(global.renderSportSessionsList, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      renderSleepSummaryForDay(dateStr){
        return safeCall(global.renderSleepSummaryForDay, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      renderDiabetesAll(dateStr){
        return safeCall(global.diab_renderAll, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      refreshDiabetesHistory(){
        return safeCall(global.diab_refreshHistoryUI);
      },
      refreshDaySelect(){
        return safeCall(global.refreshDaySelect);
      },
      syncEatenFromMeals(dateStr){
        return safeCall(global.syncEatenFromMeals, AppState.normalizeDate(dateStr || AppState.getActiveDate()));
      },
      applyUseMode(value){
        return safeCall(global.applyUseMode, value);
      }
    };

    const TodayUI = {
      renderContext(dateStr){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        RenderPorts.updateQuickDiabetes(date);
        return { date };
      },
      refresh(options = {}){
        const calc = getCalculationCoordinator();
        return typeof calc?.recompute === 'function'
          ? calc.recompute({ saveToJournal: options.saveToJournal !== false })
          : undefined;
      }
    };

    const DomainRenderers = {
      renderHistoryMonthAndSelection(dateStr, options = {}){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        const month = AppState.setHistoryMonth(options.month || date);
        return LegacyLoaders.loadHistorySelection(date, { month });
      },
      renderSportHistoryContext(dateStr, options = {}){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        const list = RenderPorts.renderSportSessionsList(date);
        const seven = RenderPorts.renderSportSleep7d(date);
        const history = this.renderHistoryMonthAndSelection(date, options);
        return { date, list, seven, history };
      },
      renderSleepHistoryContext(dateStr, options = {}){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        const summary = RenderPorts.renderSleepSummaryForDay(date);
        const seven = RenderPorts.renderSportSleep7d(date);
        const history = this.renderHistoryMonthAndSelection(date, options);
        return { date, summary, seven, history };
      },
      renderDiabetesHistoryContext(dateStr, options = {}){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        const refreshHistory = RenderPorts.refreshDiabetesHistory();
        const history = this.renderHistoryMonthAndSelection(date, options);
        return { date, refreshHistory, history };
      },
      renderDiabetesFull(dateStr, options = {}){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        const rendered = RenderPorts.renderDiabetesAll(date);
        const history = this.renderDiabetesHistoryContext(date, options);
        return { date, rendered, history };
      }
    };

    const JournalUI = {
      renderForDate(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const hasExistingDay = options.forceFresh !== true && AppState.hasDay(date);

        if (hasExistingDay) {
          const loaded = LegacyLoaders.loadJournalDay(date);
          return { date, hasExistingDay: true, requiresCompute: false, rendered: 'existing-day', loaded };
        }

        RenderPorts.renderMealsTable(date);
        RenderPorts.updateBodyCompUI(date);
        RenderPorts.loadSportSleepIntoUI(date);
        RenderPorts.renderSportSleep7d(date);
        RenderPorts.updateQuickDiabetes(date);
        return { date, hasExistingDay: false, requiresCompute: true, rendered: 'empty-day' };
      },
      refreshContext(dateStr){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        RenderPorts.updateQuickDiabetes(date);
        return { date };
      }
    };

    const HistoryUI = {
      render(dateStr, options = {}){
        return LegacyLoaders.loadHistoryPanels(dateStr, options);
      },
      syncSelection(dateStr, options = {}){
        return LegacyLoaders.loadHistorySelection(dateStr, options);
      }
    };

    const SettingsUI = {
      loadProfile(){
        const loaded = LegacyLoaders.loadProfileSettings();
        return loaded.profileId;
      },
      saveProfile(options = {}){
        return CoreBoundaryPort.saveProfileSettings(options);
      },
      syncDerivedControls(){
        const dietMode = AppState.getValue('dietMode', '');
        safeCall(global.lockMacroControls, dietMode === 'custom');
        safeCall(global.updateCarbGuardExplain);
        safeCall(global.updateFatFloorUI);
        safeCall(global.syncCarbModeUI);
        if (dietMode && dietMode !== 'custom') safeCall(global.setDietNote, dietMode, false);
      }
    };

    const DiabetesUI = {
      isEnabled(){
        return AppState.isDiabetesEnabled();
      },
      applyEnabledState(){
        AppState.setDiabetesEnabled(AppState.isDiabetesEnabled());
        const bridges = getModule('LegacyBridges');
        return typeof bridges?.updateDiabetesVisibility === 'function'
          ? bridges.updateDiabetesVisibility()
          : undefined;
      },
      refresh(dateStr){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        RenderPorts.renderDiabetesAll(date);
        RenderPorts.updateQuickDiabetes(date);
        RenderPorts.refreshDiabetesHistory();
        return { date, full: true };
      },
      refreshQuick(dateStr){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        RenderPorts.updateQuickDiabetes(date);
        return { date, full: false };
      }
    };

    const RenderCoordinator = {
      renderProfileContext(){
        const profileId = SettingsUI.loadProfile();
        SettingsUI.syncDerivedControls();
        RenderPorts.refreshDaySelect();
        return { profileId };
      },
      renderJournalForDate(dateStr, options = {}){
        return JournalUI.renderForDate(dateStr, options);
      },
      renderJournalContext(dateStr){
        return JournalUI.refreshContext(dateStr);
      },
      renderHistoryForDate(dateStr, options = {}){
        return HistoryUI.render(dateStr, options);
      },
      renderHistorySelection(dateStr){
        return HistoryUI.syncSelection(dateStr);
      },
      renderDiabetes(dateStr, options = {}){
        return options.full === false ? DiabetesUI.refreshQuick(dateStr) : DiabetesUI.refresh(dateStr);
      },
      renderTodayContext(dateStr){
        return TodayUI.renderContext(dateStr);
      },
      renderTabContext(tab, dateStr){
        const resolvedTab = AppShell.resolveTab(tab);
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        if (resolvedTab === 'history') return { tab: resolvedTab, history: this.renderHistoryForDate(date) };
        if (resolvedTab === 'journalEntry') return { tab: resolvedTab, journal: this.renderJournalContext(date) };
        if (resolvedTab === 'today') return { tab: resolvedTab, today: this.renderTodayContext(date), diab: this.renderDiabetes(date, { full: false }) };
        if (resolvedTab === 'settings') return { tab: resolvedTab, diab: this.renderDiabetes(date, { full: false }) };
        return { tab: resolvedTab, date };
      }
    };

    return { RenderPorts, TodayUI, JournalUI, HistoryUI, SettingsUI, DiabetesUI, DomainRenderers, RenderCoordinator };
  };
})(window);
