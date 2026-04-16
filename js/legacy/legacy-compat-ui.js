
(function(global){
  const ns = global.__LegacyCompatUI || (global.__LegacyCompatUI = {});
  const doc = global.document;
  const $ = (id) => {
    if (typeof global.$ === 'function') return global.$(id);
    return doc ? doc.getElementById(id) : null;
  };
  const toNum = (v) => {
    if (typeof global.toNum === 'function') return global.toNum(v);
    const s = String(v ?? '').replace(',', '.').trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };
  const escapeHtml = (str) => {
    if (typeof global.escapeHtml === 'function') return global.escapeHtml(str);
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  const FAT_FLOORS = global.FAT_FLOORS || {
    strict:   { min: 0.8, note: 'Plancher 0,8 g/kg (socle hormonal + vitamines).' },
    sport:    { min: 0.8, note: 'Plancher 0,8 g/kg (souvent 0,8–0,9 selon charge).' },
    recomp:   { min: 0.9, note: 'Plancher 0,9 g/kg (stabilité & durée).' },
    maintain: { min: 0.9, note: 'Plancher 0,9 g/kg (souvent 0,9–1,0 en maintien actif).' },
    volume:   { min: 0.9, note: 'Plancher 0,9 g/kg (volume/endurance : récupération et densité énergétique).' },
    carbload: { min: 0.8, note: 'Plancher 0,8 g/kg (carb-loading : lipides volontairement plus bas).' },
    none:     { min: 0.0, note: 'Plancher lipides désactivé.' },
    custom:   { min: 0.0, note: 'Plancher lipides personnalisé.' }
  };


  const round = (v, d = 1) => {
    if (typeof global.round === 'function') return global.round(v, d);
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    const p = 10 ** d;
    return Math.round(n * p) / p;
  };
  const FAT_FLOOR_RANGES_BY_DIET = global.FAT_FLOOR_RANGES_BY_DIET || {
    none:   { min: 0.0, max: 5.0 },
    custom: { min: 0.0, max: 2.0 },
    cut_standard:   { min: 0.8, max: 1.0 },
    cut_aggressive: { min: 0.8, max: 0.9 },
    recomp:         { min: 0.9, max: 1.1 },
    maintain:       { min: 0.9, max: 1.1 },
    endurance:      { min: 0.9, max: 1.1 }
  };
  const PROT_RANGES_BY_DIET = {
    cut_standard:   { min: 1.7, max: 2.3 },
    cut_aggressive: { min: 2.0, max: 2.6 },
    recomp:         { min: 1.6, max: 2.3 },
    maintain:       { min: 1.4, max: 1.9 },
    endurance:      { min: 1.5, max: 2.0 }
  };

  const CARB_GOAL_ALIAS = {
    none: 'none',
    off: 'none',
    dry_strict: 'strict',
    dry_sport: 'sport',
    recomp: 'recomp',
    maintain_active: 'maintain',
    endurance_volume: 'volume',
    carb_loading: 'carbload'
  };
  const normCarbGoalKey = (v) => CARB_GOAL_ALIAS[(v || 'none')] || (v || 'none');

  const WATCH_ESTIMATION_PROFILES = {
    custom:{ label:"Personnalisé", defaultErrPct:20, defaultMode:"conservative", confidence:"variable", role:"aucune hypothèse", notes:"Aucune hypothèse implicite. L’erreur est définie par l’utilisateur." },
    apple:{ label:"Apple Watch", defaultErrPct:25, defaultMode:"conservative", confidence:"modérée", role:"profil statistique", notes:"Profil d’estimation initial. Forte variabilité selon l’activité." },
    garmin:{ label:"Garmin", defaultErrPct:20, defaultMode:"optimistic", confidence:"modérée", role:"profil statistique", notes:"Profil d’estimation initial. Variabilité importante selon contexte." },
    polar:{ label:"Polar", defaultErrPct:20, defaultMode:"optimistic", confidence:"modérée", role:"profil statistique", notes:"Profil d’estimation initial. L’énergie reste une estimation bruitée." },
    coros:{ label:"COROS", defaultErrPct:25, defaultMode:"optimistic", confidence:"limitée", role:"profil terrain", notes:"Peu de validations indépendantes sur l’énergie. Valeur prudente." },
    samsung:{ label:"Samsung", defaultErrPct:30, defaultMode:"conservative", confidence:"faible", role:"profil grand public", notes:"Valeur conservatrice par manque de données robustes." },
    suunto:{ label:"Suunto", defaultErrPct:25, defaultMode:"optimistic", confidence:"limitée", role:"profil terrain", notes:"Variabilité élevée selon l’activité." },
    huawei:{ label:"Huawei", defaultErrPct:30, defaultMode:"conservative", confidence:"faible", role:"profil grand public", notes:"Peu de données indépendantes sur l’estimation calorique." },
    amazfit:{ label:"Amazfit", defaultErrPct:30, defaultMode:"conservative", confidence:"faible", role:"profil grand public", notes:"Estimation calorique indicative uniquement." },
    fitbit:{ label:"Fitbit / Google", defaultErrPct:25, defaultMode:"conservative", confidence:"modérée", role:"profil statistique", notes:"Variabilité importante selon activité. Utile pour tendances." }
  };

  function applyBrandPreset(brandKey, force = false) {
    const p = WATCH_ESTIMATION_PROFILES[brandKey] || WATCH_ESTIMATION_PROFILES.custom;
    const infoEl = global.document.getElementById("watchProfileInfo");

    if (infoEl) {
      const lines = [
        `Profil : ${p.role || "repère initial"}`,
        `Niveau de confiance : ${p.confidence || "variable"}`,
        "",
        p.notes || "Aucune information complémentaire."
      ];
      infoEl.setAttribute("data-modaltext", lines.join("\n"));
    }

    if (force) {
      if ($("errPct")) $("errPct").value = p.defaultErrPct;
      if ($("errMode")) $("errMode").value = p.defaultMode;
    }
  }

  function setPositioningCopy(mode) {
    const el = $("positioningText");
    if (!el) return;
    if (mode === "sport") {
      el.textContent = "Mode sportif : équilibre entre charge et récupération.";
      return;
    }
    if (mode === "expert") {
      el.textContent = "Mode expert : priorité à l’analyse sur 7 jours.";
      return;
    }
    el.textContent = "Mode simple : priorité à la régularité sur 7 jours.";
  }

  function applyUseMode(mode) {
    const m = (mode === "sport" || mode === "expert") ? mode : "simple";
    global.document.body.setAttribute("data-usemode", m);
    setPositioningCopy(m);
    const det = $("limitsDetails");
    if (det) det.open = (m === "expert");
    global.__CompromiseUI?.applyModeFilter?.(m);
  }

  function closeMenu(){
    const panel = $("menuPanel");
    const btn = $("menuBtn");
    if (!panel || !btn) return;
    panel.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }
  function openMenu(){
    const panel = $("menuPanel");
    const btn = $("menuBtn");
    if (!panel || !btn) return;
    panel.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  }
  function toggleMenu(){
    const panel = $("menuPanel");
    if (!panel) return;
    panel.classList.contains("is-open") ? closeMenu() : openMenu();
  }
  function closeAllTutorialDetails(root = global.document){
    root.querySelectorAll('details.notice').forEach(d => d.open = false);
  }

  const DIET_PRESETS = {
    cut_standard:   { label:"Standard (sportif)",     goalPct: 85,  protPerKg: 1.9, fatPerKg: 0.9 },
    cut_aggressive: { label:"Agressif (court terme)", goalPct: 75,  protPerKg: 2.2, fatPerKg: 0.8 },
    recomp:         { label:"Recomposition (léger déficit)", goalPct: 92,  protPerKg: 1.8, fatPerKg: 0.9 },
    maintain:       { label:"Maintien / équilibre",   goalPct: 100, protPerKg: 1.6, fatPerKg: 1.0 },
    endurance:      { label:"Performance endurance",  goalPct: 95,  protPerKg: 1.7, fatPerKg: 0.9 }
  };

  function dietLabel(mode){
    if (!mode || mode === "none") return "—";
    if (mode === "custom") return "Personnalisé";
    if (typeof DIET_PRESETS !== "undefined" && DIET_PRESETS[mode]?.label) return DIET_PRESETS[mode].label;
    return mode;
  }
  function setDietNote(modeKey){
    const el = $("dietNote");
    if (!el) return;
    if (!modeKey) { el.textContent = "Type de régime = valeurs de départ. Si tu modifies la cible énergétique, les protéines ou les lipides, l’app bascule en “Personnalisé”."; return; }
    if (modeKey === "none") { el.textContent = "—"; return; }
    if (modeKey === "custom") { el.textContent = "Mode Personnalisé : tu ajustes librement la cible énergétique, les protéines et les lipides."; return; }
    const p = DIET_PRESETS[modeKey];
    if (!p) { el.textContent = "Type de régime = valeurs de départ. Si tu modifies la cible énergétique, les protéines ou les lipides, l’app bascule en “Personnalisé”."; return; }
    el.textContent = `Preset “${p.label}” : ${p.goalPct}% · prot ${p.protPerKg} g/kg · lip ${p.fatPerKg} g/kg. (Modifier cible énergétique / protéines / lipides ⇒ “Personnalisé”.)`;
  }
  function setDietNoneUI(){
    if ($("goalPct")) $("goalPct").value = "0";
    if ($("protPerKg")) $("protPerKg").value = "0.0";
    if ($("fatPerKg")) $("fatPerKg").value = "0.0";
    if ($("dietNote")) $("dietNote").textContent = "—";
    if ($("carbAutoHint")) $("carbAutoHint").textContent = "Glucides calculés : —";
    if ($("protRangeHint")) $("protRangeHint").textContent = "Plage protéines : —";
    if ($("fatFloorGPerKg")) $("fatFloorGPerKg").value = "0.0";
    if ($("fatFloorExplain")) $("fatFloorExplain").textContent = "Plages lipides : —";
    if ($("fatRangeHint")) $("fatRangeHint").textContent = "Plage lipides : —";
    if ($("carbGoal")) $("carbGoal").value = "none";
    if ($("carbCapGPerKg")) $("carbCapGPerKg").value = 0;
    if ($("ratioCP")) $("ratioCP").value = "0.0";
    normalizeDietPresetInputs("none");
  }

  const CARB_GOALS = {
    strict:   { label: "Sèche stricte (2–3 g/kg/j)",   range:[2,3],   steps:[2.0,2.2,2.5,3.0] },
    sport:    { label: "Sèche sportive (3–4 g/kg/j)",  range:[3,4],   steps:[3.0,3.2,3.5,4.0] },
    recomp:   { label: "Recomposition (4–5 g/kg/j)",   range:[4,5],   steps:[4.0,4.2,4.5,5.0] },
    maintain: { label: "Maintien actif (4–6 g/kg/j)",  range:[4,6],   steps:[4.0,4.5,5.0,5.5,6.0] },
    volume:   { label: "Endurance / volume (6–8 g/kg/j)", range:[6,8], steps:[6.0,6.5,7.0,7.5,8.0] },
    carbload: { label: "Carb-loading (8–12 g/kg/j)",   range:[8,12],  steps:[8,9,10,11,12] }
  };
  const LOW_CARB_GOALS = {
    moderate: { label: "Low-carb modéré (1,5–2,0 g/kg/j)", range:[1.5,2.0], steps:[1.5,1.7,2.0] },
    strict:   { label: "Low-carb strict (0,5–1,0 g/kg/j)", range:[0.5,1.0], steps:[0.5,0.7,1.0] }
  };

  const DIET_CARB_COMPAT = {
    cut_standard:   { strict:"warn", sport:"ok",   recomp:"ok",   maintain:"warn", volume:"no",   carbload:"no" },
    cut_aggressive: { strict:"ok",   sport:"warn", recomp:"no",   maintain:"no",   volume:"no",   carbload:"no" },
    recomp:         { strict:"warn", sport:"ok",   recomp:"ok",   maintain:"warn", volume:"no",   carbload:"no" },
    maintain:       { strict:"no",   sport:"warn", recomp:"ok",   maintain:"ok",   volume:"warn", carbload:"no" },
    endurance:      { strict:"no",   sport:"warn", recomp:"warn", maintain:"ok",   volume:"ok",   carbload:"warn" },
    custom:         { strict:"ok",   sport:"ok",   recomp:"ok",   maintain:"ok",   volume:"ok",   carbload:"ok" }
  };
  const CARB_GOAL_DEFAULT_BY_DIET = {
    cut_standard: 'dry_sport',
    cut_aggressive: 'dry_strict',
    recomp: 'recomp',
    maintain: 'maintain_active',
    endurance: 'endurance_volume',
    custom: 'dry_sport'
  };
  const UI_CARB_GOAL_OPTIONS = [
    { value:'dry_strict', norm:'strict', label:'Sèche stricte (2–3 g/kg/j)' },
    { value:'dry_sport', norm:'sport', label:'Sèche sportive (3–4 g/kg/j)' },
    { value:'recomp', norm:'recomp', label:'Recomposition (4–5 g/kg/j)' },
    { value:'maintain_active', norm:'maintain', label:'Maintien actif (4–6 g/kg/j)' },
    { value:'endurance_volume', norm:'volume', label:'Endurance / volume (6–8 g/kg/j)' },
    { value:'carb_loading', norm:'carbload', label:'Carb-loading (8–12 g/kg/j, 48–72h)' }
  ];

  function fatFloorForGoal(goalKey) {
    const key = normCarbGoalKey(goalKey);
    const preset = FAT_FLOORS?.[key] || FAT_FLOORS?.none || { min: 0, note: '-' };
    if (typeof preset === 'object') {
      return {
        min: Number.isFinite(Number(preset.min)) ? Number(preset.min) : 0,
        note: preset.note || '-'
      };
    }
    const min = Number(preset);
    return { min: Number.isFinite(min) ? min : 0, note: '-' };
  }
  function setProtRangeUI(mode, clampValue = false){
    const hint = $("protRangeHint");
    const input = $("protPerKg");
    if (!hint || !input) return;
    if (mode === "none" || !mode) {
      hint.textContent = "Plage protéines : —";
      return;
    }
    if (mode === "custom") {
      hint.textContent = "Mode Personnalisé : garde une valeur réaliste, adaptée à ta satiété et à ton entraînement.";
      return;
    }
    const p = DIET_PRESETS[mode];
    if (!p) {
      hint.textContent = "Plage protéines : —";
      return;
    }
    const base = Number(p.protPerKg);
    const protRange = PROT_RANGES_BY_DIET[mode] || {};
    const min = Number.isFinite(Number(protRange.min)) ? Number(protRange.min) : Math.max(1.2, +(base - 0.2).toFixed(1));
    const max = Number.isFinite(Number(protRange.max)) ? Number(protRange.max) : +(base + 0.3).toFixed(1);
    hint.textContent = `Plage protéines : ${min.toFixed(1)}–${max.toFixed(1)} g/kg (repère pour ce régime).`;
    if (clampValue) {
      const cur = toNum(input.value);
      if (!cur || cur < min || cur > max) input.value = base.toFixed(1);
    }
  }
  function lockMacroControls(lock){
    ["goalPct","protPerKg","fatPerKg","fatFloorGPerKg","ratioCP"].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.disabled = !!lock;
      el.classList.toggle("is-locked", !!lock);
    });
  }
  function normalizeDietPresetInputs(mode){
    const currentMode = String(mode || $("dietMode")?.value || "none");
    if (currentMode === "none" || currentMode === "") {
      if ($("protPerKg")) {
        const raw = String($("protPerKg").value ?? '').replace(',', '.').trim();
        if (raw === '' || raw === '0' || raw === '0.0' || raw === '0.00') $("protPerKg").value = '0.0';
      }
    }
  }
  function forceCustomIfPresetEdited(){
    const sel = $("dietMode");
    if (!sel) return;
    const current = sel.value;
    if (!current || current === "none" || current === "custom") return;
    const p = DIET_PRESETS[current];
    if (!p) return;
    const g = toNum($("goalPct")?.value);
    const pr = toNum($("protPerKg")?.value);
    const fa = toNum($("fatPerKg")?.value);
    const changed = (Math.abs(g - p.goalPct) > 0.0001) || (Math.abs(pr - p.protPerKg) > 0.0001) || (Math.abs(fa - p.fatPerKg) > 0.0001);
    if (changed) {
      sel.value = "custom";
      setDietNote("custom");
      lockMacroControls(false);
    }
  }
  function setRatioToMatchCap(){
    // Neutralisé : le Ratio glucides/protéines ne doit pas être le miroir du plafond glucidique.
    // La cohérence de ratio est pilotée par applyRatioPriority() côté objectif glucidique,
    // ou reste libre quand les repères sont désactivés.
    return;
  }
  function ensureCarbGuardDefaultChecked(){
    const guard = $("carbGuardEnabled");
    if (!guard) return false;
    if (!guard.dataset.carbGuardInitDone) {
      guard.checked = true;
      guard.dataset.carbGuardInitDone = '1';
    }
    guard.disabled = false;
    guard.removeAttribute("aria-disabled");
    guard.closest("label")?.classList.remove("is-disabled");
    return !!guard.checked;
  }

  function normalizeCarbCapIntegerStep(){
    const capInp = $("carbCapGPerKg");
    if (!capInp) return;
    capInp.type = 'number';
    capInp.step = '1';
    capInp.inputMode = 'decimal';
    const raw = String(capInp.value ?? '').replace(',', '.').trim();
    const n = Number(raw);
    if (!raw || !Number.isFinite(n)) return;
    capInp.value = String(Math.max(0, Math.round(n)));
  }
  global.normalizeCarbCapIntegerStep = normalizeCarbCapIntegerStep;
  global.normalizeDietPresetInputs = normalizeDietPresetInputs;

  function ensureCarbGoalDefaultOption(){
    const sel = $("carbGoal");
    if (!sel) return;
    const hasNone = !!sel.querySelector('option[value="none"]');
    if (!hasNone) return;
    const raw = String(sel.value || '').trim();
    if (raw === '' || sel.selectedIndex < 0 || !sel.querySelector(`option[value="${CSS.escape(raw)}"]`)) {
      sel.value = 'none';
      const noneOpt = sel.querySelector('option[value="none"]');
      if (noneOpt) noneOpt.selected = true;
    }
  }
  global.ensureCarbGoalDefaultOption = ensureCarbGoalDefaultOption;

  function carbGoalLabelSafe(goal){
    const sel = $("carbGoal");
    const currentOpt = sel?.querySelector(`option[value="${CSS.escape(String(goal || ''))}"]`);
    const txt = (currentOpt?.textContent || '').replace(/\s+—\s+(compatible|possible|incohérent)$/i, '').trim();
    if (txt) return txt;
    if (typeof global.carbGoalLabel === 'function') {
      try { return global.carbGoalLabel(goal); } catch(_){}
    }
    return String(goal || '').trim() || 'objectif';
  }

  function syncCarbCapForEmptyGoal(){
    const goalEl = $("carbGoal");
    const capInp = $("carbCapGPerKg");
    const stepSel = $("carbStep");
    if (!goalEl || !capInp) return;
    const raw = String(goalEl.value || 'none');
    if (raw === '' || raw === 'none') {
      capInp.min = '0';
      capInp.step = '1';
      capInp.value = '0';
      if (stepSel) stepSel.value = '';
      normalizeCarbCapIntegerStep();
    }
  }

  function resetCarbGoalDerivedUI(){
    if ($("carbStep")) $("carbStep").innerHTML = '<option value="">—</option>';
    if ($("carbAutoHint")) $("carbAutoHint").textContent = "Glucides calculés : —";
    if ($("fatFloorExplain")) $("fatFloorExplain").textContent = "Plages lipides : —";
    if ($("fatRangeHint")) $("fatRangeHint").textContent = "Plage lipides : —";
    if ($("carbCapGPerKg")) {
      $("carbCapGPerKg").min = '0';
      $("carbCapGPerKg").step = '1';
      $("carbCapGPerKg").value = '0';
    }
  }
  function updateFatFloorUI(goalKey){
    const key = normCarbGoalKey(goalKey || ($('carbGoal')?.value) || 'none');
    const floor = fatFloorForGoal(key);
    const floorMin = Number.isFinite(Number(floor.min)) ? Number(floor.min) : 0;

    const mode = $('dietMode')?.value || 'custom';
    const el = $('fatFloorGPerKg');
    const explain = $('fatFloorExplain');
    const rangeHint = $('fatRangeHint');
    if (!el) return;

    const dr = FAT_FLOOR_RANGES_BY_DIET[mode] || FAT_FLOOR_RANGES_BY_DIET.custom || { min:0.6, max:1.2 };
    let minAllowed = toNum(dr.min);
    let maxAllowed = toNum(dr.max);
    const presetFat = Number(DIET_PRESETS?.[mode]?.fatPerKg);
    const hasPresetFat = mode && mode !== 'none' && mode !== 'custom' && Number.isFinite(presetFat) && presetFat > 0;

    if (floorMin > 0) minAllowed = Math.max(minAllowed, floorMin);
    if (key === 'carbload') minAllowed = Math.max(0.6, minAllowed);
    if (key === 'none' || key === 'off') {
      if (hasPresetFat) {
        minAllowed = Math.max(minAllowed, Math.min(presetFat, maxAllowed || presetFat));
      } else {
        minAllowed = 0;
        maxAllowed = 2;
      }
    }

    let fatFloorIncompatible = false;
    if (minAllowed > maxAllowed) { fatFloorIncompatible = true; maxAllowed = minAllowed; }

    const step = 0.1;
    const snapToPresetStep = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return minAllowed;
      const offset = (n - minAllowed) / step;
      const snapped = minAllowed + Math.round(offset) * step;
      const clamped = Math.max(minAllowed, Math.min(maxAllowed, snapped));
      return round(clamped, 1);
    };

    el.type = 'number';
    el.min = String(round(minAllowed, 1));
    el.max = String(round(maxAllowed, 1));
    el.step = String(step);
    el.inputMode = 'decimal';

    if (rangeHint){
      rangeHint.textContent = 'Plage lipides : ' + round(minAllowed,1).toFixed(1) + ' – ' + round(maxAllowed,1).toFixed(1) + ' g/kg (pas de 0,1)';
    }

    let chosen = toNum(el.value);
    if (!Number.isFinite(chosen) || chosen <= 0) {
      chosen = hasPresetFat ? Math.max(minAllowed, Math.min(maxAllowed, presetFat)) : minAllowed;
    }
    chosen = snapToPresetStep(chosen);

    if ($('fatFloorGPerKg')) $('fatFloorGPerKg').value = chosen.toFixed(1);
    el.value = chosen.toFixed(1);

    if (explain){
      const base = floor.note || '-';
      if (floorMin > 0 && chosen > floorMin + 1e-9){
        explain.textContent = base + ' (plancher ' + round(floorMin,1).toFixed(1) + ' g/kg, choisi: ' + chosen.toFixed(1) + ' g/kg)';
      } else {
        explain.textContent = base + (fatFloorIncompatible ? ' ⚠️ Objectif incompatible avec le palier régime.' : '');
      }
    }
  }
  function updateCarbGuardExplain(){
    const out = $("carbGuardExplain");
    if (!out) return;
    const enabled = !!$("carbGuardEnabled")?.checked;
    const low = !!$("lowCarbEnabled")?.checked;
    if (!enabled) { out.textContent = "Aucun garde-fou glucidique actif."; return; }
    if (low) { out.textContent = "Garde-fou low-carb actif : les glucides restent plafonnés selon le niveau choisi."; return; }
    const goal = $("carbGoal")?.value || "";
    out.textContent = goal && goal !== 'none' ? `Garde-fou actif sur le repère “${carbGoalLabelSafe(goal)}”.` : "Garde-fou actif.";
  }

  function fmtCompatTag(code){
    if (code === 'ok') return 'compatible';
    if (code === 'warn') return 'possible';
    return 'incohérent';
  }
  function setSelectOptions(sel, options, selectedValue){
    if (!sel) return;
    sel.innerHTML = "";
    options.forEach(optData => {
      const opt = global.document.createElement('option');
      opt.value = optData.value;
      opt.textContent = optData.label;
      if (optData.disabled) opt.disabled = true;
      if (optData.value === selectedValue) opt.selected = true;
      sel.appendChild(opt);
    });
  }
  function getDietCompatMap(dietMode){
    return DIET_CARB_COMPAT[dietMode] || DIET_CARB_COMPAT.custom;
  }
  function getCarbGoal(){ return $("carbGoal")?.value || "none"; }
  function updateCarbGoalOptions(keepValue = true, forceNone = false){
    const dietMode = $("dietMode")?.value || 'none';
    const sel = $("carbGoal");
    if (!sel) return;
    if (dietMode === 'none') {
      setSelectOptions(sel, [{ value:'none', label:'— Choisir un objectif —', disabled:false }], 'none');
      resetCarbGoalDerivedUI();
      return;
    }
    const compat = getDietCompatMap(dietMode);
    const current = keepValue ? getCarbGoal() : null;
    const options = [
      { value:'none', label:'— Choisir un objectif —', disabled:false },
      ...UI_CARB_GOAL_OPTIONS.map((opt) => {
        const code = compat[opt.norm] || 'no';
        return {
          value: opt.value,
          label: `${opt.label} — ${fmtCompatTag(code)}`,
          disabled: (dietMode !== 'custom' && code === 'no')
        };
      })
    ];
    let chosen = 'none';
    if (!forceNone) {
      const fallback = CARB_GOAL_DEFAULT_BY_DIET[dietMode] || 'dry_sport';
      const currentOk = current && options.find(o => o.value === current && !o.disabled);
      chosen = (currentOk ? current : null) || fallback;
    }
    setSelectOptions(sel, options, chosen);
    ensureCarbGoalDefaultOption();
    sel.disabled = false;
  }
  function updateCarbSteps(){
    const goalRaw = $("carbGoal")?.value || 'none';
    const goal = normCarbGoalKey(goalRaw);
    const mode = $("dietMode")?.value || 'none';
    const stepSel = $("carbStep");
    const capInp = $("carbCapGPerKg");
    const autoHint = $("carbAutoHint");
    const help = $("carbGoalHelp");
    const ratioInp = $("ratioCP");
    const w = Math.max(0, toNum($("weight")?.value));
    if (mode === 'none' || goalRaw === 'none' || !CARB_GOALS[goal]) {
      resetCarbGoalDerivedUI();
      syncCarbCapForEmptyGoal();
      if (help) help.textContent = '';
      return;
    }
    if (!stepSel || !capInp) return;
    const preset = CARB_GOALS[goal];
    const minV = Number(preset.range?.[0]);
    const maxV = Number(preset.range?.[1]);
    const steps = [];
    for (let v = Math.ceil(minV); v <= Math.floor(maxV) + 1e-9; v += 1) steps.push(Number(v.toFixed(1)));
    if (!steps.length) steps.push(Number(minV.toFixed(1)));
    const prev = toNum(capInp.value);
    stepSel.innerHTML = '';
    steps.forEach(v => {
      const opt = global.document.createElement('option');
      opt.value = v.toFixed(1);
      opt.textContent = `${v.toFixed(1)} g/kg/j`;
      stepSel.appendChild(opt);
    });
    capInp.type = 'number';
    capInp.step = '1';
    capInp.inputMode = 'decimal';
    capInp.min = String(steps[0]);
    capInp.max = String(steps[steps.length - 1]);
    const prevRounded = Number.isFinite(prev) ? Math.round(prev) : NaN;
    const next = (Number.isFinite(prevRounded) && steps.includes(prevRounded)) ? prevRounded : steps[0];
    capInp.value = String(Number(next));
    stepSel.value = Number(next).toFixed(1);
    if (autoHint) autoHint.value = `Plafond glucidique : ${Number(next).toFixed(1)} g/kg/j`;
    normalizeCarbCapIntegerStep();
    if (help) {
      let txt = `Plage recommandée : ${minV.toFixed(1).replace('.',',')}–${maxV.toFixed(1).replace('.',',')} g/kg/j.`;
      if (goal === 'carbload') txt += ' Fenêtre courte : 48–72 h.';
      if (w > 0) txt += ` Limite haute ≈ ${Math.round(Number(next) * w)} g/j pour ${Math.round(w)} kg.`;
      help.textContent = txt;
      help.setAttribute('title', txt);
    }
    if (ratioInp && ratioInp.value === '') ratioInp.value = Number(capInp.value).toFixed(1);
    updateFatFloorUI(goal);
  }
  const CARB_UI_ZONE_IDS = {
    root: 'settingsGoalsSlot',
    carbGuardEnabled: 'carbGuardEnabled',
    carbGoal: 'carbGoal',
    carbGoalHelp: 'carbGoalHelp',
    lowCarbEnabled: 'lowCarbEnabled',
    lowCarbLevel: 'lowCarbLevel',
    lowCarbStep: 'lowCarbStep',
    lowCarbHelp: 'lowCarbHelp',
    carbGuardBox: 'carbGuardBox',
    lowCarbBox: 'lowCarbBox'
  };

  function getCarbUiDom(){
    return {
      root: $(CARB_UI_ZONE_IDS.root),
      carbGuardEnabled: $(CARB_UI_ZONE_IDS.carbGuardEnabled),
      carbGoal: $(CARB_UI_ZONE_IDS.carbGoal),
      carbGoalHelp: $(CARB_UI_ZONE_IDS.carbGoalHelp),
      lowCarbEnabled: $(CARB_UI_ZONE_IDS.lowCarbEnabled),
      lowCarbLevel: $(CARB_UI_ZONE_IDS.lowCarbLevel),
      lowCarbStep: $(CARB_UI_ZONE_IDS.lowCarbStep),
      lowCarbHelp: $(CARB_UI_ZONE_IDS.lowCarbHelp),
      carbGuardBox: $(CARB_UI_ZONE_IDS.carbGuardBox),
      lowCarbBox: $(CARB_UI_ZONE_IDS.lowCarbBox)
    };
  }

  function readCarbUiState(){
    const dom = getCarbUiDom();
    const dietMode = $('dietMode')?.value || 'none';
    const goalValue = dom.carbGoal?.value || 'none';
    const presetMode = dietMode && dietMode !== 'custom' ? dietMode : null;
    const carbLoadingActive = normCarbGoalKey(goalValue) === 'carbload';
    const diabetesEnabled = !!$('diabEnabled')?.checked;

    return {
      dom,
      dietMode,
      presetMode,
      goalValue,
      goalKey: normCarbGoalKey(goalValue),
      carbGuardEnabled: !!dom.carbGuardEnabled?.checked,
      lowCarbEnabled: !!dom.lowCarbEnabled?.checked,
      lowCarbLevel: dom.lowCarbLevel?.value || 'moderate',
      lowCarbStep: toNum(dom.lowCarbStep?.value),
      carbLoadingActive,
      diabetesEnabled,
      hasDiabetesQuickPanel: !!$('diabPanelInRepas')
    };
  }

  function emitCarbUiHelpRequest(targetId){
    if (!targetId || !global.document || typeof global.CustomEvent !== 'function') return;
    global.document.dispatchEvent(new global.CustomEvent('carb-ui:help-open-request', {
      detail: { targetId, zone: 'settingsGoalsSlot' }
    }));
  }

  function emitCarbUiHelpClose(){
    if (!global.document || typeof global.CustomEvent !== 'function') return;
    global.document.dispatchEvent(new global.CustomEvent('carb-ui:help-close-request', {
      detail: { zone: 'settingsGoalsSlot' }
    }));
  }

  function renderCarbUi(state, options = {}){
    const current = state || readCarbUiState();
    const dom = current.dom || getCarbUiDom();

    if (dom.carbGuardBox) dom.carbGuardBox.style.display = current.carbGuardEnabled ? '' : 'none';
    if (dom.lowCarbBox) dom.lowCarbBox.style.display = current.lowCarbEnabled ? '' : 'none';

    if (options.refreshGoalOptions) {
      updateCarbGoalOptions(options.keepGoalValue !== false, !!options.forceGoalNone);
      ensureCarbGoalDefaultOption();
    }

    const refreshed = readCarbUiState();

    if (refreshed.dietMode === 'none' || refreshed.goalValue === 'none') {
      resetCarbGoalDerivedUI();
      syncCarbCapForEmptyGoal();
      if (dom.carbGoalHelp && refreshed.goalValue === 'none') dom.carbGoalHelp.textContent = '';
    } else {
      updateCarbSteps();
    }

    normalizeCarbCapIntegerStep();

    if (refreshed.lowCarbEnabled) populateLowCarbSteps();
    else setLowCarbRangeUI(refreshed.lowCarbLevel, true);

    updateCarbGuardExplain();
    updateFatFloorUI(refreshed.goalValue);
    try { setRatioToMatchCap?.(); } catch(e){}
    try { applyRatioPriority?.(`carb-ui-render:${options.reason || 'sync'}`); } catch(e){}

    return readCarbUiState();
  }

  function syncCarbUiZone(options = {}){
    const rendered = renderCarbUi(readCarbUiState(), options);
    if (options.helpTarget === 'carbGoal') emitCarbUiHelpRequest(CARB_UI_ZONE_IDS.carbGoalHelp);
    else if (options.helpTarget === 'lowCarb') emitCarbUiHelpRequest(CARB_UI_ZONE_IDS.lowCarbHelp);
    else if (options.closeHelp) emitCarbUiHelpClose();
    return rendered;
  }

  function bindCarbUiZoneEvents(runSettings){
    if (global.__carbUiZoneBindingsAttached) return;
    global.__carbUiZoneBindingsAttached = true;
    const dom = getCarbUiDom();
    const bind = (el, type, handler) => { if (el) el.addEventListener(type, handler); };
    bind(dom.carbGoal, 'change', () => runSettings?.('handleCarbGoalChange'));
    bind($('carbStep'), 'change', () => runSettings?.('handleCarbStepChange'));
    bind($('carbCapGPerKg'), 'input', () => runSettings?.('handleCarbCapInput'));
    bind($('carbCapGPerKg'), 'change', () => runSettings?.('handleCarbCapChange'));
    bind(dom.carbGuardEnabled, 'change', () => runSettings?.('handleCarbGuardToggle'));
    bind(dom.lowCarbEnabled, 'change', () => runSettings?.('handleLowCarbToggle'));
    bind(dom.lowCarbLevel, 'change', () => runSettings?.('handleLowCarbLevelChange'));
    bind(dom.lowCarbStep, 'change', () => runSettings?.('handleLowCarbStepChange'));
  }

  function initCarbGuardsUI(){
    try {
      ensureCarbGuardDefaultChecked();
      syncCarbUiZone({
        reason: 'init',
        refreshGoalOptions: true,
        keepGoalValue: true,
        forceGoalNone: false,
        closeHelp: true
      });
      lockCarbControls?.();
    } catch(e){
      console.error('initCarbGuardsUI failed:', e);
    }
  }
  function setLowCarbRangeUI(level, clampValue){
    const el = $("lowCarbStep");
    const help = $("lowCarbHelp");
    const resolved = level || $("lowCarbLevel")?.value || 'moderate';
    if (!el) return;
    const cfg = LOW_CARB_GOALS[resolved] || LOW_CARB_GOALS.moderate;
    const a = toNum(cfg.range?.[0]);
    const b = toNum(cfg.range?.[1]);
    if (!(a >= 0) || !(b > a)) {
      el.min = '0'; el.max = '5'; el.step = '0.1';
      if (help) help.textContent = '';
      return;
    }
    el.min = String(a);
    el.max = String(b);
    el.step = '0.1';
    if (clampValue) {
      let v = toNum(el.value);
      if (!Number.isFinite(v)) v = a;
      v = Math.max(a, Math.min(b, v));
      el.value = (Math.round(v * 10) / 10).toFixed(1);
    }
    if (help) {
      const txt = `Fourchette : ${a.toFixed(1).replace('.',',')}–${b.toFixed(1).replace('.',',')} g/kg/j`;
      help.textContent = txt;
      help.setAttribute('title', txt);
    }
  }
  function populateLowCarbSteps(){
    const levelSel = $("lowCarbLevel");
    const stepInp = $("lowCarbStep");
    if (!levelSel || !stepInp) return;
    const level = levelSel.value || 'moderate';
    const cfg = LOW_CARB_GOALS[level] || LOW_CARB_GOALS.moderate;
    const a = toNum(cfg.range?.[0]);
    const b = toNum(cfg.range?.[1]);
    setLowCarbRangeUI(level, false);
    let v = toNum(stepInp.value);
    if (!Number.isFinite(v)) v = a;
    v = Math.max(a, Math.min(b, v));
    stepInp.value = (Math.round(v * 10) / 10).toFixed(1);
  }
  function syncCarbModeUI(){
    ensureCarbGuardDefaultChecked();
    const carbGuard2 = !!$("carbGuardEnabled")?.checked;
    const lowCarb2 = !!$("lowCarbEnabled")?.checked;
    if (typeof global.__lastCarbGoalKey === 'undefined') global.__lastCarbGoalKey = '';
    const goalEl = $("carbGoal");
    if (goalEl) {
      const cur = String(goalEl.value || '');
      if (cur && cur !== 'none') global.__lastCarbGoalKey = cur;
    }
    ensureCarbGuardDefaultChecked();
    const lowBox = $("lowCarbBox");
    if (lowBox) lowBox.style.display = lowCarb2 ? '' : 'none';
    const guardBox = $("carbGuardBox");
    if (guardBox) guardBox.style.display = carbGuard2 ? '' : 'none';
    const lock = false;
    ['carbGoal','carbStep','carbCapGPerKg'].forEach(id => {
      const el = $(id);
      if (el) el.disabled = lock;
    });
    updateCarbSteps?.();
    syncCarbCapForEmptyGoal();
    setRatioToMatchCap?.();
    syncCarbGuardsFromUI?.();
    if (lowCarb2) populateLowCarbSteps();
    const sumEl = $("carbModeSummary");
    if (sumEl) {
      if (lowCarb2) {
        const lvl = $("lowCarbLevel")?.value || '';
        const step = $("lowCarbStep")?.value || '';
        const gk = $("carbGoal")?.selectedOptions?.[0]?.textContent || $("carbGoal")?.value || '';
        const cap = $("carbCapGPerKg")?.value || '';
        sumEl.textContent = `Mode glucides : Low‑carb ${lvl ? ('(' + lvl + ')') : ''} — palier ${step || '—'} g/kg/j` + ((gk || cap) ? ` · cadrage ${gk || '—'} / ${cap || '—'} g/kg/j` : '');
      } else if (carbGuard2) {
        const gk = $("carbGoal")?.selectedOptions?.[0]?.textContent || $("carbGoal")?.value || '';
        const cap = $("carbCapGPerKg")?.value || '';
        sumEl.textContent = `Mode glucides : Repères — objectif ${gk || '—'} · plafond ${cap || '—'} g/kg/j`;
      } else {
        sumEl.textContent = 'Mode glucides : Ajustement automatique (aucun repère / low‑carb)';
      }
    }
  }
  function makeDietBadge(dietMode, goalPct) {
    const label = dietLabel(dietMode);
    const pct = Number.isFinite(goalPct) ? Math.round(goalPct) : "-";
    return `<span class="pill"><b>${escapeHtml(label)}</b> ${pct}%</span>`;
  }
  function applyDietPreset(mode) {
    if (mode === "custom") return;
    const p = DIET_PRESETS[mode];
    if (!p) return;
    $("goalPct").value   = p.goalPct;
    $("protPerKg").value = p.protPerKg;
    setProtRangeUI(mode, false);
    $("fatPerKg").value  = p.fatPerKg;
    updateCarbGoalOptions(true, true);
    updateCarbSteps();
    setRatioToMatchCap();
    if (typeof global.syncCarbGuardsFromUI === "function") global.syncCarbGuardsFromUI();
  }
  function refreshDietDerivedUI(){
    const mode = $("dietMode")?.value || "none";
    if (!mode || mode === "none"){
      if ($("protRangeHint")) $("protRangeHint").textContent = "Plage protéines : —";
      return;
    }
    setProtRangeUI(mode, false);
  }

  Object.assign(ns, {
    WATCH_ESTIMATION_PROFILES,
    DIET_PRESETS,
    CARB_GOALS,
    LOW_CARB_GOALS,
    applyBrandPreset,
    setPositioningCopy,
    applyUseMode,
    closeMenu,
    openMenu,
    toggleMenu,
    closeAllTutorialDetails,
    dietLabel,
    setDietNote,
    setDietNoneUI,
    fatFloorForGoal,
    setProtRangeUI,
    lockMacroControls,
    forceCustomIfPresetEdited,
    setRatioToMatchCap,
    resetCarbGoalDerivedUI,
    updateFatFloorUI,
    updateCarbGuardExplain,
    fmtCompatTag,
    setSelectOptions,
    getDietCompatMap,
    getCarbGoal,
    updateCarbGoalOptions,
    updateCarbSteps,
    initCarbGuardsUI,
    setLowCarbRangeUI,
    populateLowCarbSteps,
    syncCarbModeUI,
    makeDietBadge,
    applyDietPreset,
    refreshDietDerivedUI,
    CARB_UI_ZONE_IDS,
    getCarbUiDom,
    readCarbUiState,
    renderCarbUi,
    syncCarbUiZone,
    bindCarbUiZoneEvents
  });
  Object.assign(global, {
    WATCH_ESTIMATION_PROFILES,
    DIET_PRESETS,
    CARB_GOALS,
    LOW_CARB_GOALS,
    readCarbUiState,
    renderCarbUi,
    syncCarbUiZone,
    bindCarbUiZoneEvents
  });
})(window);
