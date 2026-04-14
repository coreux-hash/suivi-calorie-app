/* =====================================================================
   11) Modal “info montre”
   UI piloté: #watchProfileInfo, #watchInfoModal, #watchInfoBody, boutons close/ok
   ===================================================================== */
function isSportOrExpert(){
  const m = document.body.getAttribute("data-usemode");
  return (m === "sport" || m === "expert");
}
function openWatchInfoModal(text){
  const modal = $("watchInfoModal");
  const body  = $("watchInfoBody");
  if (!modal || !body) return;
  body.textContent = text || "Aucune information.";
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}
function closeWatchInfoModal(){
  const modal = $("watchInfoModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

/* =====================================================================
   12) Compute (moteur)
   UI piloté: quasi tout (sorties tK/tP/tC/tF, notes, etc.)
   ===================================================================== */
/* ============================================================
   Carb repères : panneau explicatif (UI)
   - "Glucides calculés" = valeur avant plafonds
   - "Plafond pris en compte" = cap effectif (si contraignant ou non)
   ============================================================ */
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
    sport:    { min: 3.0,  max: 4.0,  label: "Sèche progressive" },
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
      : "Low-carb : glucides fixés, les lipides s’ajustent pour tenir la cible kcal.";
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

    const ratioCPApplied       = (!lowCarbEnabled && ratioCP > 0) ? ratioCP : 0; // ratio libre ou objectif (si repères ON), ignoré en low-carb
        carbCapGPerKgApplied = carbGuardEnabled ? carbCapGPerKg : 0; // g/kg seulement quand repères ON

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
function wireEvents(){
  const p6 = window.__Phase6;
  if (!p6) throw new Error('[Phase6.15] __Phase6 must be initialized before wireEvents().');
  const openTab = (tab, options = {}) => {
    return p6.NavigationFacade.openTab(tab, options);
  };
  const recompute = (saveToJournal = true, scrollToResults = false) => {
    return p6.LegacyBridges.recomputeFromWire(saveToJournal, scrollToResults);
  };
  const applyDiabEnabled = () => {
    return p6.LegacyBridges.updateDiabetesVisibility();
  };
  const settingsEntry = p6.SettingsEntryPoints;
  const settingsConsolidation = p6.SettingsConsolidation;
  const domainEntry = p6.DomainOrchestrator;
  const profileEntry = p6.ProfileEntryPoints;
  const sportSleepEntry = p6.SportSleepEntryPoints;

  const requirePhase6 = (groupName, methodName) => {
    return p6.Contracts.require(groupName, methodName);
  };
  const runDomain = (methodName, ...args) => {
    return requirePhase6('DomainOrchestrator', methodName)(...args);
  };
  const runSettings = (methodName, ...args) => {
    return requirePhase6('SettingsEntryPoints', methodName)(...args);
  };
  const runProfile = (methodName, ...args) => {
    return requirePhase6('ProfileEntryPoints', methodName)(...args);
  };
  const runSportSleep = (methodName, ...args) => {
    return requirePhase6('SportSleepEntryPoints', methodName)(...args);
  };

  // CGU
  $("ackTerms")?.addEventListener("change", () => {
    const ok = $("ackTerms").checked;
    setTermsAccepted(ok);
    setAppLocked(!ok);
    if (ok) {
      openTab("dash", { delay:0 });
    }
  });



  $("profileSelect")?.addEventListener("change", (e) => {
    runDomain('handleProfileChange', e.target.value);
  });

  // --- Profils : création / suppression (fix) ---
  $("btnCreateProfile")?.addEventListener("click", () => {
    const name = $("profileName")?.value || "";
    runProfile('createOrActivate', name);
    if ($("profileName")) $("profileName").value = "";
  });
  $("profileName")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("btnCreateProfile")?.click();
    }
  });
  $("btnDeleteProfile")?.addEventListener("click", () => {
    const active = getActiveProfile();
    if (active === "default") { runProfile('deleteActive'); return; }
    if (confirm("Supprimer cet utilisateur et ses données locales ?")) runProfile('deleteActive');
  });

  // --- Diabète : rendre l'option réellement inaccessible si OFF ---
  function updateDiabEnabledUI(){
    const enabled = !!($("diabEnabled")?.checked);

    // 1) Menu & onglet Diabète
    document.querySelectorAll('.menuItem[data-tab="diab"], .tabBtn[data-tab="diab"]').forEach(el=>{
      el.classList.toggle("is-disabled", !enabled);
      el.setAttribute("aria-disabled", String(!enabled));
    });

    // 2) Section Diabète (page) + accordéon historique diabète (journal)
    const diabSec = document.querySelector('.tabSection[data-tabsection="diab"]');
    if (diabSec) diabSec.classList.toggle("hidden", !enabled);

    const diabHist = $("accDiabHistoryFull");
    if (diabHist) diabHist.classList.toggle("hidden", !enabled);

    // 3) Panneau rapide (repas) : UI verrouillée si OFF
    try{ diab_setQuickPanelLocked(!enabled); }catch(e){}

    // 4) Si l'utilisateur est sur l'onglet diabète et désactive → retour journal
    try{
      const activeTab = document.querySelector(".tabSection.is-active")?.dataset?.tabsection || "";
      if (!enabled && activeTab === "diab") {
        openTab("journal", { delay:0, source:'diabetes-disabled-redirect' });
      }
    }catch(e){}
  }
  window.__phase67LegacyDiabUI = updateDiabEnabledUI;
  window.__updateDiabEnabledUI = function(){
    return window.__Phase6.Contracts.require('LegacyBridges', 'updateDiabetesVisibility')();
  };

  $("diabEnabled")?.addEventListener("change", () => {
    runDomain('handleDiabetesToggle');
  });

  // appliquer au démarrage (après loadProfileSettings ci-dessus)
  applyDiabEnabled();

  // --- Sommeil : calcul automatique de la durée à partir coucher/lever ---
  function computeSleepHoursFromTimes(){
    const bed = String($("sleepBed")?.value || "");
    const wake = String($("sleepWake")?.value || "");
    if (!bed || !wake) return;

    const [bh,bm] = bed.split(":").map(n=>parseInt(n,10));
    const [wh,wm] = wake.split(":").map(n=>parseInt(n,10));
    if (![bh,bm,wh,wm].every(n=>Number.isFinite(n))) return;

    let bMin = bh*60 + bm;
    let wMin = wh*60 + wm;
    let diff = wMin - bMin;
    if (diff < 0) diff += 24*60; // nuit qui passe minuit

    const hm = minutesToHM(diff);
    if ($("sleepHh")) $("sleepHh").value = String(hm.h);
    if ($("sleepMm")) $("sleepMm").value = String(hm.m);
    // compat (si d'autres morceaux lisent encore sleepH)
    if ($("sleepH")) $("sleepH").value = String(Math.round((diff/60)*10)/10);
  }
  $("sleepBed")?.addEventListener("change", computeSleepHoursFromTimes);
  $("sleepWake")?.addEventListener("change", computeSleepHoursFromTimes);


  function syncSleepHMToHidden(){
    const mins = hmToMinutes($("sleepHh")?.value, $("sleepMm")?.value);
    if ($("sleepH")) $("sleepH").value = String(Math.round((mins/60)*10)/10);
  }
  $("sleepHh")?.addEventListener("input", syncSleepHMToHidden);
  $("sleepMm")?.addEventListener("input", syncSleepHMToHidden);

  function syncSportHMToHidden(){
    const mins = hmToMinutes($("sportHh")?.value, $("sportMm")?.value);
    if ($("sportMin")) $("sportMin").value = String(mins);
  }
  $("sportHh")?.addEventListener("input", syncSportHMToHidden);
  $("sportMm")?.addEventListener("input", syncSportHMToHidden);



  // Montre
  $("watchBrand")?.addEventListener("change", () => {
    runSettings('handleWatchBrandChange');
  });

  // Régime
  $("dietMode")?.addEventListener("change", () => {
    runSettings('handleDietModeChange');
  });

  // Repères glucidiques
  $("carbGoal")?.addEventListener("change", () => {
    runSettings('handleCarbGoalChange');
  });

  $("carbStep")?.addEventListener("change", () => {
    runSettings('handleCarbStepChange');
  });

  $("carbCapGPerKg")?.addEventListener("input", () => {
    runSettings('handleCarbCapInput');
  });
  $("carbCapGPerKg")?.addEventListener("change", () => {
    runSettings('handleCarbCapChange');
  });

  $("fatFloorGPerKg")?.addEventListener("input", () => {
    runSettings('handleFatFloorInput');
  });
  $("fatFloorGPerKg")?.addEventListener("change", () => {
    runSettings('handleFatFloorChange');
  });

  // Mode d’usage
  $("useMode")?.addEventListener("change", () => {
    runSettings('handleUseModeChange');
  });

  // Diabète
  $("diabEnabled")?.addEventListener("change", () => {
    runSettings('handleDiabetesModeMirror');
  });

