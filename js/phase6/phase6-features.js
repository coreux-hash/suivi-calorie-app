(function(){
  window.__Phase6Factories = window.__Phase6Factories || {};

  window.__Phase6Factories.createFeatures = function createFeatures(ctx){
    const {
      $, safeCall, AppState, DomainRenderers, LegacyBridges,
      RenderPorts, SettingsUI, RefreshFlows, RenderCoordinator,
      DomainOrchestrator, resolve
    } = ctx;

    const LocalMutationFlows = {
      afterSportMutation(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const render = DomainRenderers.renderSportHistoryContext(date, { month: options.month || AppState.getHistoryMonth(date) });
        return { date, kind: options.kind || 'sport', render };
      },
      afterSleepMutation(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const render = DomainRenderers.renderSleepHistoryContext(date, { month: options.month || AppState.getHistoryMonth(date) });
        return { date, kind: options.kind || 'sleep', render };
      },
      afterDiabetesMutation(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const full = options.full !== false;
        const render = full
          ? DomainRenderers.renderDiabetesFull(date, { month: options.month || AppState.getHistoryMonth(date) })
          : DomainRenderers.renderDiabetesHistoryContext(date, { month: options.month || AppState.getHistoryMonth(date) });
        return { date, kind: options.kind || 'diabetes', full, render };
      }
    };

    const SettingsMutationFlows = {
      afterSettingsSave(options = {}){
        const date = AppState.setActiveDate(options.dateStr || AppState.getActiveDate());
        const savedProfile = options.saveProfile === false ? null : SettingsUI.saveProfile();
        const compute = options.recompute === false
          ? null
          : LegacyBridges.recompute(options.saveToJournal !== false, !!options.scrollToResults, { source: options.source || 'settings-mutation' });
        return { date, savedProfile, compute, reason: options.reason || 'settings-save' };
      },
      afterBodyCompSave(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const saved = safeCall(saveBodyCompForDay, date);
        const ui = RenderPorts.updateBodyCompUI(date);
        const compute = options.recompute === false
          ? null
          : LegacyBridges.recompute(options.saveToJournal !== false, !!options.scrollToResults, { source: options.source || 'body-comp-mutation' });
        return { date, saved, ui, compute, reason: options.reason || 'body-comp-save' };
      },
      afterDiabetesModeMirror(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        safeCall(applyDiabMode, !!$('diabEnabled')?.checked);
        const savedProfile = SettingsUI.saveProfile();
        const quick = RenderPorts.updateQuickDiabetes(date);
        return { date, savedProfile, quick, reason: options.reason || 'diabetes-mode-mirror' };
      }
    };

    function clearActiveCompromise(){
      const sel = $('compromiseSelect');
      if (!sel || !sel.value) return false;
      sel.value = '';
      globalThis.__CompromiseUI?.refresh?.({ openOnChange:false });
      return true;
    }

    const SettingsEntryPoints = {
      saveAndRecompute(options = {}){
        return SettingsMutationFlows.afterSettingsSave(options);
      },
      handleWatchBrandChange(){
        safeCall(applyBrandPreset, $('watchBrand')?.value, true);
        return SettingsMutationFlows.afterSettingsSave({ reason:'watch-brand-change', source:'settings-watch-brand' });
      },
      handleDietModeChange(){
        const mode = $('dietMode')?.value || '';
        safeCall(lockMacroControls, mode === 'none' || mode === '');

        if (mode === 'none' || mode === '') {
          safeCall(setDietNoneUI);
          safeCall(window.syncCarbUiZone, { reason:'diet-mode-none', refreshGoalOptions:true, keepGoalValue:true, forceGoalNone:true, closeHelp:true });
          window.__CompromiseUI?.syncSelectionFromSettings?.();
        return SettingsMutationFlows.afterSettingsSave({ reason:'diet-mode-none', source:'settings-diet-mode' });
        }

        if (mode !== 'custom') safeCall(applyDietPreset, mode);
        else {
          if ($('goalPct')) $('goalPct').value = '0';
          if ($('protPerKg')) $('protPerKg').value = '0.0';
          if ($('fatPerKg')) $('fatPerKg').value = '0.0';
          if ($('fatFloorGPerKg')) $('fatFloorGPerKg').value = '0.0';
          if ($('ratioCP')) $('ratioCP').value = '0.0';
          if ($('carbCapGPerKg')) $('carbCapGPerKg').value = '0';
          safeCall(setDietNote, 'custom');
          safeCall(window.normalizeDietPresetInputs, 'custom');
        }

        safeCall(setProtRangeUI, mode, true);
        safeCall(window.syncCarbUiZone, { reason:'diet-mode-change', refreshGoalOptions:true, keepGoalValue:false, forceGoalNone:true, closeHelp:true });
        safeCall(lockCarbControls);
        safeCall(lockMacroControls, mode === 'none' || mode === '');
        safeCall(setDietNote, mode);
        safeCall(window.normalizeDietPresetInputs, mode);
        window.__CompromiseUI?.syncSelectionFromSettings?.();
        return SettingsMutationFlows.afterSettingsSave({ reason:'diet-mode-change', source:'settings-diet-mode' });
      },
      handleCarbGoalChange(){
        if (($('carbGoal')?.value || 'none') === 'none' && $('carbCapGPerKg')) $('carbCapGPerKg').value = '0';
        safeCall(normalizeCarbCapIntegerStep);
        if ($('carbGuardEnabled')) {
          $('carbGuardEnabled').disabled = false;
          $('carbGuardEnabled').removeAttribute('aria-disabled');
          $('carbGuardEnabled').closest('label')?.classList.remove('is-disabled');
        }
        safeCall(window.syncCarbUiZone, { reason:'carb-goal-change', refreshGoalOptions:true, keepGoalValue:true, helpTarget:'carbGoal' });
        safeCall(lockCarbControls);
        window.__CompromiseUI?.syncSelectionFromSettings?.();
        return SettingsMutationFlows.afterSettingsSave({ reason:'carb-goal-change', source:'settings-carb-goal' });
      },
      handleCarbStepChange(){
        if ($('carbCapGPerKg')) $('carbCapGPerKg').value = String(Math.round(toNum($('carbStep')?.value) || 0));
        safeCall(normalizeCarbCapIntegerStep);
        safeCall(window.syncCarbUiZone, { reason:'carb-step-change', closeHelp:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'carb-step-change', source:'settings-carb-step' });
      },
      handleCarbCapInput(){
        safeCall(normalizeCarbCapIntegerStep);
        safeCall(window.syncCarbUiZone, { reason:'carb-cap-input', closeHelp:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'carb-cap-input', source:'settings-carb-cap-input', saveProfile:false });
      },
      handleCarbCapChange(){
        safeCall(normalizeCarbCapIntegerStep);
        safeCall(window.syncCarbUiZone, { reason:'carb-cap-change', closeHelp:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'carb-cap-change', source:'settings-carb-cap-change' });
      },
      handleFatFloorInput(){
        return SettingsMutationFlows.afterSettingsSave({ reason:'fat-floor-input', source:'settings-fat-floor-input', saveProfile:false, recompute:false });
      },
      handleFatFloorChange(){
        safeCall(updateFatFloorUI);
        window.__CompromiseUI?.revalidateCurrentSelection?.({ refresh:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'fat-floor-change', source:'settings-fat-floor-change' });
      },
      handleUseModeChange(){
        safeCall(applyUseMode, $('useMode')?.value);
        return SettingsMutationFlows.afterSettingsSave({ reason:'use-mode-change', source:'settings-use-mode' });
      },
      handleDiabetesModeMirror(){
        return SettingsMutationFlows.afterDiabetesModeMirror(AppState.getActiveDate(), { reason:'diabetes-mode-mirror' });
      },
      handleCompromiseChange(){
        const sel = $('compromiseSelect');
        const compromiseId = sel?.value || '';
        if (compromiseId === '__create_custom__') {
          const createdId = globalThis.__CompromiseUI?.createCustomCompromiseFromCurrentState?.() || '';
          if ($('compromiseSelect')) $('compromiseSelect').value = createdId || '';
          globalThis.__CompromiseUI?.applyModeFilter?.($('useMode')?.value || 'expert', { refresh:false });
          globalThis.__CompromiseUI?.refresh?.({ openOnChange:true });
          return SettingsMutationFlows.afterSettingsSave({ reason:'compromise-custom-create', source:'settings-compromise' });
        }

        const applyMap = globalThis.__CompromiseUI?.getApplyMap?.() || globalThis.__CompromiseApplyMap || {};
        const cfg = applyMap[compromiseId] || null;

        if (!cfg) {
          return SettingsMutationFlows.afterSettingsSave({ reason:'compromise-change:no-map', source:'settings-compromise' });
        }

        if ($('dietMode') && cfg.dietMode) $('dietMode').value = String(cfg.dietMode);

        const mode = $('dietMode')?.value || '';
        safeCall(lockMacroControls, mode === 'none' || mode === '');

        if (mode === 'none' || mode === '') {
          safeCall(setDietNoneUI);
          safeCall(window.syncCarbUiZone, { reason:'compromise-diet-none', refreshGoalOptions:true, keepGoalValue:true, forceGoalNone:true, closeHelp:true });
          return SettingsMutationFlows.afterSettingsSave({ reason:'compromise-diet-none', source:'settings-compromise' });
        }

        if (mode !== 'custom') safeCall(applyDietPreset, mode);
        else {
          if ($('goalPct')) $('goalPct').value = '0';
          if ($('protPerKg')) $('protPerKg').value = '0.0';
          if ($('fatPerKg')) $('fatPerKg').value = '0.0';
          if ($('fatFloorGPerKg')) $('fatFloorGPerKg').value = '0.0';
          if ($('ratioCP')) $('ratioCP').value = '0.0';
          if ($('carbCapGPerKg')) $('carbCapGPerKg').value = '0';
          safeCall(setDietNote, 'custom');
          safeCall(window.normalizeDietPresetInputs, 'custom');
        }

        safeCall(setProtRangeUI, mode, true);
        safeCall(window.syncCarbUiZone, { reason:'compromise-diet-mode', refreshGoalOptions:true, keepGoalValue:false, forceGoalNone:true, closeHelp:true });
        safeCall(lockCarbControls);
        safeCall(setDietNote, mode);
        safeCall(window.normalizeDietPresetInputs, mode);

        if ($('carbGoal') && cfg.carbGoal) $('carbGoal').value = String(cfg.carbGoal);
        safeCall(normalizeCarbCapIntegerStep);
        if ($('carbGuardEnabled')) {
          $('carbGuardEnabled').disabled = false;
          $('carbGuardEnabled').removeAttribute('aria-disabled');
          $('carbGuardEnabled').closest('label')?.classList.remove('is-disabled');
        }
        safeCall(window.syncCarbUiZone, { reason:'compromise-carb-goal', refreshGoalOptions:true, keepGoalValue:true, closeHelp:true });
        safeCall(lockCarbControls);

        if ($('protPerKg') && Number.isFinite(Number(cfg.protPerKg))) {
          $('protPerKg').value = Number(cfg.protPerKg).toFixed(1);
        }

        if ($('fatFloorGPerKg') && Number.isFinite(Number(cfg.fatFloorGPerKg))) {
          $('fatFloorGPerKg').value = Number(cfg.fatFloorGPerKg).toFixed(1);
        }
        safeCall(updateFatFloorUI);

        if ($('lowCarbEnabled')) $('lowCarbEnabled').checked = !!cfg.lowCarbEnabled;
        if ($('lowCarbLevel') && cfg.lowCarbLevel) $('lowCarbLevel').value = String(cfg.lowCarbLevel);
        safeCall(window.syncCarbUiZone, { reason:'compromise-low-carb', closeHelp:true });

        window.__CompromiseUI?.syncSelectionFromSettings?.({ keepCurrentIfUnmatched:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'compromise-change', source:'settings-compromise' });
      },
      handlePresetFieldChange(fieldId){
        safeCall(forceCustomIfPresetEdited);
        clearActiveCompromise();
        return SettingsMutationFlows.afterSettingsSave({ reason:`preset-edit:${fieldId || 'unknown'}`, source:'settings-preset-edit' });
      },
      handleProtPerKgChange(){
        const mode = $('dietMode')?.value || 'custom';
        const r = PROT_RANGES[mode];

        if (mode !== 'custom' && r) {
          const v = clamp(toNum($('protPerKg')?.value), r.min, r.max);
          if ($('protPerKg')) $('protPerKg').value = v.toFixed(1);
          safeCall(setProtRangeUI, mode, false);
          window.__CompromiseUI?.revalidateCurrentSelection?.({ refresh:true });
          return SettingsMutationFlows.afterSettingsSave({ reason:'prot-per-kg-range-clamp', source:'settings-prot-per-kg' });
        }

        window.__CompromiseUI?.revalidateCurrentSelection?.({ refresh:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'prot-per-kg-change', source:'settings-prot-per-kg' });
      },
      handleRatioCPChange(){
        const ratio = $('ratioCP');
        if (!ratio) return SettingsMutationFlows.afterSettingsSave({ reason:'ratio-cp-change', source:'settings-ratio-cp' });
        const min = Number.isFinite(Number(ratio.min)) ? Number(ratio.min) : 0;
        const max = Number.isFinite(Number(ratio.max)) ? Number(ratio.max) : 10;
        const step = Number.isFinite(Number(ratio.step)) && Number(ratio.step) > 0 ? Number(ratio.step) : 0.1;
        const raw = toNum(ratio.value);
        const clamped = clamp(raw, min, max);
        const snapped = Math.round(clamped / step) * step;
        ratio.value = Number(snapped).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
        if (!ratio.disabled && !ratio.classList.contains('hidden') && !($('lowCarbEnabled')?.checked)) {
          clearActiveCompromise();
        }
        return SettingsMutationFlows.afterSettingsSave({ reason:'ratio-cp-change', source:'settings-ratio-cp' });
      },
      handleAutoSaveChange(fieldId){
        return SettingsMutationFlows.afterSettingsSave({ reason:`autosave:${fieldId || 'unknown'}`, source:'settings-autosave' });
      },
      handleBodyCompChange(dateStr, options = {}){
        return SettingsMutationFlows.afterBodyCompSave(dateStr, { reason:`body-comp:${options.fieldId || 'unknown'}`, source:'settings-body-comp' });
      },
      handleCarbGuardToggle(){
        safeCall(window.syncCarbUiZone, { reason:'carb-guard-toggle', closeHelp:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'carb-guard-toggle', source:'settings-carb-guard' });
      },
      handleLowCarbToggle(){
        safeCall(window.syncCarbUiZone, { reason:'low-carb-toggle', closeHelp:true });
        window.__CompromiseUI?.syncSelectionFromSettings?.();
        return SettingsMutationFlows.afterSettingsSave({ reason:'low-carb-toggle', source:'settings-low-carb-toggle' });
      },
      handleLowCarbLevelChange(){
        safeCall(window.syncCarbUiZone, { reason:'low-carb-level-change', closeHelp:true });
        window.__CompromiseUI?.syncSelectionFromSettings?.();
        return SettingsMutationFlows.afterSettingsSave({ reason:'low-carb-level-change', source:'settings-low-carb-level' });
      },
      handleLowCarbStepChange(){
        safeCall(window.syncCarbUiZone, { reason:'low-carb-step-change', closeHelp:true });
        return SettingsMutationFlows.afterSettingsSave({ reason:'low-carb-step-change', source:'settings-low-carb-step' });
      }
    };

    const SettingsConsolidation = {
      dedicatedChangeIds: [
        'watchBrand','dietMode','carbGoal','carbStep','carbCapGPerKg','fatFloorGPerKg','useMode',
        'goalPct','fatPerKg','protPerKg','carbGuardEnabled','lowCarbEnabled','lowCarbLevel','lowCarbStep',
        'morningWeight','fatPct','musclePct','boneKg','diabEnabled'
      ],
      genericAutoSaveIds: ['sex','age','height','weight','montre','errPct','errMode'],
      isDedicated(id){
        return this.dedicatedChangeIds.includes(String(id || ''));
      },
      getGenericAutoSaveIds(){
        return this.genericAutoSaveIds.slice();
      },
      summarize(){
        return {
          dedicatedChangeIds: this.dedicatedChangeIds.slice(),
          genericAutoSaveIds: this.getGenericAutoSaveIds()
        };
      }
    };

    const SportSleepEntryPoints = {
      addSportSession(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        safeCall(addSportSessionFromInputs, date);
        if (options.showPill) safeCall(showSavedPill, 'sportSavedPill');
        if (options.closeEditor) safeCall(sportUI_setEditor, false);
        const refresh = LocalMutationFlows.afterSportMutation(date, { kind:'sport-session-add' });
        return { date, saved:true, refresh };
      },
      deleteSportSession(dateStr, sessionId, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        safeCall(deleteSportSession, date, sessionId);
        if (options.showPill) safeCall(showSavedPill, 'sportSavedPill');
        const refresh = LocalMutationFlows.afterSportMutation(date, { kind:'sport-session-delete' });
        return { date, sessionId, deleted:true, refresh };
      },
      saveSleep(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        safeCall(saveSleepForDay, date);
        if (options.showPill) safeCall(showSavedPill, 'sleepSavedPill');
        if (options.closeEditor) safeCall(sleepUI_setEditMode, false);
        RenderPorts.renderSleepSummaryForDay(date);
        const refresh = LocalMutationFlows.afterSleepMutation(date, { kind:'sleep-save' });
        return { date, saved:true, refresh };
      },
      renderContext(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        return DomainRenderers.renderSportHistoryContext(date, { month: AppState.getHistoryMonth(date) });
      }
    };

    const DiabetesEntryPoints = {
      renderAll(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const refresh = LocalMutationFlows.afterDiabetesMutation(date, { kind: options.kind || 'render-all', full:true });
        return { date, refresh };
      },
      refreshHistoryUI(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const refresh = LocalMutationFlows.afterDiabetesMutation(date, { kind: options.kind || 'history-refresh', full:false });
        return { date, refresh };
      },
      selectHistoryDate(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const refresh = RefreshFlows.afterDateChange(date);
        const diabetes = LocalMutationFlows.afterDiabetesMutation(date, { kind:'history-date-select', full:false });
        return { date, refresh, diabetes };
      },
      saveSettings(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const settings = safeCall(diab_saveSettings);
        const refresh = LocalMutationFlows.afterDiabetesMutation(date, { kind:'settings-save', full:true });
        return { date, settings, refresh };
      },
      saveMeta(dateStr, options = {}){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        safeCall(diab_saveMetaFromUI, date);
        safeCall(diab_syncMomentChips);
        const refresh = LocalMutationFlows.afterDiabetesMutation(date, { kind: options.source || 'meta-save', full:false });
        return { date, saved:true, refresh };
      },
      addMeal(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const added = safeCall(diab_addMealFromInputs);
        return { date, added, refresh: { kind:'meal-add', date } };
      },
      clearMeals(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const cleared = safeCall(diab_clearMealsForDay);
        return { date, cleared, refresh: { kind:'meal-clear', date } };
      },
      applyPer100(){
        return { applied:true, out: safeCall(diab_applyPer100ToMeal) };
      },
      addGlucose(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const added = safeCall(diab_addGlucoseFromInputs);
        const refresh = LocalMutationFlows.afterDiabetesMutation(date, { kind:'glucose-add', full:false });
        return { date, added, refresh };
      },
      clearGlucose(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const cleared = safeCall(diab_clearGlucoseForDay);
        const refresh = LocalMutationFlows.afterDiabetesMutation(date, { kind:'glucose-clear', full:false });
        return { date, cleared, refresh };
      },
      deleteHistoryRow(dateStr){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        safeCall(diab_deleteDiabHistoryRow, date);
        const activeDate = AppState.getActiveDate();
        const refreshDate = activeDate === date ? activeDate : activeDate;
        const refresh = LocalMutationFlows.afterDiabetesMutation(refreshDate, { kind:'history-row-delete', full:false });
        return { date, deleted:true, refresh };
      }
    };

    const ProfileEntryPoints = {
      createOrActivate(label){
        const cleanLabel = String(label ?? '').trim();
        if (!cleanLabel) return { created:false, reason:'empty-label' };
        const id = slugProfile(cleanLabel) || 'profile';
        const profiles = AppState.getProfiles();
        if (!profiles.find(p => p.id === id)) {
          profiles.push({ id, label: cleanLabel });
          AppState.saveProfiles(profiles);
        }
        AppState.setActiveProfile(id);
        AppState.syncProfileSelect(id);
        const flow = DomainOrchestrator.afterProfileMutation({ reason:'create-profile', forceToday:false });
        return { created:true, profileId:id, flow };
      },
      deleteActive(){
        const active = AppState.getActiveProfile();
        if (active === 'default') {
          alert("Le profil 'default' ne peut pas être supprimé.");
          return { deleted:false, reason:'protected-default' };
        }
        localStorage.removeItem(AppState.getDaysKey(active));
        localStorage.removeItem(AppState.getSettingsKey(active));
        const profiles = AppState.getProfiles().filter(p => p.id !== active);
        AppState.saveProfiles(profiles);
        const next = profiles[0]?.id || 'default';
        AppState.setActiveProfile(next);
        AppState.syncProfileSelect(next);
        const flow = DomainOrchestrator.afterProfileMutation({ reason:'delete-profile', forceToday:true });
        return { deleted:true, profileId:active, nextProfileId:next, flow };
      }
    };

    const HistoryEntryPoints = {
      changeMonthBy(step){
        const current = AppState.getHistoryMonth(AppState.getActiveDate());
        const d = new Date(current + '-01T00:00:00');
        d.setMonth(d.getMonth() + Number(step || 0));
        const month = ymLocal(d);
        return RefreshFlows.afterHistoryMonthChange(month);
      },
      setMonth(monthStr){
        return RefreshFlows.afterHistoryMonthChange(monthStr);
      },
      selectDate(dateStr){
        const date = AppState.setActiveDate(dateStr || AppState.getActiveDate());
        const refresh = RefreshFlows.afterDateChange(date);
        const history = RenderCoordinator.renderHistoryForDate(date, { month: AppState.getHistoryMonth(date) });
        return { date, refresh, history };
      },
      deleteDay(dateStr){
        if (typeof deleteDay === 'function') {
          deleteDay(dateStr);
        } else {
          AppState.setActiveDate(dateStr);
          $('btnDeleteDay')?.click();
          return { delegated:true, date:dateStr, source:'btnDeleteDay' };
        }
        return RefreshFlows.afterDayDeletion(dateStr);
      },
      deleteDiabetesData(dateStr){
        const date = AppState.normalizeDate(dateStr || AppState.getActiveDate());
        safeCall(diab_deleteDiabDataForDay, date);
        const refresh = LocalMutationFlows.afterDiabetesMutation(AppState.getActiveDate(), { kind:'history-diabetes-delete', full:false, month: AppState.getHistoryMonth(date) });
        return { date, deleted:true, scope:'diabetes-only', refresh };
      }
    };

    const InitializationEntryPoints = {
      bootApp(options = {}){
        return RefreshFlows.afterAppBoot(options);
      }
    };

    return {
      LocalMutationFlows,
      SettingsMutationFlows,
      SettingsEntryPoints,
      SettingsConsolidation,
      SportSleepEntryPoints,
      DiabetesEntryPoints,
      ProfileEntryPoints,
      HistoryEntryPoints,
      InitializationEntryPoints
    };
  };
})();
