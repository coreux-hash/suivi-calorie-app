(function(){
  window.__Phase6Factories = window.__Phase6Factories || {};

  window.__Phase6Factories.createFlows = function createFlows(ctx){
    const {
      $, isoToday, safeCall,
      AppShell, AppState,
      CoreBoundaryPort, LegacyBridges,
      RenderPorts, RenderCoordinator,
      SettingsUI, DiabetesUI
    } = ctx || {};

    const CalculationCoordinator = {
      recompute(options = {}){
        return CoreBoundaryPort.compute({
          saveToJournal: options.saveToJournal !== false,
          scrollToResults: !!options.scrollToResults,
          source: options.source || 'calculation-coordinator'
        }).out;
      },
      recomputeForDate(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const out = this.recompute({ saveToJournal: options.saveToJournal !== false });
        return { date, computed: true, out };
      },
      recomputeIfNeeded(renderMeta, options = {}){
        const date = AppState.normalizeDate(renderMeta?.date || AppState.getActiveDate());
        if (!renderMeta || renderMeta.requiresCompute !== true) {
          return { date, computed: false };
        }
        return this.recomputeForDate(date, options);
      }
    };

    const RefreshFlows = {
      afterProfileChange(profileId){
        if (profileId) AppState.setActiveProfile(profileId);
        const profile = RenderCoordinator.renderProfileContext();
        const accepted = safeCall(isTermsAccepted);
        if ($('ackTerms')) $('ackTerms').checked = !!accepted;
        safeCall(setAppLocked, !accepted);

        const nextDate = AppState.setActiveDate(isoToday());
        const journal = RenderCoordinator.renderJournalForDate(nextDate);
        const compute = CalculationCoordinator.recomputeIfNeeded(journal, { saveToJournal: true });
        const history = RenderCoordinator.renderHistoryForDate(nextDate);
        return { profileId: AppState.getActiveProfile(), date: nextDate, profile, journal, compute, history };
      },

      afterDateChange(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const journal = RenderCoordinator.renderJournalForDate(date);
        const compute = CalculationCoordinator.recomputeIfNeeded(journal, { saveToJournal: true });
        const historySelection = RenderCoordinator.renderHistorySelection(date);
        const diabetes = RenderCoordinator.renderDiabetes(date, { full: false });
        return { date, journal, compute, historySelection, diabetes };
      },

      afterDiabetesToggle(){
        SettingsUI.saveProfile();
        DiabetesUI.applyEnabledState();
        const date = AppState.getActiveDate();
        const diabetes = RenderCoordinator.renderDiabetes(date, { full: true });
        const history = RenderCoordinator.renderHistoryForDate(date);
        return { date, enabled: DiabetesUI.isEnabled(), diabetes, history };
      },

      afterTabChange(tab){
        const resolvedTab = AppShell.resolveTab(tab);
        const date = AppState.getActiveDate();

        if (resolvedTab === 'journalEntry') {
          const journal = RenderCoordinator.renderJournalForDate(date);
          const syncMeals = RenderPorts.syncEatenFromMeals(date);
          const compute = CalculationCoordinator.recompute({ saveToJournal: true });
          return { resolvedTab, date, journal, syncMeals, compute };
        }

        if (resolvedTab === 'today') {
          const today = RenderCoordinator.renderTodayContext(date);
          const diabetes = RenderCoordinator.renderDiabetes(date, { full: false });
          const compute = CalculationCoordinator.recompute({ saveToJournal: true });
          return { resolvedTab, date, today, diabetes, compute };
        }

        if (resolvedTab === 'settings') {
          const diabetes = RenderCoordinator.renderDiabetes(date, { full: false });
          const compute = CalculationCoordinator.recompute({ saveToJournal: true });
          return { resolvedTab, date, diabetes, compute };
        }

        if (resolvedTab === 'history') {
          const historySelection = RenderCoordinator.renderHistorySelection(date);
          const history = RenderCoordinator.renderHistoryForDate(date, { month: AppState.getHistoryMonth(date) });
          return { resolvedTab, date, historySelection, history };
        }

        const render = RenderCoordinator.renderTabContext(resolvedTab, date);
        return { resolvedTab, date, render };
      },

      afterProfileMutation(options = {}){
        const profile = RenderCoordinator.renderProfileContext();
        const targetDate = AppState.setActiveDate(options.forceToday ? isoToday() : AppState.getActiveDate());
        const journal = RenderCoordinator.renderJournalForDate(targetDate);
        const compute = CalculationCoordinator.recomputeIfNeeded(journal, { saveToJournal: true });
        const history = RenderCoordinator.renderHistoryForDate(targetDate);
        return { date: targetDate, reason: options.reason || 'profile-mutation', profile, journal, compute, history };
      },

      afterHistoryMonthChange(monthStr, options = {}){
        const date = AppState.normalizeDate(options.date || AppState.getActiveDate());
        const month = AppState.setHistoryMonth(monthStr || date);
        const history = RenderCoordinator.renderHistoryForDate(date, { month });
        return { date, month, history };
      },

      afterDayDeletion(dateStr, options = {}){
        const date = AppState.setActiveDate(options.date || AppState.getActiveDate() || dateStr || isoToday());
        const journal = RenderCoordinator.renderJournalForDate(date);
        const compute = CalculationCoordinator.recomputeIfNeeded(journal, { saveToJournal: true });
        const history = RenderCoordinator.renderHistoryForDate(date, { month: AppState.getHistoryMonth(date) });
        return { deletedDate: dateStr || null, date, journal, compute, history };
      },

      afterAppBoot(options = {}){
        safeCall(initPhase0Shell);
        safeCall(initTabs);
        safeCall(initPinnedTips);

        safeCall(diab_initHistorySuivi);
        RenderPorts.refreshDiabetesHistory();

        AppState.ensureDefaultProfile();
        AppState.syncProfileSelect();

        const date = AppState.setActiveDate(options.forceToday !== false ? isoToday() : AppState.getActiveDate());

        safeCall(applyBrandPreset, $('watchBrand')?.value, true);

        const profile = RenderCoordinator.renderProfileContext();
        if ($('carbGoal')) safeCall(initCarbGuardsUI);
        const accepted = safeCall(isTermsAccepted);
        if ($('ackTerms')) $('ackTerms').checked = !!accepted;
        safeCall(setAppLocked, !accepted);

        RenderPorts.renderMealsTable(date);
        RenderPorts.loadSportSleepIntoUI(date);
        RenderPorts.renderSportSleep7d(date);
        RenderPorts.updateBodyCompUI(date);
        RenderPorts.applyUseMode($('useMode')?.value || 'simple');

        const history = RenderCoordinator.renderHistoryForDate(date, { month: AppState.getHistoryMonth(date) });

        if (!window.__phase68CloudBooted){
          window.__phase68CloudBooted = true;
          (async () => {
            if (!supa) { cloudMarkReadyState(); return; }
            await handleMagicLinkCallback();
            await cloudRefreshAuthStatus();
          })();
        }

        const compute = LegacyBridges.recomputeFromInit(true);
        return { date, profile, history, compute, booted: true };
      }
    };

    const TabSideEffects = {
      runForTab(tab, options = {}){
        const resolvedTab = AppShell.resolveTab(tab);
        const result = RefreshFlows.afterTabChange(resolvedTab);
        return { resolvedTab, source: options.source || 'setActiveTab', result };
      }
    };

    const CompositeEntryPoints = {
      focusSlot(slotId, options = {}){
        const delay = Number.isFinite(options.delay) ? options.delay : 60;
        setTimeout(() => {
          const el = $(slotId);
          if (!el) return;
          try{ el.scrollIntoView({ behavior: options.behavior || 'smooth', block: options.block || 'start' }); }catch(e){}
          if (options.flashPhase5 && typeof phase5FlashTarget === 'function') {
            try{ phase5FlashTarget(slotId); }catch(e){}
          }
        }, delay);
        return slotId || null;
      },
      openTab(tab, options = {}){
        const resolvedTab = AppShell.resolveTab(tab);
        const nav = AppShell.navigate(resolvedTab);
        if (options.slotId) this.focusSlot(options.slotId, options);
        return { resolvedTab, nav, slotId: options.slotId || null };
      },
      openResolvedTab(tab, options = {}){
        return this.openTab(tab, options);
      },
      openJournal(slotId, options = {}){
        return this.openTab('journalEntry', Object.assign({}, options, { slotId }));
      },
      openHistory(slotId, options = {}){
        return this.openTab('history', Object.assign({}, options, { slotId }));
      },
      openSettings(options = {}){
        return this.openTab('settings', options);
      },
      openDiabetesJournal(options = {}){
        return this.openTab('diab', options);
      },
      openTodaySummary(options = {}){
        return this.openTab('synth', Object.assign({ slotId:'out', delay:40, behavior:'smooth', block:'start' }, options));
      }
    };

    const NavigationFacade = {
      openTab(tab, options = {}){
        return CompositeEntryPoints.openTab(tab, options);
      },
      openJournal(slotId, options = {}){
        return CompositeEntryPoints.openJournal(slotId, options);
      },
      openHistory(slotId, options = {}){
        return CompositeEntryPoints.openHistory(slotId, options);
      },
      openSettings(options = {}){
        return CompositeEntryPoints.openSettings(options);
      },
      openDiabetesJournal(options = {}){
        return CompositeEntryPoints.openDiabetesJournal(options);
      },
      openTodaySummary(options = {}){
        return CompositeEntryPoints.openTodaySummary(options);
      }
    };

    const DomainOrchestrator = {
      handleProfileChange(profileId){
        return RefreshFlows.afterProfileChange(profileId);
      },

      handleDateChange(dateStr){
        return RefreshFlows.afterDateChange(dateStr);
      },

      handleDiabetesToggle(){
        return RefreshFlows.afterDiabetesToggle();
      },

      afterTabChange(tab){
        return RefreshFlows.afterTabChange(tab);
      },

      afterProfileMutation(options = {}){
        return RefreshFlows.afterProfileMutation(options);
      }
    };

    return {
      CalculationCoordinator,
      RefreshFlows,
      TabSideEffects,
      CompositeEntryPoints,
      NavigationFacade,
      DomainOrchestrator
    };
  };
})();