window.addEventListener("diab:carbs-pushed", (e) => {
  const d = e?.detail?.date || (getSelectedDate?.() || "");
  if (typeof diab_renderDayKpis === "function") diab_renderDayKpis(d);
});


  // Modal montre
  $("watchProfileInfo")?.addEventListener("keydown", (e) => {
    if (!isSportOrExpert()) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    openWatchInfoModal(e.currentTarget.getAttribute("data-modaltext") || "");
  });
  $("watchProfileInfo")?.addEventListener("click", () => {
    if (!isSportOrExpert()) return;
    openWatchInfoModal($("watchProfileInfo").getAttribute("data-modaltext") || "");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeWatchInfoModal(); });
  $("watchInfoClose")?.addEventListener("click", closeWatchInfoModal);
  $("watchInfoOk")?.addEventListener("click", closeWatchInfoModal);
  document.querySelector("#watchInfoModal .modal__backdrop")?.addEventListener("click", closeWatchInfoModal);

  // Preset edit -> custom
  ["goalPct","fatPerKg"].forEach(id => {
    $(id)?.addEventListener("change", () => {
      return runSettings('handlePresetFieldChange', id);
    });
  });

  $("protPerKg")?.addEventListener("change", () => {
    runSettings('handleProtPerKgChange');
  });

  // Calcul + scroll
  $("calcSpendBtn")?.addEventListener("click", () => recompute(true, true));

  // Repas
  $("btnAddMeal")?.addEventListener("click", addMealFromInputs);
  $("btnClearMeals")?.addEventListener("click", clearMealsForDay);

  // Repas — UI: Manuel vs Rapide /100g (réduit le bruit)
  function mealUI_setMode(mode){
    const isQuick = mode === "quick";
    const bM = $("mealModeManual");
    const bQ = $("mealModeQuick");
    const pM = $("mealPanelManual");
    const pQ = $("mealPanelQuick");

    if (bM){ bM.classList.toggle("is-active", !isQuick); bM.setAttribute("aria-selected", (!isQuick).toString()); }
    if (bQ){ bQ.classList.toggle("is-active", isQuick);  bQ.setAttribute("aria-selected", (isQuick).toString()); }
    if (pM) pM.classList.toggle("hidden", isQuick);
    if (pQ) pQ.classList.toggle("hidden", !isQuick);
  }
  $("mealModeManual")?.addEventListener("click", () => mealUI_setMode("manual"));
  $("mealModeQuick")?.addEventListener("click", () => mealUI_setMode("quick"));

  // Action unique en mode /100g : calcule puis ajoute le repas
  $("btnQuickAddMeal")?.addEventListener("click", () => {
    applyPer100ToMeal();
    addMealFromInputs();
  });

  // Valeur par défaut : Manuel
  mealUI_setMode("manual");
