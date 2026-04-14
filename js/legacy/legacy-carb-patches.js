/* Extracted from legacy-engine-compute.js — carb patches + ratio priority */
(function(){
  // 1) Aliases pour objectifs glucidiques (valeurs HTML -> clés internes)
  const CARB_GOAL_ALIAS = {
    none: "none",
    dry_strict: "strict",
    dry_sport: "sport",
    recomp: "recomp",
    maintain_active: "maintain",
    endurance_volume: "volume",
    carb_loading: "carbload"
  };

  function normCarbGoalKey(v){
    const k = (v || "none");
    return CARB_GOAL_ALIAS[k] || k;
  }

  // 2) Étend FAT_FLOORS avec les valeurs UI (sans casser l'existant)
  try{
    if (typeof FAT_FLOORS === "object" && FAT_FLOORS){
      FAT_FLOORS.dry_strict       = FAT_FLOORS.strict;
      FAT_FLOORS.dry_sport        = FAT_FLOORS.sport;
      FAT_FLOORS.maintain_active  = FAT_FLOORS.maintain;
      FAT_FLOORS.endurance_volume = FAT_FLOORS.volume;
      FAT_FLOORS.carb_loading     = FAT_FLOORS.carbload;
      FAT_FLOORS.none             = { min: 0, note: "-" };
    }
  }catch(e){ /* noop */ }

  // 3) Patche fatFloorForGoal pour accepter les valeurs UI
  try{
    const _fatFloorForGoal = fatFloorForGoal;
    window.fatFloorForGoal = function(goalKey){
      return _fatFloorForGoal(normCarbGoalKey(goalKey));
    };
  }catch(e){ /* noop */ }

  // 4) updateFatFloorUI : utilise clés normalisées + évite incohérences
  try{
    const _updateFatFloorUI = updateFatFloorUI;
    window.updateFatFloorUI = function(){
      const raw = ($("carbGoal")?.value) || "none";
      // force la normalisation via fatFloorForGoal patché
      return _updateFatFloorUI();
    };
  }catch(e){ /* noop */ }

  // 5) Repères glucidiques : remplace updateCarbSteps (mapping correct)
  window.updateCarbSteps = function updateCarbSteps(){
    const rawGoal = $("carbGoal")?.value || "none";
    const goal = normCarbGoalKey(rawGoal);
    const mode = $("dietMode")?.value || "none";

    // si pas de régime, ou pas d'objectif choisi
    if (mode === "none" || rawGoal === "none"){
      resetCarbGoalDerivedUI();
      updateFatFloorUI();
      updateCarbGuardExplain();
      return;
    }

    const stepSel = $("carbStep");
    const capInp  = $("carbCapGPerKg");
    const ratioInp= $("ratioCP");
    if (!stepSel || !capInp || !ratioInp) return;

    const w = Math.max(0, toNum($("weight")?.value));

    const RANGES = {
      strict:   { min: 2.0,  max: 3.0,  recRatio: 1.00 },
      sport:    { min: 3.0,  max: 4.0,  recRatio: 1.10 },
      recomp:   { min: 4.0,  max: 5.0,  recRatio: 1.25 },
      maintain: { min: 4.0,  max: 6.0,  recRatio: 1.50 },
      volume:   { min: 6.0,  max: 8.0,  recRatio: 1.80 },
      carbload: { min: 8.0,  max: 12.0, recRatio: 2.50 }
    };
    const r = RANGES[goal] || RANGES.sport;

    // rebuild steps
    stepSel.innerHTML = "";
    const steps = [];
    for (let v = r.min; v <= r.max + 1e-9; v = Math.round((v + 0.1) * 10) / 10) steps.push(v);
    steps.forEach(v => {
      const opt = document.createElement("option");
      opt.value = String(v.toFixed(1));
      opt.textContent = v.toFixed(1) + " g/kg/j";
      stepSel.appendChild(opt);
    });

    capInp.step = "0.1";
    capInp.min  = String(r.min);
    capInp.max  = String(r.max);

    const cur = toNum(capInp.value);
    const next = (cur > 0 && cur >= r.min - 1e-9 && cur <= r.max + 1e-9) ? cur : r.min;
    capInp.value = next.toFixed(1);
    stepSel.value = capInp.value;

    // ratio conseillé (si vide/0)
    const ratioCur = toNum(ratioInp.value);
    if (ratioCur <= 0) ratioInp.value = r.recRatio.toFixed(2);

    // UI hints
    const capG = toNum(capInp.value);
    const maxCarbsG = (w > 0) ? Math.round(capG * w) : 0;
    const explain = $("carbGuardExplain");
    if (explain){
      explain.textContent =
        `Plafond glucides : ${capG.toFixed(1)} g/kg/j (≈ ${maxCarbsG} g/j pour ${Math.round(w)} kg). ` +
        `Ratio max C/P conseillé ≈ ${toNum(ratioInp.value).toFixed(2)}.`;
    }
    const autoHint = $("carbAutoHint");
    if (autoHint){
      autoHint.value = `Plafond glucidique : ${capG.toFixed(1)} g/kg/j (≈ ${maxCarbsG} g/j)`;
    }

    try{ applyRatioPriority('updateCarbSteps'); }catch(e){}

    updateFatFloorUI();
    updateCarbGuardExplain();
  };

  
  // 5bis) PATCH RatioCP — priorité nette (mode régime vs repères vs low-carb)
  // Règle :
  // - Repères OFF : ratioCP libre (on mémorise la valeur utilisateur)
  // - Repères ON  : ratioCP = ratio d’objectif (verrouillé) et écrase la valeur libre
  // - Repères OFF à nouveau : on restaure la valeur libre
  // - Low-carb ON : ratio affiché "--" (ratio inactif), sans écraser la valeur libre mémorisée
  function _ratioFreeKey(){
    try { return String(SETTINGS_KEY()) + ".ratioCP_free"; } catch(e){ return "ratioCP_free"; }
  }
  function getFreeRatio(){
    try {
      const v = localStorage.getItem(_ratioFreeKey());
      const n = toNum(v);
      return (Number.isFinite(n) && n > 0) ? n : 0;
    } catch(e){ return 0; }
  }
  function setFreeRatio(v){
    try {
      const n = toNum(v);
      if (Number.isFinite(n) && n > 0) localStorage.setItem(_ratioFreeKey(), String(round(n,2)));
    } catch(e){}
  }

  function objectiveRatioForGoal(rawGoal){
    const goal = normCarbGoalKey(rawGoal);
    const R = {
      strict:   { recRatio: 1.00 },
      sport:    { recRatio: 1.10 },
      recomp:   { recRatio: 1.25 },
      maintain: { recRatio: 1.50 },
      volume:   { recRatio: 1.80 },
      carbload: { recRatio: 2.50 }
    };
    return toNum((R[goal] || R.sport).recRatio);
  }

  function applyRatioPriority(reason){
    const ratioNum = $("ratioCP");
    const ratioTxt = $("ratioCPText");
    const carbGuard = !!$("carbGuardEnabled")?.checked;
    const lowCarb   = !!$("lowCarbEnabled")?.checked;
    const rawGoal   = $("carbGoal")?.value || "none";
    const mode      = $("dietMode")?.value || "none";

    if (!ratioNum) return;

    // mémorise la valeur libre si l'input est actuellement libre
    const canStoreFree = !ratioNum.disabled && !lowCarb;
    if (canStoreFree){
      const cur = toNum(ratioNum.value);
      if (Number.isFinite(cur) && cur > 0) setFreeRatio(cur);
    }

    // Low-carb : ratio inactif + affichage "--"
    if (lowCarb){
      // ne pas écraser la valeur libre mémorisée
      ratioNum.classList.add("hidden");
      ratioNum.disabled = true;

      if (ratioTxt){
        ratioTxt.classList.remove("hidden");
        ratioTxt.value = "--";
      }
      return;
    } else {
      // remettre l'input numérique
      if (ratioTxt) ratioTxt.classList.add("hidden");
      ratioNum.classList.remove("hidden");
    }

    // Pas de régime ou pas d'objectif : repères ne doivent pas forcer un ratio
    const noObjective = (mode === "none" || rawGoal === "none");

    if (carbGuard && !noObjective){
      // verrouille sur le ratio d'objectif
      const obj = objectiveRatioForGoal(rawGoal);
      ratioNum.value = (Number.isFinite(obj) && obj > 0) ? obj.toFixed(2) : "0";
      ratioNum.disabled = true;
    } else {
      // ratio libre : restaurer si possible
      ratioNum.disabled = false;
      const stored = getFreeRatio();
      if (stored > 0){
        ratioNum.value = stored.toFixed(2);
      } else {
        // si rien en mémoire, laisser tel quel (sans imposer)
        if (!(toNum(ratioNum.value) > 0)) ratioNum.value = "0";
      }
    }
  }


// 6) Fix rappel rapide : écrase le doublon (modeCopy -> positioningText)
  window.setPositioningCopy = function setPositioningCopy(mode){
    const el = $("positioningText");
    if (!el) return;
    const m = (mode === "sport" || mode === "expert") ? mode : "simple";

    if (m === "sport") {
      el.textContent = "Mode sportif : tu peux ajuster plus finement (marge d’erreur, charge, ratio...). Lis surtout la tendance 7 jours.";
    } else if (m === "expert") {
      el.textContent = "Mode expert : la valeur du jour peut varier. Lis surtout la tendance sur 7 jours.";
    } else {
      el.textContent = "Mode simple : vise la régularité sur 7 jours. Affichage allégé, sans pression au quotidien.";
    }
  };

  // 7) CSS patch via structure patch
  try{
    if (typeof patch === "object" && patch){
      patch.css += `
/* PATCH v17.2 */
#carbGuardExplain{ margin-top:.35rem; }
#ratioCPText{ width:100%; }
`;
      patch.apply();
    }
  }catch(e){ /* noop */ }

  function bindCarbRatioPriority(){
    if (window.__carbRatioPriorityBindingsAttached) return;
    window.__carbRatioPriorityBindingsAttached = true;
    try{
      $("carbGuardEnabled")?.addEventListener("change", () => applyRatioPriority("carbGuardEnabled"));
      $("lowCarbEnabled")?.addEventListener("change", () => applyRatioPriority("lowCarbEnabled"));
      $("carbGoal")?.addEventListener("change", () => applyRatioPriority("carbGoal"));
      $("dietMode")?.addEventListener("change", () => applyRatioPriority("dietMode"));
      $("ratioCP")?.addEventListener("input", () => {
        if (!$("carbGuardEnabled")?.checked && !$("lowCarbEnabled")?.checked){
          setFreeRatio(toNum($("ratioCP").value));
        }
      });
    }catch(e){}
  }
  bindCarbRatioPriority();

})();

/* =========================================================
   COMPROMIS OPTIMAUX — rendu sous le menu (minimal)
   Ne touche pas aux calculs : UI purement informative.
   UI : #compromiseSelect, #compromiseBox
   ========================================================= */
