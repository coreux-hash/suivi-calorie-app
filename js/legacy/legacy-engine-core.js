/* Extracted from legacy-engine-compute.js — compute engine */
function updateCarbCalcPanel(ctx){
  const rawEl = $("carbCalcRawG");
  const capEl = $("carbCalcCapG");
  const capKgEl = $("carbCalcCapKg");
  const srcEl = $("carbCalcCapSrc");
  const stEl  = $("carbCalcStatus");
  if (!rawEl || !capEl || !stEl) return;

  const w = Math.max(0, toNum($("weight")?.value));
  const goalRaw = $("carbGoal")?.value || "none";
  const goalKey = (typeof normCarbGoalKey === "function") ? normCarbGoalKey(goalRaw) : goalRaw;

  // Ranges "objectif" (g/kg/j) : sert à contextualiser le plafond choisi (cap g/kg)
  const GOAL_RANGES = {
    strict:   { min: 2.0,  max: 3.0,  label: "Sèche stricte" },
    sport:    { min: 3.0,  max: 4.0,  label: "Sèche sportive" },
    recomp:   { min: 4.0,  max: 5.0,  label: "Recomposition" },
    maintain: { min: 4.0,  max: 6.0,  label: "Maintien actif" },
    volume:   { min: 6.0,  max: 8.0,  label: "Endurance / volume" },
    endurance:{ min: 6.0,  max: 8.0,  label: "Endurance / volume" }, // compat ancienne clé
    carbload: { min: 8.0,  max: 12.0, label: "Carb-loading" }
  };
  const gr = GOAL_RANGES[goalKey] || null;

  const targetCraw = ctx?.targetCraw;
  const targetC    = ctx?.targetC;
  const lowCarbEnabled    = !!ctx?.lowCarbEnabled;
  const lowCarbImpossible = !!ctx?.lowCarbImpossible;

  rawEl.textContent = (Number.isFinite(targetCraw) ? String(round(targetCraw, 1)) : "—");

  // Low-carb : on sort volontairement du modèle "plafond"
  if (lowCarbEnabled){
    capEl.textContent = (Number.isFinite(targetC) ? String(round(targetC, 1)) : "—");
    if (capKgEl){
      const kg = (w > 0 && Number.isFinite(targetC)) ? (targetC / w) : NaN;
      capKgEl.textContent = (w > 0 && Number.isFinite(kg)) ? ` (${round(kg, 2)} g/kg)` : "";
    }
    if (srcEl) srcEl.textContent = " (low-carb)";
    stEl.textContent = lowCarbImpossible
      ? "Low-carb impossible à cette cible : lipides au plancher, glucides remontés pour respecter les calories."
      : "Low-carb : glucides plafonnés, lipides ajustés.";
    return;
  }

  const carbCapG = ctx?.carbCapG;                 // cap effectif final en g/j
  const capFromGkg   = ctx?.capFromGkg;           // g/j (si repères ON et cap g/kg)
  const capFromRatio = ctx?.capFromRatio;         // g/j (si ratio actif)
  const carbCapGPerKgApplied = ctx?.carbCapGPerKgApplied || 0; // g/kg/j réellement pris en compte
  const ratioCPApplied       = ctx?.ratioCPApplied || 0;       // ratio réellement pris en compte

  // Pas de plafond actif => aucune limitation : glucides = calories restantes (après P+F)
  if (!(Number.isFinite(carbCapG) && carbCapG > 0)){
    capEl.textContent = "—";
    if (capKgEl) capKgEl.textContent = "";
    if (srcEl) srcEl.textContent = "";
    // Contexte : si un objectif est sélectionné mais repères OFF, on le rappelle
    const goalLine = (gr && w > 0 && Number.isFinite(toNum($("carbCapGPerKg")?.value)))
      ? `Objectif ${gr.label} : ${gr.min.toFixed(1)}–${gr.max.toFixed(1)} g/kg/j (plafond non appliqué si repères OFF).`
      : "";
    stEl.textContent =
      "Aucun plafond actif : les glucides sont déterminés par les calories restantes après protéines et lipides."
      + (goalLine ? "\n" + goalLine : "");
    return;
  }

  capEl.textContent = String(round(carbCapG, 1));
  if (capKgEl){
    const kg = (w > 0 && Number.isFinite(carbCapG)) ? (carbCapG / w) : NaN;
    capKgEl.textContent = (w > 0 && Number.isFinite(kg)) ? ` (${round(kg, 2)} g/kg)` : "";
  }

  // Source(s) du cap effectif (g/kg et/ou ratio). On affiche ceux qui « mordent » réellement.
  const srcs = [];
  const eps = 0.06; // tolérance d'arrondi (g)
  if (Number.isFinite(capFromGkg) && Math.abs(carbCapG - capFromGkg) <= eps && carbCapGPerKgApplied > 0){
    srcs.push(`${round(carbCapGPerKgApplied, 1)} g/kg`);
  }
  if (Number.isFinite(capFromRatio) && Math.abs(carbCapG - capFromRatio) <= eps && ratioCPApplied > 0){
    srcs.push(`ratio ${round(ratioCPApplied, 2)}`);
  }
  if (srcEl) srcEl.textContent = srcs.length ? ` (${srcs.join(" ; ")})` : "";

  // Statut : le plafond ne fait baisser les glucides que s'il est < aux glucides "bruts"
  const isBinding = (Number.isFinite(targetCraw) && targetCraw > (carbCapG + eps));
  const bindLine = isBinding
    ? "Plafond actif : Les glucides sont limités (les calories restantes basculent vers les lipides)."
    : "Plafond non bloquant : Les glucides calculés sont déjà sous le repère fixé.";

  // Contexte objectif : où se situe ton plafond g/kg dans la plage de l’objectif
  let goalLine = "";
  if (gr && w > 0){
    const capKgNow = (carbCapGPerKgApplied > 0) ? carbCapGPerKgApplied : toNum($("carbCapGPerKg")?.value);
    if (Number.isFinite(capKgNow) && capKgNow > 0){
      const capGNow = capKgNow * w;
      goalLine =
        `Objectif ${gr.label} : ${gr.min.toFixed(1)}–${gr.max.toFixed(1)} g/kg/j. ` +
        `Plafond choisi : ${round(capKgNow, 1)} g/kg (≈ ${Math.round(capGNow)} g/j).`;
    } else {
      goalLine = `Objectif ${gr.label} : ${gr.min.toFixed(1)}–${gr.max.toFixed(1)} g/kg/j.`;
    }
  }

  const capKgTaken = (w > 0 && Number.isFinite(carbCapG)) ? (carbCapG / w) : NaN;
  const capTakenLine = (w > 0 && Number.isFinite(capKgTaken))
    ? `Plafond pris en compte : ${round(capKgTaken, 2)} g/kg/j (≈ ${round(carbCapG, 1)} g/j).`
    : "";

  stEl.textContent = bindLine
    + (capTakenLine ? "\n" + capTakenLine : "")
    + (goalLine ? "\n" + goalLine : "");
}