// Sommeil : édition explicite (1 nuit = 1 enregistrement)
$("btnSleepEdit")?.addEventListener("click", () => {
  sleepUI_setEditMode(true);
});
$("btnSleepSave")?.addEventListener("click", () => {
  const d = getSelectedDate();
  runSportSleep('saveSleep', d, { closeEditor:true, showPill:true });
});

// Sport : multi-séances (journal empilable)
$("btnSportAdd")?.addEventListener("click", () => {
  sportUI_setEditor(true);
});
$("btnSportSave")?.addEventListener("click", () => {
  const d = getSelectedDate();
  runSportSleep('addSportSession', d, { closeEditor:true, showPill:true });
});

// Suppression séance (event delegation)
$("sportSessionsList")?.addEventListener("click", (ev) => {
  const btn = ev.target?.closest?.("[data-sportdel]");
  if (!btn) return;
  const d = getSelectedDate();
  const id = btn.getAttribute("data-sportdel") || "";
  runSportSleep('deleteSportSession', d, id, { showPill:true });
});



  // Historique : delete all
  $("btnDeleteDay")?.addEventListener("click", () => {
    const n = loadDays().length;
    if (!n) return;
    if (!confirm(`Supprimer TOUT l’historique (${n} journée(s)) ?`)) return;
    deleteAllDays();
    const d = isoToday();
    if ($("dayDate")) $("dayDate").value = d;
    renderMealsTable(d);
    updateBodyCompUI(d);
    recompute(true);
    phase6CompatRenderHistoryPanels(d);
  });

  $("btnExportDays")?.addEventListener("click", exportDays);
  $("btnImportDays")?.addEventListener("click", importDays);
  $("btnClearDays")?.addEventListener("click", clearDays);

  // Cloud
  $("btnCloudLogin")?.addEventListener("click", () => cloudLoginWithEmail($("cloudEmail")?.value));
  $("btnCloudLogout")?.addEventListener("click", cloudLogout);
  $("btnCloudPull")?.addEventListener("click", cloudPull);
  $("btnCloudPush")?.addEventListener("click", cloudPush);
  $("btnCloudSync")?.addEventListener("click", cloudSync);

  // Date change
  $("dayDate")?.addEventListener("change", () => {
    runDomain('handleDateChange', getSelectedDate());
  });

  // Autosave générique — exclut les champs déjà frontés par des entry points dédiés
  const autoSaveIds = (settingsConsolidation?.getGenericAutoSaveIds?.() || ["sex","age","height","weight","montre","errPct","errMode","ratioCP"]);
  autoSaveIds.forEach(id => $(id)?.addEventListener("change", () => {
    return runSettings('handleAutoSaveChange', id);
  }));

  ["morningWeight","fatPct","musclePct","boneKg"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("change", () => {
      const dateStr = getSelectedDate();
      return runSettings('handleBodyCompChange', dateStr, { fieldId:id });
    });
  });

  // Carb-guard & low-carb toggles
