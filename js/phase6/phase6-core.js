(function(global){
  const registry = global.__Phase6Factories || (global.__Phase6Factories = {});

  registry.createCore = function createPhase6Core(ctx){
    const $ = ctx.$;
    const isoToday = ctx.isoToday;
    const originals = ctx.originals || {};
    const safeCall = ctx.safeCall;
    const readJsonStorage = ctx.readJsonStorage;
    const writeJsonStorage = ctx.writeJsonStorage;
    const resolvePhase0Tab = ctx.resolvePhase0Tab;

    function getPhase6(){
      return ctx.modules || global.__Phase6 || null;
    }

    function getModule(name){
      if (typeof ctx.resolve === 'function') {
        const resolved = ctx.resolve(name);
        if (resolved) return resolved;
      }
      return getPhase6()?.[name] || null;
    }

    const AppShell = {
      resolveTab(tab){
        try{ return typeof resolvePhase0Tab === 'function' ? resolvePhase0Tab(tab) : tab; }catch(e){ return tab; }
      },
      getActiveTab(){
        return document.querySelector('.tabSection.is-active')?.dataset?.tabsection || document.body.getAttribute('data-tab') || null;
      },
      navigate(tab){
        return safeCall(global.setActiveTab, tab);
      }
    };

    const AppState = {
      controls: {
        activeDate: 'dayDate',
        activeProfile: 'profileSelect',
        historyMonth: 'histMonth',
        diabetesEnabled: 'diabEnabled'
      },
      storageKeys: {
        profiles: typeof global.PROFILES_KEY !== 'undefined' ? global.PROFILES_KEY : 'secheapp.profiles.v1',
        activeProfile: typeof global.ACTIVE_PROFILE_KEY !== 'undefined' ? global.ACTIVE_PROFILE_KEY : 'secheapp.activeProfile.v1'
      },
      normalizeDate(dateStr){
        const next = String(dateStr || '').slice(0,10);
        return /^\d{4}-\d{2}-\d{2}$/.test(next) ? next : isoToday();
      },
      normalizeMonth(monthStr, fallbackDate){
        const raw = String(monthStr || '').slice(0,7);
        if (/^\d{4}-\d{2}$/.test(raw)) return raw;
        return this.normalizeDate(fallbackDate || this.getActiveDate()).slice(0,7);
      },
      getEl(id){
        return $(id);
      },
      getValue(id, fallback = ''){
        const el = this.getEl(id);
        if (!el) return fallback;
        if (el.type === 'checkbox') return !!el.checked;
        return el.value ?? fallback;
      },
      setValue(id, value){
        const el = this.getEl(id);
        if (!el) return value;
        if (el.type === 'checkbox') el.checked = !!value;
        else el.value = value ?? '';
        return value;
      },
      getActiveDate(){
        const fromDom = this.getValue(this.controls.activeDate, isoToday());
        return this.normalizeDate(fromDom);
      },
      setActiveDate(dateStr){
        const next = this.normalizeDate(dateStr);
        this.setValue(this.controls.activeDate, next);
        return next;
      },
      hasDay(dateStr){
        try{ return !!global.getDay?.(this.normalizeDate(dateStr)); }catch(e){ return false; }
      },
      getProfiles(){
        const list = readJsonStorage(this.storageKeys.profiles, []);
        return Array.isArray(list) ? list : [];
      },
      saveProfiles(list){
        const normalized = Array.isArray(list) ? list : [];
        writeJsonStorage(this.storageKeys.profiles, normalized);
        return normalized;
      },
      getActiveProfile(){
        const fromStore = localStorage.getItem(this.storageKeys.activeProfile) || '';
        const fromSelect = this.getValue(this.controls.activeProfile, '');
        return String(fromStore || fromSelect || '').trim();
      },
      setActiveProfile(profileId, options = {}){
        const next = String(profileId || '').trim();
        if (!next) return this.getActiveProfile();
        localStorage.setItem(this.storageKeys.activeProfile, next);
        if (options.syncSelect !== false) this.syncProfileSelect(next);
        return next;
      },
      ensureDefaultProfile(){
        let profiles = this.getProfiles();
        if (!profiles.length) {
          profiles = [{ id:'default', label:'default' }];
          this.saveProfiles(profiles);
        }
        const active = this.getActiveProfile() || profiles[0]?.id || 'default';
        this.setActiveProfile(active, { syncSelect:false });
        this.syncProfileSelect(active);
        return active;
      },
      syncProfileSelect(profileId){
        const sel = this.getEl(this.controls.activeProfile);
        const profiles = this.getProfiles();
        const next = String(profileId || this.getActiveProfile() || profiles[0]?.id || '').trim();
        if (!sel) return next;
        sel.innerHTML = '';
        profiles.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.label || p.id;
          if (p.id === next) opt.selected = true;
          sel.appendChild(opt);
        });
        if (next && sel.value !== next) sel.value = next;
        if (!sel.value && profiles[0]?.id) sel.value = profiles[0].id;
        return sel.value || next;
      },
      getHistoryMonth(dateStr){
        const current = this.getValue(this.controls.historyMonth, '');
        return this.normalizeMonth(current, dateStr || this.getActiveDate());
      },
      setHistoryMonth(monthStr){
        const next = this.normalizeMonth(monthStr, this.getActiveDate());
        this.setValue(this.controls.historyMonth, next);
        return next;
      },
      isDiabetesEnabled(){
        return !!this.getValue(this.controls.diabetesEnabled, false);
      },
      setDiabetesEnabled(enabled){
        this.setValue(this.controls.diabetesEnabled, !!enabled);
        return !!enabled;
      },
      getDaysKey(profileId){
        const id = String(profileId || this.getActiveProfile() || 'default').trim() || 'default';
        return `secheapp.${id}.days.v6`;
      },
      getSettingsKey(profileId){
        const id = String(profileId || this.getActiveProfile() || 'default').trim() || 'default';
        return `secheapp.${id}.settings.v2`;
      },
      snapshot(){
        return {
          activeDate: this.getActiveDate(),
          activeProfile: this.getActiveProfile(),
          historyMonth: this.getHistoryMonth(),
          diabEnabled: this.isDiabetesEnabled(),
          daysKey: this.getDaysKey(),
          settingsKey: this.getSettingsKey()
        };
      }
    };

    const Contracts = {
      required: {
        TabSideEffects: ['runForTab'],
        CompositeEntryPoints: ['openTab','openJournal','openHistory','openSettings','openDiabetesJournal','openTodaySummary'],
        HistoryEntryPoints: ['changeMonthBy','setMonth','selectDate','deleteDay','deleteDiabetesData'],
        DomainOrchestrator: ['handleProfileChange','handleDateChange','handleDiabetesToggle','afterTabChange','afterProfileMutation'],
        SettingsEntryPoints: ['handleWatchBrandChange','handleDietModeChange','handleCarbGoalChange','handleCarbStepChange','handleCarbCapInput','handleCarbCapChange','handleFatFloorInput','handleFatFloorChange','handleUseModeChange','handlePresetFieldChange','handleProtPerKgChange','handleAutoSaveChange','handleBodyCompChange','handleCarbGuardToggle','handleLowCarbToggle','handleLowCarbLevelChange','handleLowCarbStepChange'],
        ProfileEntryPoints: ['createOrActivate','deleteActive'],
        SportSleepEntryPoints: ['saveSleep','addSportSession','deleteSportSession','renderContext'],
        DiabetesEntryPoints: ['selectHistoryDate','refreshHistoryUI'],
        InitializationEntryPoints: ['bootApp'],
        LegacyBridges: ['recomputeFromWire','recomputeFromInit','recomputeFromGlobal','updateDiabetesVisibility','loadProfileSettings','loadJournalDay','renderHistoryPanels','saveProfileSettings'],
        LegacyBoundaryPort: ['run','loadJournalDay','renderHistory','renderHistoryPanels','loadProfileSettings'],
        CoreBoundaryPort: ['run','renderHistoryPanels','saveProfileSettings','compute'],
        RenderPorts: ['renderMealsTable','updateBodyCompUI','loadSportSleepIntoUI','renderSportSleep7d','updateQuickDiabetes','renderSportSessionsList','renderSleepSummaryForDay','renderDiabetesAll','refreshDiabetesHistory','refreshDaySelect','syncEatenFromMeals','applyUseMode']
      },
      require(groupName, methodName){
        const owner = getPhase6()?.[groupName];
        const fn = owner?.[methodName];
        if (typeof fn !== 'function') {
          throw new Error(`[Phase6.15] Missing ${groupName}.${methodName}`);
        }
        return fn.bind(owner);
      },
      audit(){
        const missing = [];
        Object.entries(this.required).forEach(([groupName, methods]) => {
          methods.forEach((methodName) => {
            const owner = getPhase6()?.[groupName];
            if (typeof owner?.[methodName] !== 'function') missing.push(`${groupName}.${methodName}`);
          });
        });
        return {
          missing,
          ok: missing.length === 0,
          groups: Object.keys(this.required)
        };
      }
    };

    const GlobalSurface = {
      indispensable: [],
      compatibilityGlobals: ['renderDaysHistory','historyV2_render','loadDayIntoForm','loadProfileSettings','saveProfileSettings','__updateDiabEnabledUI'],
      phase6OwnedGlobals: ['setActiveTab','compute'],
      removedStateBridgeWrappers: ['getSelectedDate','getActiveProfile','setActiveProfile','refreshProfileSelect','ensureDefaultProfile','DAYS_KEY','SETTINGS_KEY','createOrActivateProfile','deleteActiveProfile','initApp'],
      summarize(){
        return {
          indispensable: this.indispensable.slice(),
          compatibilityGlobals: this.compatibilityGlobals.slice(),
          phase6OwnedGlobals: this.phase6OwnedGlobals.slice(),
          removedStateBridgeWrappers: this.removedStateBridgeWrappers.slice(),
          present: this.indispensable.filter((name) => typeof global[name] === 'function'),
          missing: this.indispensable.filter((name) => typeof global[name] !== 'function'),
          compatibilityPresent: this.compatibilityGlobals.filter((name) => typeof global[name] === 'function'),
          compatibilityMissing: this.compatibilityGlobals.filter((name) => typeof global[name] !== 'function'),
          phase6OwnedPresent: this.phase6OwnedGlobals.filter((name) => typeof global[name] === 'function'),
          phase6OwnedMissing: this.phase6OwnedGlobals.filter((name) => typeof global[name] !== 'function')
        };
      }
    };

    const StateBridge = {
      installLegacyWrappers(){
        if (!global.__phase63StateWrapped) global.__phase63StateWrapped = {};

        const boundary = getModule('LegacyBoundaryPort');
        const coreBoundary = getModule('CoreBoundaryPort');
        const appState = getModule('AppState') || AppState;

        if (typeof originals.loadDayIntoForm === 'function' && !global.__phase63StateWrapped.loadDayIntoForm){
          global.loadDayIntoForm = function(dateStr){ return boundary.loadJournalDay(dateStr); };
          global.__phase63StateWrapped.loadDayIntoForm = true;
        }

        if (typeof originals.loadProfileSettings === 'function' && !global.__phase63StateWrapped.loadProfileSettings){
          global.loadProfileSettings = function(){ return boundary.loadProfileSettings(); };
          global.__phase63StateWrapped.loadProfileSettings = true;
        }

        if (typeof originals.saveProfileSettings === 'function' && !global.__phase63StateWrapped.saveProfileSettings){
          global.saveProfileSettings = function(){ return coreBoundary.saveProfileSettings(); };
          global.__phase63StateWrapped.saveProfileSettings = true;
        }

        if (typeof originals.renderDaysHistory === 'function' && !global.__phase63StateWrapped.renderDaysHistory){
          global.renderDaysHistory = function(){ return coreBoundary.renderHistoryPanels(appState.getActiveDate(), { month: appState.getHistoryMonth() }); };
          global.__phase63StateWrapped.renderDaysHistory = true;
        }

        if (typeof originals.historyV2_render === 'function' && !global.__phase63StateWrapped.historyV2_render){
          global.historyV2_render = function(monthYYYYMM, selectedDateStr){
            return boundary.renderHistory(selectedDateStr, { month: monthYYYYMM });
          };
          global.__phase63StateWrapped.historyV2_render = true;
        }
      },
      attachPostWireBridges(){
        if (!global.__phase63StateWrapped) global.__phase63StateWrapped = {};

        const coreBoundary = getModule('CoreBoundaryPort');
        const legacyBridges = getModule('LegacyBridges');

        if (typeof originals.compute === 'function' && !global.__phase63StateWrapped.compute){
          global.compute = function(saveToJournal = true, scrollToResults = false){
            return coreBoundary.compute({ saveToJournal, scrollToResults, source:'global-compute' }).out;
          };
          global.__phase63StateWrapped.compute = true;
        }

        if (typeof global.__phase67LegacyDiabUI === 'function' && !global.__phase63StateWrapped.updateDiabEnabledUI){
          global.__updateDiabEnabledUI = function(){
            return legacyBridges.updateDiabetesVisibility();
          };
          global.__phase63StateWrapped.updateDiabEnabledUI = true;
        }
      },
      summarize(){
        const installed = global.__phase63StateWrapped ? Object.keys(global.__phase63StateWrapped).filter((k) => global.__phase63StateWrapped[k]) : [];
        return {
          installed,
          removed: GlobalSurface.removedStateBridgeWrappers.slice(),
          indispensable: GlobalSurface.indispensable.slice(),
          compatibilityGlobals: GlobalSurface.compatibilityGlobals.slice(),
          phase6OwnedGlobals: GlobalSurface.phase6OwnedGlobals.slice()
        };
      }
    };

    global.__Phase6Physical = Object.assign({}, global.__Phase6Physical, {
      extractedFiles: Array.from(new Set([...(global.__Phase6Physical?.extractedFiles || []), 'phase6-core.js']))
    });

    return { AppShell, AppState, Contracts, GlobalSurface, StateBridge };
  };
})(window);