function compute(saveToJournal = true, scrollToResults = false) {
  // ============================================================
  // 0) Lecture inputs (DOM -> variables)
  // ============================================================
  const sex = $("sex").value;
  const age = toNum($("age").value);
  const h   = toNum($("height").value);
  const w   = toNum($("weight").value);

  const montre  = toNum($("montre").value);
  const errPct  = Math.max(0, toNum($("errPct")?.value));
  const errMode = $("errMode")?.value || "conservative";

  const dietMode = $("dietMode")?.value || "cut_standard";

  const goalPctRaw = toNum($("goalPct")?.value);
  const goalPct    = clamp(goalPctRaw, 60, 130);
  if ($("goalPct") && goalPct !== goalPctRaw) $("goalPct").value = goalPct;

  const protPerKg = Math.max(0, toNum($("protPerKg")?.value));
  const fatPerKg  = Math.max(0, toNum($("fatPerKg")?.value));
  const fatFloorChosen = Math.max(0, toNum($("fatFloorGPerKg")?.value));

  // Modes optionnels
  const carbGuardEnabled = !!$("carbGuardEnabled")?.checked;
  const lowCarbEnabled   = !!$("lowCarbEnabled")?.checked;

  const carbGoalKey = ($("carbGoal")?.value) || "off";

  // ============================================================
  // 1) Détermination lipides effectifs (planchers)
  // ============================================================
  const fatFloor  = fatFloorForGoal(carbGoalKey); // objet {min,max,...}
  const floorMeta = fatFloorForGoal(carbGoalKey); // min théorique selon objectif (peut valoir 0 si "off")

  let fatPerKgEff = fatPerKg;

  if (dietMode !== "custom") {
    // 1) plancher choisi (UI) : doit impacter le socle même si Repères glucidiques OFF
    if (fatFloorChosen > 0) fatPerKgEff = Math.max(fatPerKgEff, fatFloorChosen);

    // 2) sécurité : si un objectif impose un min (et que l’UI n’a pas/peu rempli), on ne descend jamais sous ce min
    if (floorMeta?.min > 0) fatPerKgEff = Math.max(fatPerKgEff, floorMeta.min);
  }

  // UI : box "lipides effectifs"
  const effBox = $("fatPerKgEffBox");
  const effTxt = $("fatPerKgEffTxt");

  if (effBox && effTxt) {
    const isConstraining =
      (carbGuardEnabled || lowCarbEnabled) &&
      (fatPerKgEff > fatPerKg + 1e-9);

    if (isConstraining) {
      effTxt.textContent = round(fatPerKgEff, 2);
      effBox.style.display = "block";
    } else {
      effBox.style.display = "none";
    }
  }

  // ============================================================
  // 2) Contexte jour + ingestion (repas)
  // ============================================================
  const dateForDay = getSelectedDate();
  $("dayDate").value = dateForDay;

  const eaten = syncEatenFromMeals(dateForDay);
  const eatenK = eaten.k, eatenP = eaten.p, eatenC = eaten.c, eatenF = eaten.f;

  // ============================================================
  // 3) Ajustement montre + cible kcal
  // ============================================================
  const errFactor = errPct / 100;

  let montreAdjusted = montre;
  if (errMode === "conservative") montreAdjusted = montre * (1 - errFactor);
  if (errMode === "optimistic")   montreAdjusted = montre * (1 + errFactor);

  const targetKcal = montreAdjusted * (goalPct / 100);

  // ============================================================
  // 4) Cibles P/F/C (base) + modes glucides
  // ============================================================
  const targetP = protPerKg * w;

  // Lipides "plancher" (base)
  const targetFbase = fatPerKgEff * w;

  // Calories disponibles après P+Fbase
  const kcalFromPFbase   = (targetP * 4) + (targetFbase * 9);
  const kcalLeftForCbase = targetKcal - kcalFromPFbase;

  // Glucides bruts (sans Repères glucidiques)
  const targetCraw = kcalLeftForCbase / 4;

  // ---------- Modes glucides ----------
  let targetC = targetCraw;
  let targetF = targetFbase;

  // Variables de contexte (pour note/UI)
  let carbCapGPerKg = 0;     // g/kg/j
  let ratioCP = 0;           // Ratio glucides/protéines max
  let carbCapGPerKgApplied = 0; // g/kg/j effectivement pris en compte (repères ON)
  let ratioCPApplied = 0;       // ratio effectivement pris en compte (libre ou objectif)
  let capFromGkg = null;        // cap issu g/kg (g/j)
  let capFromRatio = null;      // cap issu ratio (g/j)
  let carbCapG = null;       // cap glucides final en g (après min)
  let kcalRemaining = 0;     // kcal déplacées vers lipides (carb-guard)
  let lowCarbKg = 0;         // g/kg/j (low-carb)
  let lowCarbImpossible = false;

  // (1) Low-carb explicite : C fixé bas, F ajuste (carb-goals désactivé)
  if (lowCarbEnabled) {
    lowCarbKg = Math.max(0, toNum($("lowCarbStep")?.value)); // g/kg/j
    const targetClc = lowCarbKg * w;

    // Fat requis pour atteindre la cible kcal avec P et C fixés
    const fatNeeded = (targetKcal - (targetP * 4) - (targetClc * 4)) / 9;

    targetC = Math.max(0, targetClc);

    // Plancher : lipides preset sert ici de minimum de sécurité
    const fatMin = targetFbase;

    if (!Number.isFinite(fatNeeded)) {
      targetF = fatMin;
    } else if (fatNeeded >= fatMin) {
      targetF = fatNeeded;
    } else {
      // Impossible de tenir "low-carb" à cette cible kcal sans descendre sous les planchers :
      // on maintient le plancher lipides, et on remplit le reste en glucides (warning via note).
      lowCarbImpossible = true;
      targetF = fatMin;
      targetC = Math.max(0, (targetKcal - (targetP * 4) - (targetF * 9)) / 4);
    }

  // (2) Carb-guard optionnel : plafonds glucides (si activé)
  } else {
    carbCapGPerKg = Math.max(0, toNum($("carbCapGPerKg").value));  // 0 = off
    ratioCP       = Math.max(0, toNum($("ratioCP").value));        // 0 = off

    let ratioCPApplied       = (!lowCarbEnabled && ratioCP > 0) ? ratioCP : 0; // ratio libre ou objectif (si repères ON), ignoré en low-carb
    carbCapGPerKgApplied = carbGuardEnabled ? carbCapGPerKg : 0; // g/kg seulement quand repères ON

    const ratioPolicy = (typeof window !== 'undefined' && window.__TrainingLoadMatrix && typeof window.__TrainingLoadMatrix.getRuntimeRatioPolicy === 'function')
      ? window.__TrainingLoadMatrix.getRuntimeRatioPolicy({
          compromiseId: $("compromiseSelect")?.value || '',
          carbGoal: $("carbGoal")?.value || '',
          ratioCP,
          targetP,
          weightKg: w,
          carbGuardEnabled,
          lowCarbEnabled
        })
      : null;

    if (ratioPolicy && ratioPolicy.mode === 'off') {
      ratioCPApplied = 0;
    } else if (ratioPolicy && ratioPolicy.mode === 'soft') {
      const eff = Math.max(0, toNum(ratioPolicy.effectiveRatio));
      if (eff > 0) ratioCPApplied = Math.max(ratioCPApplied || 0, eff);
    }

    if (carbCapGPerKgApplied > 0) capFromGkg = carbCapGPerKgApplied * w;

    if (ratioCPApplied > 0) capFromRatio = ratioCPApplied * targetP; // g glucides max = ratio * protéines

    for (const v of [capFromGkg, capFromRatio]) {
      if (v != null && Number.isFinite(v) && v >= 0) {
        carbCapG = (carbCapG == null) ? v : Math.min(carbCapG, v);
      }
    }

    // Glucides après plafond(s)
    targetC = targetCraw;
    if (carbCapG != null) targetC = Math.min(targetCraw, carbCapG);
    targetC = Math.max(0, targetC);

    // Si on plafonne les glucides, on bascule les calories restantes en lipides (pour garder la cible kcal)
    const kcalUsedWithCap = (targetP * 4) + (targetC * 4) + (targetFbase * 9);
    targetF = targetFbase;

    kcalRemaining = targetKcal - kcalUsedWithCap;
    if (kcalRemaining > 0) targetF = targetFbase + (kcalRemaining / 9);
  }


// ---- UI : repères glucidiques (pédagogie)
updateCarbCalcPanel({
  targetCraw,
  targetC,
  lowCarbEnabled,
  lowCarbKg,
  lowCarbImpossible,
  carbCapG,
  capFromGkg,
  capFromRatio,
  carbCapGPerKgApplied,
  ratioCPApplied
});

  // ============================================================
  // 5) Restes (cibles - consommé)
  // ============================================================
  const remK = targetKcal - eatenK;
  const remP = targetP - eatenP;
  const remC = targetC - eatenC;
  const remF = targetF - eatenF;

  const remKShow = Math.max(0, remK);
  const remPShow = Math.max(0, remP);
  const remCShow = Math.max(0, remC);
  const remFShow = Math.max(0, remF);

  // ============================================================
  // 6) BMR + UI annexe
  // ============================================================
  const bmr = mifflinStJeor(sex, w, h, age);
  updateBodyCompUI(dateForDay);

  // ============================================================
  // 7) Affichage sortie + KPI groups
  // ============================================================
// ✅ Ne jamais forcer l’affichage du panneau résultats ici.
// L’affichage + montage dépend uniquement de l’onglet actif (mountResultsPanel).
const activeTab =
  document.body.getAttribute("data-tab") ||
  document.querySelector(".menuItem.is-active")?.dataset.tab ||
  localStorage.getItem("secheapp.ui.activeTab") ||
  "dash";

mountResultsPanel(activeTab);

if (scrollToResults && (activeTab === "goal" || activeTab === "repas")) {
  $("out")?.scrollIntoView({ behavior: "smooth", block: "start" });
}


  const kpis = $("kpis");
  if (kpis) {
    kpis.innerHTML = "";

    const mk = (title, value, cls = "") => {
      const d = document.createElement("div");
      if (cls) d.className = cls;
      d.innerHTML = `<b>${title}</b>${value}`;
      return d;
    };

    // Groupe 1 : Régime + Objectif
    const groupDiet = document.createElement("div");
    groupDiet.className = "kpis-group kpis-group-diet";
    groupDiet.appendChild(mk("Régime", makeDietBadge(dietMode, goalPct)));
    groupDiet.appendChild(mk("Cible énergétique (%)", round(goalPct, 0) + "%"));
    kpis.appendChild(groupDiet);

    // Groupe 2 : Dépenses & cible kcal
    const groupEnergy = document.createElement("div");
    groupEnergy.className = "kpis-group kpis-group-energy";
    groupEnergy.appendChild(mk("Dépense montre (kcal)", round(montre, 0)));
    groupEnergy.appendChild(mk("Dépense ajustée (kcal)", round(montreAdjusted, 0), "warn"));
    groupEnergy.appendChild(mk("Cible du jour (kcal)", round(targetKcal, 0), "ok"));
    kpis.appendChild(groupEnergy);

// Groupe 3 : BMR (2 bulles, pleine largeur)
const groupBmr = document.createElement("div");
groupBmr.className = "kpis-group";
groupBmr.setAttribute("data-um", "expert");

// ✅ Force ce groupe à occuper toute la ligne du conteneur .kpi (flex-wrap)
groupBmr.style.flex = "1 1 100%";
groupBmr.style.width = "100%";

const bmrText =
`Pourquoi ?
Le métabolisme de base correspond à l’énergie minimale dépensée au repos
(respiration, organes, température…).

Comment l’utiliser ?
• Ce n’est PAS ta dépense du jour.
• Ta dépense réelle est toujours plus élevée (activité, digestion, mouvements).
• Ici, c’est un repère : un objectif trop bas par rapport à ton quotidien peut entraîner fatigue ou baisse de performance.

Exemple
BMR ≈ ${round(bmr,0)} kcal. Même une journée “calme” dépasse généralement cette valeur.`;

const deltaBmr = round(targetKcal - bmr, 0);
const deltaSign = deltaBmr > 0 ? "+" : "";
const deltaText =
`Lecture
Cible du jour − BMR.

Interprétation
• Si c’est très bas / négatif : ta cible est proche (ou sous) ton métabolisme de base → prudence.
• Si c’est positif : ta cible laisse une marge au-dessus du BMR (activité, digestion, etc.).

Valeur
${round(targetKcal,0)} − ${round(bmr,0)} = ${deltaSign}${deltaBmr} kcal`;

// 1) BMR
groupBmr.appendChild(
  mk(
    "BMR estimé (kcal)",
    `${round(bmr,0)} <span class="info-dot" role="button" tabindex="0" data-modaltext="${escapeHtml(bmrText)}">ℹ️</span>`
  )
);

// 2) Écart cible - BMR
groupBmr.appendChild(
  mk(
    "Écart cible − BMR (kcal)",
    `${deltaSign}${deltaBmr} <span class="info-dot" role="button" tabindex="0" data-modaltext="${escapeHtml(deltaText)}">ℹ️</span>`
  )
);

kpis.appendChild(groupBmr);
}

  // ============================================================
  // 8) Remplissage tableaux Résultats (targets / eaten / remaining)
  // ============================================================
  if ($("tK")) $("tK").textContent = round(targetKcal, 0);
  if ($("tP")) $("tP").textContent = round(targetP, 1);
  if ($("tC")) $("tC").textContent = round(targetC, 1);

  // UI : "Glucides : calcul auto" = affichage de la cible calculée (sans modifier le calcul)
  if ($("carbAutoHint")) {
    const wNow = Math.max(0, toNum($("weight")?.value));
    const gkg  = (wNow > 0) ? (targetC / wNow) : 0;
    $("carbAutoHint").value = `${round(targetC, 1)} g/j (≈ ${round(gkg, 2)} g/kg)`;
  }

  if ($("dietMode")?.value === "none") {
    // laisse le hint en mode neutre
    if ($("carbAutoHint")) $("carbAutoHint").value = "0";
    if ($("goalPct")) $("goalPct").value = "0";
    return; // IMPORTANT : stoppe l’UI qui écrase
  }

  if ($("tF")) $("tF").textContent = round(targetF, 1);

  if ($("eK"))  $("eK").textContent  = round(eatenK, 0);
  if ($("eP2")) $("eP2").textContent = round(eatenP, 1);
  if ($("eC2")) $("eC2").textContent = round(eatenC, 1);
  if ($("eF2")) $("eF2").textContent = round(eatenF, 1);

  if ($("rK")) $("rK").textContent = round(remKShow, 0);
  if ($("rP")) $("rP").textContent = round(remPShow, 1);
  if ($("rC")) $("rC").textContent = round(remCShow, 1);
  if ($("rF")) $("rF").textContent = round(remFShow, 1);

  // ============================================================
  // 8bis) Mini synthèse (Objectif/Repas) — feedback minimal + cohérent
  // ============================================================
  const setMini = (prefix) => {
    const k = $(prefix + "_remK");
    const p = $(prefix + "_remP");
    const c = $(prefix + "_remC");
    const f = $(prefix + "_remF");
    if (k) k.value = String(round(remKShow, 0));
    if (p) p.value = String(round(remPShow, 1));
    if (c) c.value = String(round(remCShow, 1));
    if (f) f.value = String(round(remFShow, 1));
  };
  setMini("miniGoal");
  setMini("miniRepas");

  // ============================================================
  // 9) Note (texte explicatif) + panneau pédagogique
  // ============================================================
  let note = `Valeurs indicatives pour le reste de la journée. Il n’est pas nécessaire d’atteindre chaque chiffre exactement.`;

  if (dietMode !== "custom" && fatFloor.min > 0) note += ` Plancher lipides: ${fatFloor.min} g/kg.`;

  if (kcalLeftForCbase < 0) {
    note += " ⚠️ Protéines + lipides (plancher) dépassent déjà les calories cibles : le plan est incohérent (baisse P/F ou hausse kcal).";
  } else {
    // Modes
    if (lowCarbEnabled) {
      note += ` Mode low-carb: ${round(lowCarbKg, 2)} g/kg/j.`;
      if (lowCarbImpossible) note += " ⚠️ Low-carb incompatible avec cette cible kcal + tes planchers (on a dû remonter les glucides pour atteindre la cible kcal).";
    } else if (!carbGuardEnabled) {
      note += " Repères glucidiques: désactivés.";
    }

    // Repères glucidiques
    const caps = [];
    if (carbCapGPerKg > 0) caps.push(`${round(carbCapGPerKg, 1)} g/kg/j`);
    if (ratioCP > 0)      caps.push(`Ratio glucides/protéines ≤ ${round(ratioCP, 2)}`);

    if (caps.length > 0) {
      note += ` Plafond glucides actif (${caps.join(" ; ")}).`;
      if (targetCraw > targetC + 0.01) {
        note += ` Glucides bruts ${round(targetCraw, 1)} g → plafonnés à ${round(targetC, 1)} g.`;
        note += " Les calories restantes ont été basculées vers les lipides pour garder la cible kcal.";
      }
    }
  }

  $("notes").textContent = note;

  // PATCH v17.1 — dietNote = résumé dynamique des options choisies
  const dn = $("dietNote");
  if (dn) {
    const parts = [];
    parts.push(`Objectif ${Math.round(goalPct)}%`);
    parts.push(`Prot ${round(protPerKg, 1)} g/kg`);
    parts.push(`Lip ${round(fatPerKgEff, 2)} g/kg`);
    const rcp = toNum($("ratioCP")?.value || 0);
    if (rcp > 0) parts.push(`Ratio C/P ≤ ${round(rcp, 2)}`);
    parts.push(carbGuardEnabled ? "Repères glucidiques ON" : "Repères glucidiques OFF");
    if (lowCarbEnabled) parts.push(`Low-carb ON (${round(lowCarbKg, 2)} g/kg/j)`);
    else parts.push("Low-carb OFF");
    dn.textContent = parts.join(" · ");
  }

  // Panneau pédagogique : décomposition des calories (pure UI)
  updateCalorieFlowViz({
    targetKcal,
    montreAdjusted,
    goalPct,
    w,
    protPerKg,
    fatPerKgEff,
    targetP,
    targetC,
    targetF,
    targetFbase,
    targetCraw,
    carbGuardEnabled,
    carbCapG,
    kcalRemaining,
    lowCarbEnabled,
    lowCarbKg,
    lowCarbLevel: ($("lowCarbLevel")?.value || ""),
    lowCarbImpossible
  });

  // ============================================================
  // 10) Sauvegarde journal + settings (si demandé)
  // ============================================================
  if (saveToJournal) {
    const existing = getDay(dateForDay) || { date: dateForDay };
    const meals    = getMealsForDay(dateForDay);

    const dayObj = {
      ...existing,
      date: dateForDay,

      watchBrand: $("watchBrand").value,
      montreRaw: montre,
      montreAdjusted,
      errPct,
      errMode,

      dietMode: dietMode,
      goalPct,

      protPerKg,
      fatPerKgEff,

      meals,
      eaten: { k: eatenK, p: eatenP, c: eatenC, f: eatenF },

      targetKcal, targetP, targetC, targetF, targetCraw,

      carbGoal: $("carbGoal")?.value || "sport",
      carbCapGPerKg,
      ratioCP,
      remaining: { k: remK, p: remP, c: remC, f: remF },

      morningWeight: (toNum($("morningWeight")?.value) > 0) ? toNum($("morningWeight").value) : (existing.morningWeight ?? null),
      fatPct: (toNum($("fatPct")?.value) > 0) ? toNum($("fatPct").value) : (existing.fatPct ?? null),
      musclePct: (toNum($("musclePct")?.value) > 0) ? toNum($("musclePct").value) : (existing.musclePct ?? null),
      boneKg: (toNum($("boneKg")?.value) > 0) ? toNum($("boneKg").value) : (existing.boneKg ?? null),

      bmr,
      updatedAt: new Date().toISOString()
    };

    upsertDay(dayObj);
    phase6CompatSaveProfileSettings();
  }

  // ============================================================
  // 11) Post-actions UI + diab module (si présent)
  // ============================================================
  applyUseMode($("useMode")?.value || "simple");

  try {
    if (typeof diab_updateQuickKpis === "function") diab_updateQuickKpis(getSelectedDate());
  } catch (e) {}
}


/* =====================================================================
   13) Wire Events (TOUT AU MÊME ENDROIT)
   Ici tu vois immédiatement : (UI id) -> (fonction)
   ===================================================================== */