// Carb-guard & low-carb toggles (exclusivité symétrique, sans verrou UI)
$("carbGuardEnabled")?.addEventListener("change", () => {
  runSettings('handleCarbGuardToggle');
});

$("lowCarbEnabled")?.addEventListener("change", () => {
  runSettings('handleLowCarbToggle');
});

$("lowCarbLevel")?.addEventListener("change", () => {
  runSettings('handleLowCarbLevelChange');
});
$("lowCarbStep")?.addEventListener("change", () => {
    runSettings('handleLowCarbStepChange');
  });
}

/* =====================================================================
   14) App Init (ordre d’exécution explicite)
   ===================================================================== */
function initApp(){
  return window.__Phase6.Contracts.require('InitializationEntryPoints', 'bootApp')({ forceToday:true, source:'initApp-global' });
}


/* =====================================================================
   PATCH v17.2 — corrections ciblées (sans refonte)
   - Fix mapping carbGoal (UI values) -> internal keys (FAT_FLOORS + steps)
   - Fix repères glucidiques (updateCarbSteps) + plancher lipides
   - Fix rappel rapide (setPositioningCopy) : doublon écrasant
   ===================================================================== */

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

  // Wire priorité RatioCP (sans casser wireEvents)
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

})();

/* =========================================================
   COMPROMIS OPTIMAUX — rendu sous le menu (minimal)
   Ne touche pas aux calculs : UI purement informative.
   UI : #compromiseSelect, #compromiseBox
   ========================================================= */
