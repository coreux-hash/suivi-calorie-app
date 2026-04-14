(function(global){
  const registry = global.__Phase6Factories || (global.__Phase6Factories = {});

  registry.createBoundaries = function createPhase6Boundaries(ctx){
    const safeCall = ctx.safeCall;
    const originals = ctx.originals || {};

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

    function getAppState(){
      return ctx.AppState || getModule('AppState');
    }

    function getRenderPorts(){
      return getModule('RenderPorts') || {};
    }

    function getNavigationFacade(){
      return getModule('NavigationFacade') || null;
    }

    function getDiabetesUI(){
      return getModule('DiabetesUI') || null;
    }

    const LegacyBoundaryPort = {
      run(kind, payload = {}){
        const AppState = getAppState();
        const RenderPorts = getRenderPorts();

        if (kind === 'journal-day') {
          const date = AppState.setActiveDate(payload.date || AppState.getActiveDate());
          safeCall(originals.loadDayIntoForm, date);
          return { kind, date, source: 'loadDayIntoForm' };
        }

        if (kind === 'history-render') {
          const date = AppState.setActiveDate(payload.date || AppState.getActiveDate());
          const month = AppState.setHistoryMonth(payload.month || date);
          safeCall(originals.historyV2_render, month, date);
          return { kind, date, month, source: 'historyV2_render' };
        }

        if (kind === 'history-panels') {
          const date = AppState.normalizeDate(payload.date || AppState.getActiveDate());
          const month = AppState.setHistoryMonth(payload.month || date);
          safeCall(originals.renderDaysHistory);
          if (typeof RenderPorts.renderSportSleep7d === 'function') RenderPorts.renderSportSleep7d(date);
          if (typeof RenderPorts.updateBodyCompUI === 'function') RenderPorts.updateBodyCompUI(date);
          return { kind, date, month, source: 'renderDaysHistory' };
        }

        if (kind === 'profile-settings') {
          safeCall(originals.loadProfileSettings);
          if (typeof LegacyBridges.updateDiabetesVisibility === 'function') LegacyBridges.updateDiabetesVisibility();
          AppState.syncProfileSelect(AppState.getActiveProfile());
          return { kind, profileId: AppState.getActiveProfile(), source: 'loadProfileSettings' };
        }

        throw new Error(`[Phase6.boundaries] Unknown LegacyBoundaryPort kind: ${kind}`);
      },
      loadJournalDay(dateStr){
        return this.run('journal-day', { date: dateStr });
      },
      renderHistory(dateStr, options = {}){
        return this.run('history-render', { date: dateStr, month: options.month });
      },
      renderHistoryPanels(dateStr, options = {}){
        return this.run('history-panels', { date: dateStr, month: options.month });
      },
      loadProfileSettings(){
        return this.run('profile-settings');
      }
    };

    const CoreBoundaryPort = {
      run(kind, payload = {}){
        const AppState = getAppState();

        if (kind === 'history-panels') {
          const date = AppState.normalizeDate(payload.date || AppState.getActiveDate());
          const month = AppState.setHistoryMonth(payload.month || date);
          const panels = LegacyBoundaryPort.renderHistoryPanels(date, { month });
          return Object.assign({ kind, date, month, source: 'core-history-panels' }, panels || {});
        }

        if (kind === 'profile-settings-save') {
          const profileId = AppState.getActiveProfile();
          const out = safeCall(originals.saveProfileSettings);
          return { kind, profileId, source: 'saveProfileSettings', out };
        }

        if (kind === 'compute') {
          const saveToJournal = payload.saveToJournal !== false;
          const scrollToResults = !!payload.scrollToResults;
          const source = payload.source || 'core-boundary-port';
          const out = safeCall(originals.compute, saveToJournal, scrollToResults);
          return { kind, saveToJournal, scrollToResults, source, out };
        }

        throw new Error(`[Phase6.boundaries] Unknown CoreBoundaryPort kind: ${kind}`);
      },
      renderHistoryPanels(dateStr, options = {}){
        return this.run('history-panels', { date: dateStr, month: options.month });
      },
      saveProfileSettings(options = {}){
        return this.run('profile-settings-save', options);
      },
      compute(options = {}){
        return this.run('compute', options);
      }
    };

    const LegacyLoaders = {
      loadJournalDay(dateStr){
        return LegacyBoundaryPort.loadJournalDay(dateStr);
      },
      loadHistorySelection(dateStr, options = {}){
        return LegacyBoundaryPort.renderHistory(dateStr, options);
      },
      loadHistoryPanels(dateStr, options = {}){
        return LegacyBoundaryPort.renderHistoryPanels(dateStr, options);
      },
      loadProfileSettings(){
        return LegacyBoundaryPort.loadProfileSettings();
      }
    };

    const LegacyBridges = {
      recompute(saveToJournal = true, scrollToResults = false, meta = {}){
        return CoreBoundaryPort.compute({
          saveToJournal: saveToJournal !== false,
          scrollToResults: !!scrollToResults,
          source: meta.source || 'legacy-bridge'
        });
      },
      renderHistoryPanels(dateStr, options = {}){
        return CoreBoundaryPort.renderHistoryPanels(dateStr, options);
      },
      saveProfileSettings(options = {}){
        return CoreBoundaryPort.saveProfileSettings(options);
      },
      recomputeFromGlobal(saveToJournal = true, scrollToResults = false){
        return this.recompute(saveToJournal, scrollToResults, { source:'global-compute' }).out;
      },
      recomputeFromWire(saveToJournal = true, scrollToResults = false){
        return this.recompute(saveToJournal, scrollToResults, { source:'wireEvents' }).out;
      },
      recomputeFromInit(saveToJournal = true, scrollToResults = false){
        return this.recompute(saveToJournal, scrollToResults, { source:'initApp' }).out;
      },
      updateDiabetesVisibility(){
        const AppState = getAppState();
        const DiabetesUI = getDiabetesUI();
        if (typeof global.__phase67LegacyDiabUI === 'function') return safeCall(global.__phase67LegacyDiabUI);
        return {
          date: AppState.getActiveDate(),
          enabled: typeof DiabetesUI?.isEnabled === 'function' ? DiabetesUI.isEnabled() : AppState.isDiabetesEnabled(),
          source:'diabetes-bridge-pending'
        };
      },
      loadJournalDay(dateStr){
        return LegacyBoundaryPort.loadJournalDay(dateStr);
      },
      loadProfileSettings(){
        return LegacyBoundaryPort.loadProfileSettings();
      },
      openTab(tab, options = {}){
        const nav = getNavigationFacade();
        if (nav && typeof nav.openTab === 'function') return nav.openTab(tab, options);
        return safeCall(global.setActiveTab, tab);
      }
    };

    return { CoreBoundaryPort, LegacyBoundaryPort, LegacyLoaders, LegacyBridges };
  };
})(window);
