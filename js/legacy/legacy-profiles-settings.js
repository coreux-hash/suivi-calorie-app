 /* =====================================================================
   5) Profils / Storage (profil actif, settings, days)
   UI piloté: #profileSelect, #btnCreateProfile, #btnDeleteProfile
   ===================================================================== */

const PROFILES_KEY = "secheapp.profiles.v1";
const ACTIVE_PROFILE_KEY = "secheapp.activeProfile.v1";

      function slugProfile(name) {
        return String(name ?? "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9\-_]/g, "")
          .slice(0, 40);
      }
      function loadProfiles() {
        try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]"); }
        catch { return []; }
      }
      function saveProfiles(list) { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); }
      function getActiveProfile() { return localStorage.getItem(ACTIVE_PROFILE_KEY) || ""; }
      function setActiveProfile(id) { localStorage.setItem(ACTIVE_PROFILE_KEY, id); }

      function ensureDefaultProfile() {
        let profiles = loadProfiles();
        if (profiles.length === 0) {
          profiles = [{ id: "default", label: "default" }];
          saveProfiles(profiles);
          setActiveProfile("default");
        }
        if (!getActiveProfile()) setActiveProfile(profiles[0].id);
      }

      function refreshProfileSelect() {
        const sel = $("profileSelect");
        if (!sel) return;
        const profiles = loadProfiles();
        const active = getActiveProfile();
        sel.innerHTML = "";
        for (const p of profiles) {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.label;
          if (p.id === active) opt.selected = true;
          sel.appendChild(opt);
        }
      }

      function daysKeyFor(profileId) { return `secheapp.${profileId}.days.v6`; }
      function settingsKeyFor(profileId) { return `secheapp.${profileId}.settings.v2`; }
      function DAYS_KEY() { return daysKeyFor(getActiveProfile() || "default"); }
      function SETTINGS_KEY() { return settingsKeyFor(getActiveProfile() || "default"); }
      function createOrActivateProfile(label) {
        return window.__Phase6.Contracts.require('ProfileEntryPoints', 'createOrActivate')(label);
      }

      function deleteActiveProfile() {
        return window.__Phase6.Contracts.require('ProfileEntryPoints', 'deleteActive')();
      }

      function saveProfileSettings() {
          const payload = {
          sex: $("sex").value,
          age: toNum($("age").value),
          height: toNum($("height").value),
          weight: toNum($("weight").value),

          watchBrand: $("watchBrand").value,
          montre: toNum($("montre").value),
          errPct: toNum($("errPct")?.value),
          errMode: $("errMode")?.value,

          dietMode: $("dietMode")?.value,
          goalPct: toNum($("goalPct")?.value),

          protPerKg: toNum($("protPerKg")?.value),
          fatPerKg: toNum($("fatPerKg")?.value),
          fatFloorGPerKg: toNum($("fatFloorGPerKg")?.value),

          carbGoal: $("carbGoal")?.value || "none",
          carbCapGPerKg: toNum($("carbCapGPerKg")?.value),
          ratioCP: toNum($("ratioCP")?.value),
          lowCarbEnabled: !!$("lowCarbEnabled")?.checked,
          lowCarbLevel: $("lowCarbLevel")?.value || "moderate",

          useMode: $("useMode")?.value || "simple",
          compromiseId: $("compromiseSelect")?.value || "",


          diabEnabled: !!$("diabEnabled")?.checked,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(SETTINGS_KEY(), JSON.stringify(payload));
      }

      function loadProfileSettings() {
        let payload = null;
        let hasPersistedSettings = false;
        try {
          const raw = localStorage.getItem(SETTINGS_KEY());
          hasPersistedSettings = !!raw;
          payload = raw ? JSON.parse(raw) : null;
        } catch {}

        if (!payload && !hasPersistedSettings) {
          const defaultDietMode = 'cut_standard';
          if ($('dietMode')) $('dietMode').value = defaultDietMode;
          applyDietPreset(defaultDietMode);
          if (typeof setDietNote === 'function') setDietNote(defaultDietMode);
          if (typeof setProtRangeUI === 'function') setProtRangeUI(defaultDietMode, false);
          if (typeof updateFatFloorUI === 'function') updateFatFloorUI($('carbGoal')?.value || 'none');
          if (typeof lockMacroControls === 'function') lockMacroControls(false);
          window.normalizeDietPresetInputs?.(defaultDietMode);
          return;
        }
        if (!payload) return;

        const has = (k) => Object.prototype.hasOwnProperty.call(payload, k);

        if (has("sex") && payload.sex) $("sex").value = payload.sex;
        if (has("age")) $("age").value = payload.age;
        if (has("height")) $("height").value = payload.height;
        if (has("weight")) $("weight").value = payload.weight;

        if (has("watchBrand") && payload.watchBrand) $("watchBrand").value = payload.watchBrand;
        applyBrandPreset($("watchBrand").value, false);

        if (has("montre")) $("montre").value = payload.montre;
        if (has("errPct") && $("errPct")) $("errPct").value = payload.errPct;
        if (has("errMode") && payload.errMode && $("errMode")) $("errMode").value = payload.errMode;

        if (has("dietMode") && payload.dietMode && $("dietMode")) $("dietMode").value = payload.dietMode;

        if (has("useMode") && $("useMode")) {
          const v = payload.useMode;
          $("useMode").value = (v === "sport" || v === "expert") ? v : "simple";
        }

        if (has("goalPct") && $("goalPct")) $("goalPct").value = payload.goalPct;
        if (has("protPerKg") && $("protPerKg")) $("protPerKg").value = payload.protPerKg;
        if (has("fatPerKg") && $("fatPerKg")) $("fatPerKg").value = payload.fatPerKg;
        if (has("fatFloorGPerKg") && $("fatFloorGPerKg")) $("fatFloorGPerKg").value = payload.fatFloorGPerKg ?? $("fatFloorGPerKg").value;

        if (has("carbGoal") && $("carbGoal")) $("carbGoal").value = payload.carbGoal || $("carbGoal").value;
        if (has("carbCapGPerKg") && $("carbCapGPerKg")) $("carbCapGPerKg").value = payload.carbCapGPerKg ?? 0;
        if (has("ratioCP") && $("ratioCP")) $("ratioCP").value = payload.ratioCP ?? 0;
        if (has("lowCarbEnabled") && $("lowCarbEnabled")) $("lowCarbEnabled").checked = !!payload.lowCarbEnabled;
        if (has("lowCarbLevel") && $("lowCarbLevel") && payload.lowCarbLevel) $("lowCarbLevel").value = payload.lowCarbLevel;
        if (has("compromiseId") && $("compromiseSelect")) {
          $("compromiseSelect").dataset.pendingCompromiseId = payload.compromiseId || "";
          window.__CompromiseUI?.reloadCustomCompromises?.({ preferredValue: payload.compromiseId || '' });
          $("compromiseSelect").value = payload.compromiseId || "";
        }
        window.__CompromiseUI?.refresh?.({ openOnChange:false });
        normalizeCarbCapIntegerStep?.();
        ensureCarbGoalDefaultOption?.();
        if ($("carbGoal")) { updateCarbGoalOptions(false, true); ensureCarbGoalDefaultOption?.(); updateCarbSteps(); lockCarbControls(); syncCarbGuardsFromUI(); }
        if (typeof window.syncCarbUiZone === 'function') window.syncCarbUiZone({ reason:'profile-load', refreshGoalOptions:false, keepGoalValue:true, closeHelp:true });
        window.__CompromiseUI?.syncSelectionFromSettings?.({ keepCurrentIfUnmatched:true, openOnChange:false });
        if (typeof updateFatFloorUI === 'function') updateFatFloorUI();
        if ($("dietMode")) setDietNote($("dietMode").value, false);
        if (typeof lockMacroControls === 'function') {
          const restoredMode = $("dietMode")?.value || 'none';
          lockMacroControls(restoredMode === 'none' || restoredMode === '');
        }
        window.normalizeDietPresetInputs?.($("dietMode")?.value || 'none');
        if (has("diabEnabled") && $("diabEnabled")) $("diabEnabled").checked = !!payload.diabEnabled;
        applyDiabMode($("diabEnabled")?.checked);
        applyUseMode($("useMode")?.value || "simple");
// ✅ Rejouer les UI dérivées du régime au chargement (sinon protRangeHint reste sur "—")
try{
  const mode = $("dietMode")?.value || "none";
  if (mode === "none" || mode === "") {
    // Important : ne pas appeler setDietNoneUI() ici si tu veux garder les valeurs restaurées.
    // On met juste le hint cohérent.
    if ($("protRangeHint")) $("protRangeHint").textContent = "Plage protéines : —";
  } else {
    setProtRangeUI(mode, false); // clampValue=false : on respecte protPerKg restauré
  }
}catch(e){}

      }


function refreshDietDerivedUI(...args){
  return window.__LegacyCompatUI?.refreshDietDerivedUI?.(...args);
}