(function(){
  function _esc(s){
    try{ return (typeof escapeHtml === "function") ? escapeHtml(String(s)) : String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }
    catch{ return String(s); }
  }
  function byId(id){ return document.getElementById(id); }

  const COMPROMISE_DATA = {
    eq_global: {
      title:"Équilibre global (base santé / stabilité)",
      phase:"Équilibrage",
      objectif:["Maintenir un poids stable","Stabiliser l’énergie","Stabiliser la glycémie","Ancrer des habitudes durables"],
      compromis:["Pas d’optimisation extrême","Progression physique modérée"],
      macros:{ c:"≈ 45–55 %", p:"≈ 18–22 %", f:"≈ 25–35 %" },
      ajust:["Journée active → glucides ↑, lipides ↓","Journée calme → glucides ↓, lipides ↑","Protéines stables"],
      app:{ preset:"maintain / équilibre", carbGoals:["maintain"], fatFloors:["maintain"] },
      plus:["Idéal pour poser une base saine avant toute phase plus spécifique.","Convient si l’objectif principal est la régularité, pas la transformation rapide."]
    },
    eq_gly: {
      title:"Stabilité glycémique (équilibrage orienté satiété)",
      phase:"Équilibrage / transition",
      objectif:["Stabiliser la glycémie","Réduire les fringales","Stabiliser l’énergie"],
      compromis:["Flexibilité alimentaire réduite","Phase d’adaptation possible"],
      macros:{ c:"≈ 35–45 %", p:"≈ 20–25 %", f:"≈ 30–35 %" },
      ajust:["Glucides concentré autour de l’effort","Fibres ↑","Lipides plutôt éloignés du post-effort"],
      app:{ preset:"recomp", carbGoals:["recomp","maintain"], fatFloors:["recomp","maintain"], note:"inactive" },
      plus:["Utile si tu as souvent faim, des coups de barre ou des envies de sucre.","Convient mieux aux journées peu explosives qu’aux efforts très intenses."]
    },
    cut_sport: {
      title:"Sèche progressive (référence amaigrissement)",
      phase:"Amaigrissement",
      objectif:["Réduire la masse grasse","Préserver la masse musculaire","Soutenir la performance"],
      compromis:["Perte de gras plus progressive","Rigueur alimentaire plus élevée"],
      macros:{ c:"≈ 35–45 %", p:"≈ 25–30 %", f:"≈ 25–30 %" },
      ajust:["Jours lourds → glucides ↑, lipides ↓","Jours OFF → glucides ↓, lipides ↑","Protéines constantes"],
      app:{ preset:"cut_standard", carbGoals:["sport"], fatFloors:["sport"] },
      plus:["Le meilleur compromis pour perdre du gras sans sacrifier l’entraînement.","C’est le choix le plus sûr pour une sèche active et durable."]
    },
    cut_fast: {
      title:"Sèche rapide (court terme)",
      phase:"Amaigrissement (court terme)",
      objectif:["Réduire la masse grasse","Obtenir un résultat visible à court terme"],
      compromis:["Performance en baisse","Fatigue accrue","Durée limitée"],
      macros:{ c:"≈ 25–35 %", p:"≈ 30–35 %", f:"≈ 25–30 %" },
      ajust:["Réduire le volume d’entraînement","Planifier une pause / refeed si nécessaire","Surveiller sommeil / récupération"],
      app:{ preset:"cut_aggressive", carbGoals:["strict"], fatFloors:["strict"] },
      plus:["À utiliser comme un outil ponctuel, jamais comme un mode de vie.","Adapté à un objectif rapide avec une date précise."]
    },
    recomp: {
      title:"Recomposition modérée",
      phase:"Transition",
      objectif:["Améliorer la composition corporelle","Limiter les variations de poids","Faciliter la transition"],
      compromis:["Progression plus progressive","Rigueur alimentaire plus élevée"],
      macros:{ c:"≈ 40–50 %", p:"≈ 20–25 %", f:"≈ 25–30 %" },
      ajust:["Glucides modulés à l’entraînement","Léger déficit certains jours seulement","Priorité au rassasiant"],
      app:{ preset:"recomp", carbGoals:["recomp"], fatFloors:["recomp"] },
      plus:["Idéal si le poids stagne mais que la composition corporelle s’améliore.","Convient bien aux phases de transition ou de reprise."]
    },
    endurance: {
      title:"Performance / endurance",
      phase:"Performance",
      objectif:["Soutenir l’endurance","Améliorer la récupération","Soutenir la performance"],
      compromis:["Amaigrissement non prioritaire","Apports énergétiques plus élevés"],
      macros:{ c:"≈ 55–65 %", p:"≈ 15–20 %", f:"≈ 20–25 %" },
      ajust:["Carb-loading ponctuel si besoin","Lipides plus bas transitoirement (48–72 h) en carb-load","Protéines stables"],
      app:{ preset:"endurance", carbGoals:["volume","carbload"], fatFloors:["volume","carbload"] },
      plus:["À privilégier quand la performance et le volume priment sur l’esthétique.","Peu compatible avec un objectif d’amaigrissement rapide."]
    },
    protect: {
      title:"Protection musculaire / récupération prioritaire",
      phase:"Sèche longue / fatigue",
      objectif:["Préserver la masse musculaire","Améliorer la récupération","Réduire le risque de surmenage"],
      compromis:["Perte de gras plus progressive","Apports énergétiques modérés","Suivi alimentaire nécessaire"],
      macros:{ c:"≈ 30–40 %", p:"≈ 28–32 %", f:"≈ 28–32 %" },
      ajust:["Glucides renforcés post-effort","Lipides maintenus un peu plus hauts les jours OFF","Protéines réparties sur la journée"],
      app:{ preset:"recomp (ou cut_standard)", carbGoals:["recomp","sport"], fatFloors:["recomp"] },
      plus:["Idéal en période de fatigue, blessures légères, ou volume élevé.","Bon choix si tu veux continuer à t’entraîner sans t’écraser."]
    },
    adherence: {
      title:"Simplicité / adhérence long terme",
      phase:"Toutes phases",
      objectif:["Tenir sur la durée","Réduire la charge mentale","Maintenir une cohérence hebdomadaire"],
      compromis:["Suivi alimentaire plus structuré","Ajustements plus progressifs"],
      macros:{ c:"≈ 40–50 %", p:"≈ 20–25 %", f:"≈ 25–30 %" },
      ajust:["Repas types répétés","Ajustement hebdo plutôt que journalier","Flexibilité planifiée"],
      app:{ preset:"maintain (ou recomp)", carbGoals:["maintain"], fatFloors:["maintain"] },
      plus:["Compromis clé pour éviter l’abandon et le rebond.","Le meilleur choix si tu veux une routine simple qui marche."]
    }
  };

function dietPresetLabel(key){
  if (!key) return "—";
  // accepte "maintain / équilibre" (texte déjà prêt)
  if (key.includes("/") || key.includes(" ")) return key;
  if (typeof dietLabel === "function") return dietLabel(key);
  if (typeof DIET_PRESETS !== "undefined" && DIET_PRESETS[key]?.label) return DIET_PRESETS[key].label;
  return key;
}

function carbGoalLabel(key){
  if (!key) return "—";
  if (typeof CARB_GOALS !== "undefined" && CARB_GOALS[key]?.label) return CARB_GOALS[key].label;
  return key;
}

function fatFloorLabel(key){
  if (!key) return "—";
  if (typeof FAT_FLOORS !== "undefined" && FAT_FLOORS[key]?.min != null) return `${String(FAT_FLOORS[key].min).replace('.',',')} g/kg`;
  if (typeof FAT_FLOORS !== "undefined" && FAT_FLOORS[key]?.note) {
    const m = String(FAT_FLOORS[key].note || '').match(/(\d+(?:[.,]\d+)?)\s*(?:[–-]\s*(\d+(?:[.,]\d+)?))?\s*g\/kg/);
    if (m) return (m[2] ? `${m[1]}–${m[2]}` : m[1]) + ' g/kg';
    return FAT_FLOORS[key].note;
  }
  return key;
}

function lowCarbStatus(app){
  const note = String(app?.note || '').toLowerCase();
  if (/active|activée|enabled|on|low[_ -]?carb modéré/.test(note)) return 'activée';
  if (/possible|optionnelle|optionnel|non recommandée|désactivée|inactive|off/.test(note)) return 'inactive';
  const preset = String(app?.preset || '').toLowerCase();
  if (/cut_aggressive/.test(preset)) return 'activée';
  return 'inactive';
}

function normalizeMacroPct(value){
  return String(value || '')
    .replace(/\s*≈\s*/g, '≈ ')
    .replace(/\s*%/g, ' %')
    .replace(/\s*–\s*/g, '–')
    .trim();
}

function formatMacroBalance(macros){
  const c = normalizeMacroPct(macros?.c);
  const p = normalizeMacroPct(macros?.p);
  const f = normalizeMacroPct(macros?.f);
  return `Glucides ${_esc(c)} · Protéines ${_esc(p)} · Lipides ${_esc(f)}`;
}


  function render(c){
    const chips = [];
    chips.push(`Type de régime : ${dietPresetLabel(c.app.preset)}`);
    chips.push(`Repères glucides : ${c.app.carbGoals.map(carbGoalLabel).join(", ")}`);
    chips.push(`Plancher lipides : ${c.app.fatFloors.map(fatFloorLabel).join(", ")}`);
    chips.push(`Option low-carb : ${lowCarbStatus(c.app)}`);

    const list = (arr)=> `<ul class="muted" style="margin:.25rem 0 .25rem 1.1rem">${arr.map(x=>`<li>${_esc(x)}</li>`).join("")}</ul>`;

    return `
      <div style="margin-bottom:.35rem"><b>${_esc(c.title)}</b> <span class="muted">— ${_esc(c.phase)}</span></div>
      <table>
        <tbody>
          <tr><th style="width:220px">Objectif (apporte)</th><td>${list(c.objectif)}</td></tr>
          <tr><th>Compromis</th><td>${list(c.compromis)}</td></tr>
          <tr><th>Équilibre macros (%)</th>
              <td class="muted">${formatMacroBalance(c.macros)}</td></tr>
          <tr><th>Ajustement fin</th><td>${list(c.ajust)}</td></tr>
          <tr><th>Réglages appliqués par l’app</th><td class="muted">${_esc(chips.join(" · "))}</td></tr>
        </tbody>
      </table>
      <div class="muted" style="margin-top:.5rem">
        <b>👉</b> ${_esc(c.plus[0])}<br>
        <b>👉</b> ${_esc(c.plus[1])}
      </div>
    `;
  }

  function wire(){
    const sel = byId("compromiseSelect");
    const box = byId("compromiseBox");
    const summary = byId("compromiseSummary");
    const details = byId("compromiseDetails");
    if (!sel || !box) return;

    let prevKey = String(sel.value || "");

    function buildSummary(c){
      // résumé court : 2 objectifs + 1 compromis
      const o = Array.isArray(c.objectif) ? c.objectif.slice(0,2) : [];
      const k = Array.isArray(c.compromis) ? c.compromis.slice(0,1) : [];
      const bits = []
        .concat(o.map(x=>_esc(x)))
        .concat(k.map(x=>_esc(x)));
      return `<b>${_esc(c.phase)}</b> · ${bits.join(" · ")}`;
    }

    function update(){
      const key = String(sel.value || "");
      const c = COMPROMISE_DATA[key];

      if (!c){
        if (summary) summary.innerHTML = 'Sélectionne un compromis pour voir le résumé.';
        box.innerHTML = '<div class="muted">Sélectionne un compromis pour afficher la fiche.</div>';
        if (details) details.open = false;
        prevKey = key;
        return;
      }

      // 1) résumé toujours visible
      if (summary) summary.innerHTML = buildSummary(c);

      // 2) détail repliable
      box.innerHTML = render(c);

      // Auto-ouvrir le détail uniquement quand l’utilisateur change de compromis
      if (details){
        if (prevKey !== key && key){
          details.open = true;
        }
      }
      prevKey = key;
    }

    sel.addEventListener("change", update);
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
