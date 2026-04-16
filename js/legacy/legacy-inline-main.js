/* =====================================================================
   ✅ STRUCTURE (copie-colle) : “qui pilote quoi”
   Objectif : que tu voies immédiatement quel UI (div/id/class/button)
   est piloté par quelle fonction, et où ranger tes blocs.
   ===================================================================== */

/* =========================
   0) DOM MAP (référence unique)
   ========================= */
const DOM_MAP = {
  // --- CGU / verrouillage ---
  terms: {
    checkbox: "#ackTerms",
    allowTab: "welcome",
    lockClass: "html.app-locked",
    lockTargets: [".tabBtn", ".menuItem"]
  },

  // --- Navigation / tabs / menu mobile ---
  nav: {
    menuBtn: "#menuBtn",
    menuPanel: "#menuPanel",
    menuItems: ".menuItem[data-tab]",
    tabBtns: ".tabBtn[data-tab]",
    sections: ".tabSection[data-tabsection]"
  },

  // --- Profil ---
  profile: {
    select: "#profileSelect",
    name: "#profileName",
    btnCreate: "#btnCreateProfile",
    btnDelete: "#btnDeleteProfile"
  },

  // --- Inputs “profil & calcul” ---
  inputs: {
    date: "#dayDate",
    sex: "#sex", age:"#age", height:"#height", weight:"#weight",
    montre:"#montre", watchBrand:"#watchBrand", errPct:"#errPct", errMode:"#errMode",
    dietMode:"#dietMode", goalPct:"#goalPct", protPerKg:"#protPerKg", fatPerKg:"#fatPerKg",
    useMode:"#useMode"
  },

  // --- Repères glucidiques / low-carb ---
  carb: {
    enabledGuard:"#carbGuardEnabled",
    enabledLow:"#lowCarbEnabled",
    goal:"#carbGoal",
    step:"#carbStep",
    cap:"#carbCapGPerKg",
    ratio:"#ratioCP",
    explain:"#carbGuardExplain",
    goalHelp:"#carbGoalHelp",
    carbAutoHint:"#carbAutoHint",
    lowLevel:"#lowCarbLevel",
    lowStep:"#lowCarbStep",
    lowBox:"#lowCarbBox",
    fatFloor:"#fatFloorGPerKg",
    fatFloorExplain:"#fatFloorExplain",
    fatRangeHint:"#fatRangeHint",
    protRangeHint:"#protRangeHint"
  },

  // --- Repas du jour ---
  meals: {
    wrap:"#mealsTableWrap",
    name:"#mealName", k:"#mealK", p:"#mealP", c:"#mealC", f:"#mealF",
    btnAdd:"#btnAddMeal",
    btnClear:"#btnClearMeals",
    per100: { qKcal:"#qKcal100", qW:"#qWeight", qP:"#qP100", qC:"#qC100", qF:"#qF100" }
  },

  // --- Sorties / résultats / KPI ---
  out: {
    out:"#out",
    kpis:"#kpis",
    t:"#tK,#tP,#tC,#tF",
    e:"#eK,#eP2,#eC2,#eF2",
    r:"#rK,#rP,#rC,#rF",
    notes:"#notes"
  },

  // --- Historique ---
  history: {
    days:"#daysHistory",
    btnDeleteAll:"#btnDeleteDay",
    btnExport:"#btnExportDays",
    btnImport:"#btnImportDays",
    btnClear:"#btnClearDays",
    jsonBox:"#daysJsonBox"
  },

  // --- Compo corporelle ---
  body: {
    mw:"#morningWeight", fp:"#fatPct", mp:"#musclePct", bk:"#boneKg",
    avg7:"#avg7Weight", wkVar:"#wkVarPct",
    bmiUsed:"#bmiWeightUsed", bmiVal:"#bmiVal", bmiCat:"#bmiCat",
    trend: {
      spend:"#avg7SpendKcal", eat:"#avg7EatKcal", def:"#avg7DefKcal",
      proj:"#projWkKg", cmp:"#deltaRealVsTheo", qual:"#dataQuality7", note:"#trend7Note"
    }
  },

  // --- Viz calories (panneau pédagogique) ---
  flow: {
    card:"#calFlowCard",
    bars:"#barP,#barC,#barF",
    delta:"#flow_deltaKcal",
    txt:"#flow_targetKcal,#flow_spendKcal,#flow_pKcal,#flow_cKcal,#flow_fKcal,#flow_pG,#flow_cG,#flow_fG",
    cap:"#flow_capState,#flow_capG,#flow_cTheoG,#flow_shiftKcal,#flow_fBaseG,#flow_fExtraG"
  },

  // --- Diabète ---
  diab: {
    enabled:"#diabEnabled",
    menuItem:"#diabMenuItem",
    panel:"#diabPanelInRepas",
    quickStatus:"#diabQuickStatus",
    quick: {
      carb:"#diabQuickCarbG",
      net:"#diabQuickNetCarbG",
      portions:"#diabQuickPortions",
      last:"#diabQuickLastG",
      line:"#diabQuickLine",
      reco:"#diabQuickReco",
      recoText:"#diabQuickRecoText",
},
    blocksWrap:"#diabBlocksWrap",
    blocksHome:"#diabBlocksHome"
  },

  // --- Cloud sync ---
  cloud: {
    status:"#cloudStatus",
    email:"#cloudEmail",
    btnLogin:"#btnCloudLogin",
    btnLogout:"#btnCloudLogout",
    btnPull:"#btnCloudPull",
    btnPush:"#btnCloudPush",
    btnSync:"#btnCloudSync"
  },

  // --- Modal info montre ---
  modal: {
    trigger:"#watchProfileInfo",
    modal:"#watchInfoModal",
    body:"#watchInfoBody",
    close:"#watchInfoClose",
    ok:"#watchInfoOk",
    backdrop:"#watchInfoModal .modal__backdrop"
  },

  // --- Boutons ---
  actions: {
    calcSpend:"#calcSpendBtn"
  }
};

/* =========================
   1) Utils (ne touche pas au DOM sauf via $)
   ========================= */
const $ = (id) => document.getElementById(id);

const toNum = (v) => {
  const s = String(v ?? "").replace(",", ".").trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
const round = (v, d=1) => {
  const f = Math.pow(10, d);
  return Math.round((v + Number.EPSILON) * f) / f;
};
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));


// --- Temps : helpers (minutes <-> HH/MM) ---
function hmToMinutes(hh, mm){
  const h = Math.max(0, Math.floor(toNum(hh) || 0));
  const m = Math.max(0, Math.floor(toNum(mm) || 0));
  return h*60 + Math.min(59, m);
}
function minutesToHM(mins){
  const m = Math.max(0, Math.round(toNum(mins) || 0));
  return { h: Math.floor(m/60), m: m % 60 };
}
function fmtHM(mins){
  const x = minutesToHM(mins);
  return x.m === 0 ? `${x.h}h` : `${x.h}h${String(x.m).padStart(2,'0')}`;
}
function fmtSportMinutes(mins){
  const m = Math.max(0, Math.round(toNum(mins) || 0));
  if (m < 60) return `${m} min`;
  const x = minutesToHM(m);
  return `${x.h}h${String(x.m).padStart(2,'0')}`;
}
function getSleepMinutesFromObj(sl){
  if (!sl) return 0;
  const mm = toNum(sl.minutes);
  if (mm > 0) return Math.round(mm);
  const h = toNum(sl.hours);
  return h > 0 ? Math.round(h*60) : 0;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

function isoToday() { return new Date().toISOString().slice(0,10); }
function getSelectedDate() {
  const v = $("dayDate")?.value;
  return v && v.length === 10 ? v : isoToday();
}
function refreshDaySelect(){ /* no-op compat */ }
function initPinnedTips(){
  // 1) Info-dots : délégation de clic → réutilise la modale "watchInfoModal"
  document.addEventListener("click", (e) => {
    const dot = e.target?.closest?.(".info-dot");
    if (!dot) return;
    e.preventDefault();
    const txt = dot.getAttribute("data-modaltext") || dot.getAttribute("data-help") || "";
    if (!txt) return;
    try { openWatchInfoModal(txt); } catch(err) { console.warn("info-dot modal failed", err); }
  });

  // 2) Assure l'existence de l'élément d'explication des repères glucidiques
  if (!$("carbGuardExplain")) {
    const anchor = $("dietNote") || $("carbCapGPerKg") || document.body;
    const div = document.createElement("div");
    div.id = "carbGuardExplain";
    div.className = "muted mt-02";
    div.textContent = "";
    // insertion la plus sûre : juste avant dietNote si possible
    if (anchor && anchor.parentNode) {
      if (anchor.id === "dietNote") anchor.parentNode.insertBefore(div, anchor);
      else anchor.parentNode.appendChild(div);
    }
  }

  // 3) Patch CSS injecté via structure JS "patch"
  const patch = {
    css: `
      /* PATCH v17.1 — ergonomie info-dots + zone explicative repères */
      .info-dot{ cursor:pointer; }
      #carbGuardExplain{ opacity:.92; }
    `,
    apply(){
      if (document.getElementById("patchStyle")) return;
      const st = document.createElement("style");
      st.id = "patchStyle";
      st.textContent = this.css;
      document.head.appendChild(st);
    }
  };
  patch.apply();
}

function mifflinStJeor(sex, weightKg, heightCm, ageY) {
  if (sex === "M") return 10*weightKg + 6.25*heightCm - 5*ageY + 5;
  return 10*weightKg + 6.25*heightCm - 5*ageY - 161;
}

/* =====================================================================
   2) CGU / Verrouillage
   UI piloté: #ackTerms, .tabBtn[data-tab], .menuItem[data-tab]
   ===================================================================== */
const TERMS_KEY = "termsAccepted_v1";

function isTermsAccepted(){
  try { return localStorage.getItem(TERMS_KEY) === "1"; }
  catch(e){ return false; }
}
function setTermsAccepted(ok){
  try { localStorage.setItem(TERMS_KEY, ok ? "1" : "0"); }
  catch(e){}
}
function setAppLocked(locked){
  document.documentElement.classList.toggle("app-locked", !!locked);
  document.querySelectorAll(".tabBtn, .menuItem").forEach(el => {
    const tab = el.getAttribute("data-tab");
    const allow = (tab === "welcome");
    el.classList.toggle("is-disabled", locked && !allow);
    el.setAttribute("aria-disabled", (locked && !allow) ? "true" : "false");
  });
}

/* =====================================================================
   X) MONTRE & MODES (indispensable)
   - WATCH_ESTIMATION_PROFILES
   - applyBrandPreset()
   - setPositioningCopy()
   - applyUseMode()
   ===================================================================== */
      /* Phase 6.31: WATCH_ESTIMATION_PROFILES extracted to ./js/legacy/legacy-compat-ui.js */


      
function applyBrandPreset(...args){
  return window.__LegacyCompatUI?.applyBrandPreset?.(...args);
}


      
function setPositioningCopy(...args){
  return window.__LegacyCompatUI?.setPositioningCopy?.(...args);
}


      
function applyUseMode(...args){
  return window.__LegacyCompatUI?.applyUseMode?.(...args);
}


/* =====================================================================
   3) Navigation / Tabs / Menu (desktop + mobile)
   UI piloté: #menuBtn, #menuPanel, .menuItem, .tabBtn, .tabSection
   ===================================================================== */

function closeMenu(...args){
  return window.__LegacyCompatUI?.closeMenu?.(...args);
}


function openMenu(...args){
  return window.__LegacyCompatUI?.openMenu?.(...args);
}


function toggleMenu(...args){
  return window.__LegacyCompatUI?.toggleMenu?.(...args);
}



function closeAllTutorialDetails(...args){
  return window.__LegacyCompatUI?.closeAllTutorialDetails?.(...args);
}


document.addEventListener("DOMContentLoaded", () => {
  closeAllTutorialDetails(); // tout fermé au démarrage
});



function resolvePhase0Tab(tab){
  const map = {
    welcome: "settings",
    dash: "settings",
    goal: "settings",
    cloud: "settings",
    lexicon: "settings",
    synth: "today",
    repas: "journalEntry",
    diab: "journalEntry",
    journal: "history"
  };
  return map[tab] || tab;
}

function phase0MoveChildren(sourceSelector, targetId){
  const source = document.querySelector(sourceSelector);
  const target = $(targetId);
  if (!source || !target) return;
  Array.from(source.children).forEach(node => target.appendChild(node));
  source.classList.add('legacy-host');
}

function phase0MoveNode(selector, targetId){
  const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
  const target = $(targetId);
  if (!node || !target) return;
  target.appendChild(node);
}

function initPhase0Shell(){
  if (window.__phase0ShellInit) return;
  window.__phase0ShellInit = true;

  phase0MoveChildren('section[data-tabsection="welcome"]', 'settingsWelcomeSlot');
  phase0MoveChildren('section[data-tabsection="dash"]', 'settingsProfileSlot');
  phase0MoveChildren('section[data-tabsection="goal"]', 'settingsGoalsSlot');
  phase0MoveChildren('section[data-tabsection="repas"]', 'journalMealsSlot');
  phase0MoveChildren('section[data-tabsection="synth"]', 'todayMainSlot');
  phase0MoveChildren('section[data-tabsection="diab"]', 'journalDiabSlot');
  phase0MoveChildren('section[data-tabsection="cloud"]', 'settingsCloudSlot');
  phase0MoveChildren('section[data-tabsection="lexicon"]', 'settingsHelpSlot');

  phase0MoveNode('#miniSummaryGoalCard', 'todayQuickSlot');
  phase0MoveNode('#miniSummaryRepasCard', 'todayQuickSlot');

  phase0MoveNode('#historyV2Card', 'historyMainSlot');
  phase0MoveNode('#sportCard', 'journalActivitySlot');
  phase0MoveNode('#sleepCard', 'journalSleepSlot');
  phase0MoveNode('#accHistAdvanced', 'journalMetricsSlot');
  phase0MoveNode('#accTrendExpert', 'historyTrendSlot');
  phase0MoveNode('#accDiabHistoryFull', 'historyHealthSlot');
  phase0MoveNode('#daysHistory', 'historyHealthSlot');

  const historyNoiseCard = $('historyNoiseCard');
  if (historyNoiseCard && !historyNoiseCard.children.length) historyNoiseCard.classList.add('legacy-host');
  document.querySelectorAll('section[data-tabsection="welcome"], section[data-tabsection="dash"], section[data-tabsection="goal"], section[data-tabsection="repas"], section[data-tabsection="synth"], section[data-tabsection="journal"], section[data-tabsection="diab"], section[data-tabsection="cloud"], section[data-tabsection="lexicon"]').forEach(sec => sec.classList.add('legacy-host'));
}

function phase0ApplyTabUiState(resolvedTab){
  const menuItems = document.querySelectorAll(".menuItem");
  const tabBtns   = document.querySelectorAll(".tabBtn");
  const sections  = document.querySelectorAll(".tabSection");

  menuItems.forEach(i => i.classList.toggle("is-active", i.dataset.tab === resolvedTab));
  tabBtns.forEach(b  => b.classList.toggle("is-active", b.dataset.tab === resolvedTab));
  sections.forEach(s => s.classList.toggle("is-active", s.dataset.tabsection === resolvedTab));
  try{ document.body.setAttribute("data-tab", resolvedTab); }catch{}

  mountResultsPanel(resolvedTab);
  return resolvedTab;
}

function phase0PersistActiveTabState(resolvedTab){
  try{ localStorage.setItem("secheapp.ui.activeTab", resolvedTab); }catch{}
  return resolvedTab;
}

function phase0RunLegacyTabSideEffects(resolvedTab){
  return { tab: resolvedTab, date: getSelectedDate?.() || null, mode: 'phase6-owned', neutralized:true };
}

function setActiveTab(tab){
  const resolvedTab = resolvePhase0Tab(tab);
  if (!isTermsAccepted() && !["welcome", "settings"].includes(resolvedTab)){
    alert("Lis et coche 'Conditions générales' pour déverrouiller l’application.");
    return;
  }

  phase0ApplyTabUiState(resolvedTab);
  phase0PersistActiveTabState(resolvedTab);

  const phase6 = window.__Phase6;
  if (!phase6?.Contracts?.require) {
    throw new Error('[Phase6.15] __Phase6.Contracts.require is required by setActiveTab().');
  }
  try{
    phase6.Contracts.require('TabSideEffects', 'runForTab')(resolvedTab, { source:'setActiveTab' });
    phase6.RuntimeHooks?.afterTabChange?.({ tab: resolvedTab, source:'setActiveTab' });
  }catch(e){
    console.error('[Phase6.15:setActiveTab]', e);
    throw e;
  }

  try{ closeMenu(); }catch{}
  closeAllTutorialDetails();
  return resolvedTab;
}

function initTabs(){
  const saved = localStorage.getItem("secheapp.ui.activeTab") || "today";
  setActiveTab(isTermsAccepted() ? saved : "settings");

  // Menu items
  document.querySelectorAll(".menuItem").forEach(btn => {
    btn.addEventListener("click", () => {
      window.__Phase6.Contracts.require('CompositeEntryPoints', 'openTab')(btn.dataset.tab, { delay:0 });
      closeMenu();
    });
  });

  // Primary phase-1 tabs
  document.querySelectorAll(".tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      window.__Phase6.Contracts.require('CompositeEntryPoints', 'openTab')(btn.dataset.tab, { delay:0 });
    });
  });

  // Hamburger
  $("menuBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Click extérieur
  document.addEventListener("click", (e) => {
    const panel = $("menuPanel");
    const btn = $("menuBtn");
    if (!panel || !btn) return;
    if (!panel.classList.contains("is-open")) return;
    if (!panel.contains(e.target) && !btn.contains(e.target)) closeMenu();
  });

  // Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Historique: suppr journée (délégation)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.('button[data-action="del-day"]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const dateStr = btn.getAttribute("data-date");
    if (!dateStr) return;
    if (!confirm(`Supprimer la journée complète du ${dateStr} ?`)) return;

    window.__Phase6.Contracts.require('HistoryEntryPoints', 'deleteDay')(dateStr);
    return;
  });

  // Historique diabète: suppr données diab jour (délégation)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.('button[data-action="diab-del-day"]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const dateStr = btn.getAttribute("data-date");
    if (!dateStr) return;
    if (!confirm(`Supprimer uniquement les données diabète du ${dateStr} ?`)) return;
    window.__Phase6.Contracts.require('HistoryEntryPoints', 'deleteDiabetesData')(dateStr);
    return;
  });
}

function mountResultsPanel(activeTab){
  const out = $("out");
  if (!out) return;

  const todayMount = $("todayMainSlot");
  const shouldShow = (activeTab === "today" || activeTab === "synth");
  out.classList.toggle("hidden", !shouldShow);

  if (!todayMount) return;
  if (out.parentNode !== todayMount) todayMount.appendChild(out);
}


/* =====================================================================
   4) Presets / Régimes / Repères glucidiques / Plancher lipides
   UI piloté: #dietMode, #goalPct, #protPerKg, #fatPerKg,
              #carbGoal, #carbStep, #carbCapGPerKg, #ratioCP,
              #fatFloorGPerKg, #fatFloorExplain, #fatRangeHint,
              #carbAutoHint, #protRangeHint
   ===================================================================== */

/* ===== labels régime ===== */

function dietLabel(...args){
  return window.__LegacyCompatUI?.dietLabel?.(...args);
}


/* Phase 6.31: DIET_PRESETS extracted to ./js/legacy/legacy-compat-ui.js */



function setDietNote(...args){
  return window.__LegacyCompatUI?.setDietNote?.(...args);
}



function setDietNoneUI(...args){
  return window.__LegacyCompatUI?.setDietNoneUI?.(...args);
}


/* ===== Repères glucidiques ===== */
/* Phase 6.31: CARB_GOALS extracted to ./js/legacy/legacy-compat-ui.js */


/* Phase 6.31: LOW_CARB_GOALS extracted to ./js/legacy/legacy-compat-ui.js */


const PROT_RANGES = {
  cut_standard:   { min: 1.7, max: 2.3, def: 1.9 },
  cut_aggressive: { min: 2.0, max: 2.6, def: 2.2 },
  recomp:         { min: 1.6, max: 2.3, def: 1.8 },
  maintain:       { min: 1.4, max: 1.9, def: 1.6 },
  endurance:      { min: 1.5, max: 2.0, def: 1.7 },
};

const FAT_FLOOR_RANGES_BY_DIET = {
  cut_aggressive: { min: 0.8, max: 1.0 },
  cut_standard:   { min: 0.9, max: 1.1 },
  recomp:         { min: 0.9, max: 1.1 },
  maintain:       { min: 0.9, max: 1.2 },
  endurance:      { min: 0.9, max: 1.1 },
  custom:         { min: 0.0, max: 5.0 }
};

const FAT_FLOORS = {
  strict:   { min: 0.8, note: "Plancher 0,8 g/kg (socle hormonal + vitamines)." },
  sport:    { min: 0.8, note: "Plancher 0,8 g/kg (souvent 0,8–0,9 selon charge)." },
  recomp:   { min: 0.9, note: "Plancher 0,9 g/kg (stabilité & durée)." },
  maintain: { min: 0.9, note: "Plancher 0,9 g/kg (souvent 0,9–1,0 en maintien actif)." },
  volume:   { min: 1.0, note: "Plancher 1,0 g/kg (volume/endurance : récupération + énergie)." },
  carbload: { min: 0.6, note: "Carb-loading : 0,6–0,7 g/kg possible 48–72 h (exception transitoire)." }
};


function fatFloorForGoal(...args){
  return window.__LegacyCompatUI?.fatFloorForGoal?.(...args);
}



function setProtRangeUI(...args){
  return window.__LegacyCompatUI?.setProtRangeUI?.(...args);
}



function lockMacroControls(...args){
  return window.__LegacyCompatUI?.lockMacroControls?.(...args);
}



function forceCustomIfPresetEdited(...args){
  return window.__LegacyCompatUI?.forceCustomIfPresetEdited?.(...args);
}



function setRatioToMatchCap(...args){
  return window.__LegacyCompatUI?.setRatioToMatchCap?.(...args);
}


if (typeof window.lockCarbControls !== "function"){
  window.lockCarbControls = function(locked){
    ["carbGoal","carbStep","carbCapGPerKg"].forEach(id => { const el = $(id); if (el) el.disabled = !!locked; });
  };
}
if (typeof window.syncCarbGuardsFromUI !== "function"){
  window.syncCarbGuardsFromUI = function(){
    const goal = $("carbGoal")?.value || "off";
    updateCarbSteps(goal, false);
    updateCarbGuardExplain();
  };
}


function resetCarbGoalDerivedUI(...args){
  return window.__LegacyCompatUI?.resetCarbGoalDerivedUI?.(...args);
}



function updateFatFloorUI(...args){
  return window.__LegacyCompatUI?.updateFatFloorUI?.(...args);
}



function updateCarbGuardExplain(...args){
  return window.__LegacyCompatUI?.updateCarbGuardExplain?.(...args);
}


/* --- Listes objectifs glucides : compatibilité régime -> objectifs --- */
const DIET_CARB_COMPAT = {
  cut_standard:   { strict:"warn", sport:"ok",  recomp:"ok",  maintain:"warn", volume:"no",   carbload:"no" },
  cut_aggressive: { strict:"ok",   sport:"warn",recomp:"no",  maintain:"no",   volume:"no",   carbload:"no" },
  recomp:         { strict:"warn", sport:"ok",  recomp:"ok",  maintain:"warn", volume:"no",   carbload:"no" },
  maintain:       { strict:"no",   sport:"warn",recomp:"ok",  maintain:"ok",   volume:"warn", carbload:"no" },
  endurance:      { strict:"no",   sport:"warn",recomp:"warn",maintain:"ok",   volume:"ok",   carbload:"warn" },
  custom:         { strict:"ok",   sport:"ok",  recomp:"ok",  maintain:"ok",   volume:"ok",   carbload:"ok" }
};

const CARB_GOAL_DEFAULT_BY_DIET = {
  cut_standard: "sport",
  cut_aggressive: "strict",
  recomp: "sport",
  maintain: "maintain",
  endurance: "volume",
  custom: "sport"
};


function fmtCompatTag(...args){
  return window.__LegacyCompatUI?.fmtCompatTag?.(...args);
}


function setSelectOptions(...args){
  return window.__LegacyCompatUI?.setSelectOptions?.(...args);
}


function getDietCompatMap(...args){
  return window.__LegacyCompatUI?.getDietCompatMap?.(...args);
}


function getCarbGoal(...args){
  return window.__LegacyCompatUI?.getCarbGoal?.(...args);
}



function updateCarbGoalOptions(...args){
  return window.__LegacyCompatUI?.updateCarbGoalOptions?.(...args);
}



function updateCarbSteps(...args){
  return window.__LegacyCompatUI?.updateCarbSteps?.(...args);
}



function initCarbGuardsUI(...args){
  return window.__LegacyCompatUI?.initCarbGuardsUI?.(...args);
}


/* --- low-carb UI --- */

function setLowCarbRangeUI(...args){
  return window.__LegacyCompatUI?.setLowCarbRangeUI?.(...args);
}



function populateLowCarbSteps(...args){
  return window.__LegacyCompatUI?.populateLowCarbSteps?.(...args);
}



function syncCarbModeUI(...args){
  return window.__LegacyCompatUI?.syncCarbModeUI?.(...args);
}



function makeDietBadge(...args){
  return window.__LegacyCompatUI?.makeDietBadge?.(...args);
}



function applyDietPreset(...args){
  return window.__LegacyCompatUI?.applyDietPreset?.(...args);
}


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

          carbGoal: $("carbGoal")?.value || "sport",
          carbCapGPerKg: toNum($("carbCapGPerKg")?.value),
          ratioCP: toNum($("ratioCP")?.value),

          useMode: $("useMode")?.value || "simple",


          diabEnabled: !!$("diabEnabled")?.checked,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(SETTINGS_KEY(), JSON.stringify(payload));
      }

      function loadProfileSettings() {
        let payload = null;
        try { payload = JSON.parse(localStorage.getItem(SETTINGS_KEY()) || "null"); } catch {}
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

        if (has("carbGoal") && $("carbGoal")) $("carbGoal").value = payload.carbGoal || $("carbGoal").value;
        if (has("carbCapGPerKg") && $("carbCapGPerKg")) $("carbCapGPerKg").value = payload.carbCapGPerKg ?? 0;
        if (has("ratioCP") && $("ratioCP")) $("ratioCP").value = payload.ratioCP ?? 0;
        normalizeCarbCapIntegerStep?.();
        ensureCarbGoalDefaultOption?.();
        if ($("carbGoal")) { updateCarbGoalOptions(false, true); ensureCarbGoalDefaultOption?.(); updateCarbSteps(); lockCarbControls(); syncCarbGuardsFromUI(); }
        if ($("dietMode")) setDietNote($("dietMode").value, false);
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



      /* Phase 6.28: legacy storage days extracted to ./js/legacy/legacy-storage-days.js */

      function normalizeMeal(m) {
        return {
          id: m.id || (crypto.randomUUID?.() ?? (`m_${Date.now()}_${Math.random().toString(16).slice(2)}`)),
          name: String(m.name ?? "").trim(),
          k: Math.max(0, toNum(m.k)),
          p: Math.max(0, toNum(m.p)),
          c: Math.max(0, toNum(m.c)),
          f: Math.max(0, toNum(m.f)),
          createdAt: m.createdAt || new Date().toISOString()
        };
      }

      function getMealsForDay(dateStr) {
        const d = getDay(dateStr);
        return Array.isArray(d?.meals) ? d.meals.map(normalizeMeal) : [];
      }

      function setMealsForDay(dateStr, meals) {
        const existing = getDay(dateStr) || { date: dateStr };
        const dayObj = { ...existing, date: dateStr, meals: meals.map(normalizeMeal), updatedAt: new Date().toISOString() };
        upsertDay(dayObj);
      }

      function mealsTotals(meals) {
        return meals.reduce((acc, m) => {
          acc.k += toNum(m.k); acc.p += toNum(m.p); acc.c += toNum(m.c); acc.f += toNum(m.f);
          return acc;
        }, {k:0,p:0,c:0,f:0});
      }

      function syncEatenFromMeals(dateStr) {
        const meals = getMealsForDay(dateStr);
        const t = mealsTotals(meals);
        if ($("eatenKcal")) $("eatenKcal").value = round(t.k, 0);
        if ($("eatenP")) $("eatenP").value = round(t.p, 1);
        if ($("eatenC")) $("eatenC").value = round(t.c, 1);
        if ($("eatenF")) $("eatenF").value = round(t.f, 1);
        return t;
      }

      function renderMealsTable(dateStr) {
        const wrap = $("mealsTableWrap");
        if (!wrap) return;

        const meals = getMealsForDay(dateStr).sort((a,b) => (a.createdAt||"").localeCompare(b.createdAt||""));

        if (meals.length === 0) {

  wrap.innerHTML = `
    <div class="meals-wrap">
       <table class="wide-table">
        <thead>
          <tr>
            <th class="text-left">Repas</th>
            <th>kcal</th>
            <th>P</th>
            <th>G</th>
            <th>L</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="6" class="muted">Aucun repas ajouté pour l’instant.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  syncEatenFromMeals(dateStr);
  return;
}


        wrap.innerHTML = `
          <div class="meals-wrap">
            <table class="wide-table">
              <thead>
                <tr><th class="text-left">Repas</th><th>kcal</th><th>P</th><th>G</th><th>L</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${meals.map(m => `
                  <tr data-mealid="${m.id}">
                    <td class="td-left"><input data-field="name" value="${escapeHtml(m.name)}" /></td>
                    <td><input data-field="k" type="number" min="0" step="1" value="${round(m.k,0)}" /></td>
                    <td><input data-field="p" type="number" min="0" step="0.1" value="${round(m.p,1)}" /></td>
                    <td><input data-field="c" type="number" min="0" step="0.1" value="${round(m.c,1)}" /></td>
                    <td><input data-field="f" type="number" min="0" step="0.1" value="${round(m.f,1)}" /></td>
                    <td><button class="btn-mini btn-danger" data-action="del" type="button">🗑️</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;

        wrap.querySelectorAll("input").forEach(inp => {
          inp.addEventListener("change", () => {
            const tr = inp.closest("tr");
            const id = tr.getAttribute("data-mealid");
            const field = inp.getAttribute("data-field");
            const mealsNow = getMealsForDay(dateStr);
            const idx = mealsNow.findIndex(x => x.id === id);
            if (idx < 0) return;

            const updated = { ...mealsNow[idx] };
            if (field === "name") updated.name = inp.value;
            else updated[field] = toNum(inp.value);

            mealsNow[idx] = normalizeMeal(updated);
            setMealsForDay(dateStr, mealsNow);
            syncEatenFromMeals(dateStr);
            notifyDiabProfileChanged();
        compute(true);
          });
        });

        wrap.querySelectorAll("button[data-action='del']").forEach(btn => {
          btn.addEventListener("click", () => {
            const tr = btn.closest("tr");
            const id = tr.getAttribute("data-mealid");
            const mealsNow = getMealsForDay(dateStr).filter(x => x.id !== id);
            setMealsForDay(dateStr, mealsNow);
            renderMealsTable(dateStr);
            compute(true);
          });
        });

        syncEatenFromMeals(dateStr);
      }

      function addMealFromInputs() {
        const dateStr = getSelectedDate();
        $("dayDate").value = dateStr;

        const name = $("mealName").value.trim() || "Repas";
        const m = normalizeMeal({
          name,
          k: toNum($("mealK").value),
          p: toNum($("mealP").value),
          c: toNum($("mealC").value),
          f: toNum($("mealF").value),
          createdAt: new Date().toISOString()
        });

        const mealsNow = getMealsForDay(dateStr);
        mealsNow.push(m);
        setMealsForDay(dateStr, mealsNow);

        $("mealName").value = "";
        $("mealK").value = 0; $("mealP").value = 0; $("mealC").value = 0; $("mealF").value = 0;

        renderMealsTable(dateStr);
        compute(true);
      }

      function clearMealsForDay() {
        const dateStr = getSelectedDate();
        if (!confirm(`Vider tous les repas de la journée ${dateStr} ?`)) return;
        $("dayDate").value = dateStr;
        setMealsForDay(dateStr, []);
        renderMealsTable(dateStr);
        compute(true);
      }

      function applyPer100ToMeal() {
        const k100 = toNum($("qKcal100")?.value);
        const g    = toNum($("qWeight")?.value);
        const p100 = toNum($("qP100")?.value);
        const c100 = toNum($("qC100")?.value);
        const f100 = toNum($("qF100")?.value);

        if (k100 > 0 && g > 0) $("mealK").value = round(k100 * g / 100, 0);
        if (p100 > 0 && g > 0) $("mealP").value = round(p100 * g / 100, 1);
        if (c100 > 0 && g > 0) $("mealC").value = round(c100 * g / 100, 1);
        if (f100 > 0 && g > 0) $("mealF").value = round(f100 * g / 100, 1);

          // ✅ UX: reset automatique des champs “option rapide 100g”
  ["qKcal100","qWeight","qP100","qC100","qF100"].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });
      }

/* =====================================================================
   7) Compo corporelle + tendance 7j + historique
   UI piloté: #morningWeight #fatPct #musclePct #boneKg
             #daysHistory + boutons export/import/clear
   ===================================================================== */

      function bmiCategory(bmi) {
        if (!Number.isFinite(bmi) || bmi <= 0) return "-";
        if (bmi < 18.5) return "Insuffisance pondérale";
        if (bmi < 25)   return "Corpulence normale";
        if (bmi < 30)   return "Surpoids";
        return "Obésité";
      }

      function computeWeightStats(dateStr, daysArr) {
        const sorted = [...daysArr].sort((a,b)=>a.date.localeCompare(b.date));
        const eligible = sorted.filter(d => d.date <= dateStr && toNum(d.morningWeight) > 0);
        const last7 = eligible.slice(-7);

        if (last7.length === 0) return { avg7:null, wkVar:null };

        const avg7 = last7.reduce((s,d)=>s + toNum(d.morningWeight), 0) / last7.length;

        const prevPool = eligible.slice(0, Math.max(0, eligible.length - last7.length));
        const prev7 = prevPool.slice(-7);
        let wkVar = null;
        if (prev7.length >= 3) {
          const prevAvg = prev7.reduce((s,d)=>s + toNum(d.morningWeight), 0) / prev7.length;
          wkVar = ((avg7 - prevAvg) / prevAvg) * 100;
        }
        return { avg7, wkVar };
      }

      function safeNum(v) {
        const n = toNum(v);
        return Number.isFinite(n) ? n : 0;
      }

      function getDayEatenKcal(dayObj) {
        if (dayObj?.eaten && Number.isFinite(toNum(dayObj.eaten.k))) return safeNum(dayObj.eaten.k);
        if (Array.isArray(dayObj?.meals)) {
          return dayObj.meals.reduce((s,m)=> s + safeNum(m?.k), 0);
        }
        return 0;
      }

      function compute7dEnergyTrend(dateStr, daysArr) {
        const sorted = [...daysArr].sort((a,b)=>a.date.localeCompare(b.date));
        const eligible = sorted.filter(d => d.date <= dateStr);
        const last7 = eligible.slice(-7);

        if (last7.length === 0) {
          return {
            n: 0,
            spendAvg: null,
            eatAvg: null,
            defAvg: null,
            projWkKg: null,
            quality: { days:0, spendDays:0, eatDays:0, weightDays:0 },
            theoWkKg: null,
            realWkKg: null
          };
        }

        let spendSum = 0, spendDays = 0;
        let eatSum = 0, eatDays = 0;
        let weightDays = 0;

        for (const d of last7) {
          const spend = safeNum(d?.montreAdjusted);
          if (spend > 0) { spendSum += spend; spendDays++; }

          const eatenK = getDayEatenKcal(d);
          const hasMeals = Array.isArray(d?.meals) && d.meals.length > 0;
          if (hasMeals || eatenK > 0) { eatSum += eatenK; eatDays++; }

          if (safeNum(d?.morningWeight) > 0) weightDays++;
        }

        const spendAvg = spendDays ? (spendSum / spendDays) : null;
        const eatAvg   = eatDays ? (eatSum / eatDays) : null;
        const defAvg   = (spendAvg != null && eatAvg != null) ? (spendAvg - eatAvg) : null;

        const projWkKg = (defAvg != null) ? ((defAvg * 7) / 7700) : null;

        const eligibleWithWeight = sorted.filter(d => d.date <= dateStr && safeNum(d?.morningWeight) > 0);
        const last14w = eligibleWithWeight.slice(-14);

        let realWkKg = null;
        if (last14w.length >= 10) {
          const second7 = last14w.slice(-7);
          const first7  = last14w.slice(0, last14w.length - 7).slice(-7);

          const avgA = second7.reduce((s,d)=> s + safeNum(d.morningWeight), 0) / second7.length;
          const avgB = first7.reduce((s,d)=> s + safeNum(d.morningWeight), 0) / first7.length;

          realWkKg = (avgA - avgB);
        }

        return {
          n: last7.length,
          spendAvg, eatAvg, defAvg,
          projWkKg,
          quality: { days:last7.length, spendDays, eatDays, weightDays },
          theoWkKg: projWkKg,
          realWkKg
        };
      }

      function render7dEnergyTrendUI(dateStr) {
        const elSpend = $("avg7SpendKcal");
        const elEat   = $("avg7EatKcal");
        const elDef   = $("avg7DefKcal");
        const elProj  = $("projWkKg");
        const elCmp   = $("deltaRealVsTheo");
        const elQual  = $("dataQuality7");
        const elNote  = $("trend7Note");

        if (!elSpend || !elEat || !elDef || !elProj || !elCmp || !elQual || !elNote) return;

        const daysArr = loadDays();
        const t = compute7dEnergyTrend(dateStr, daysArr);

        if (t.n === 0) {
          elSpend.value = "-";
          elEat.value   = "-";
          elDef.value   = "-";
          elProj.value  = "-";
          elCmp.value   = "-";
          elQual.value  = "-";
          elNote.textContent = "Aucune donnée exploitable pour la tendance 7j.";
          return;
        }

        elSpend.value = (t.spendAvg == null) ? "-" : Math.round(t.spendAvg);
        elEat.value   = (t.eatAvg == null)   ? "-" : Math.round(t.eatAvg);
        elDef.value   = (t.defAvg == null)   ? "-" : Math.round(t.defAvg);

        elProj.value  = (t.projWkKg == null) ? "-" : (round(t.projWkKg, 2) + " kg/sem");

        if (t.realWkKg == null || t.theoWkKg == null) {
          elCmp.value = "-";
        } else {
          const real = t.realWkKg;
          const theo = t.theoWkKg;
          const gap  = real - theo;
          elCmp.value = `réel ${round(real,2)} vs théorique ${round(theo,2)} (écart ${round(gap,2)})`;
        }

        elQual.value = `${t.quality.days}j | dépense:${t.quality.spendDays}/7 | repas:${t.quality.eatDays}/7 | poids:${t.quality.weightDays}/7`;

       // Texte d’introduction
        let intro = "À lire sur plusieurs jours. Les variations quotidiennes sont normales.";

       // Liste des alertes
        let warnings = [];

        if (t.quality.eatDays < 5)
          warnings.push("⚠️ Peu de jours avec repas enregistrés → tendance calories moins fiable.");

        if (t.quality.spendDays < 5)
          warnings.push("⚠️ Peu de jours avec dépense corrigée → tendance dépense moins fiable.");

        if (t.quality.weightDays < 4)
          warnings.push("⚠️ Peu de mesures de poids → comparaison réel / théorique fragile.");

       // Injection HTML structurée
        elNote.innerHTML = `
         <p>${intro}</p>
           ${warnings.length ? `
            <ul class="ml11-mt04-p0">
             ${warnings.map(w => `<li>${w}</li>`).join("")}
            </ul>
         ` : ``}
        `;
      }

      function updateBodyCompUI(dateStr) {
        const d = getDay(dateStr);

        const mw = $("morningWeight");
        if (mw) mw.value = (toNum(d?.morningWeight) > 0) ? d.morningWeight : "";

        const fp = $("fatPct"); const mp = $("musclePct"); const bk = $("boneKg");
        if (fp) fp.value = (toNum(d?.fatPct) > 0) ? d.fatPct : "";
        if (mp) mp.value = (toNum(d?.musclePct) > 0) ? d.musclePct : "";
        if (bk) bk.value = (toNum(d?.boneKg) > 0) ? d.boneKg : "";

        const daysArr = loadDays();
        const { avg7, wkVar } = computeWeightStats(dateStr, daysArr);

        const a7 = $("avg7Weight"); const wv = $("wkVarPct");
        if (a7) a7.value = (avg7==null) ? "-" : round(avg7, 2);
        if (wv) wv.value = (wkVar==null) ? "-" : (round(wkVar, 2) + " %");

        const hCm = toNum($("height").value);
        const hM = hCm > 0 ? hCm / 100 : 0;
        const wMorning = toNum($("morningWeight")?.value);
        const wProfile = toNum($("weight").value);
        const wUsed = (wMorning > 0) ? wMorning : wProfile;

        let bmi = null;
        if (hM > 0 && wUsed > 0) bmi = wUsed / (hM * hM);

        const bwu = $("bmiWeightUsed"); const bv = $("bmiVal"); const bc = $("bmiCat");
        if (bwu) bwu.value = (wUsed > 0) ? round(wUsed,1) + " kg" : "-";
        if (bv) bv.value = (bmi==null) ? "-" : round(bmi, 1);
        if (bc) bc.value = (bmi==null) ? "-" : bmiCategory(bmi);

        render7dEnergyTrendUI(dateStr);
      }

      function saveBodyCompForDay(dateStr) {
        const existing = getDay(dateStr) || { date: dateStr };
        const dayObj = {
          ...existing,
          date: dateStr,
          morningWeight: (toNum($("morningWeight")?.value) > 0) ? toNum($("morningWeight").value) : null,
          fatPct: (toNum($("fatPct")?.value) > 0) ? toNum($("fatPct").value) : null,
          musclePct: (toNum($("musclePct")?.value) > 0) ? toNum($("musclePct").value) : null,
          boneKg: (toNum($("boneKg")?.value) > 0) ? toNum($("boneKg").value) : null,
          updatedAt: new Date().toISOString()
        };
        upsertDay(dayObj);
      }

      
// --- Date helpers (local, avoids UTC month/day shifts) ---
function ymLocal(dt){
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,"0");
  return `${y}-${m}`;
}
function ymdLocal(dt){
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,"0");
  const d = String(dt.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function renderDaysHistory() {
  // V2 : calendrier mensuel + panneau latéral.
  const cal = $("histCalendar");
  const monthInp = $("histMonth");
  const side = $("histSideSummary");
  if (!cal || !monthInp || !side) {
    const box = $("daysHistory");
    if (box) box.innerHTML = "<p class='muted'>Historique : UI calendrier non disponible.</p>";
    return;
  }

  historyV2_initOnce();

  // mois affiché = mois de la date sélectionnée (ou today)
  const dateStr = getSelectedDate();
  const d = (dateStr && dateStr.length === 10) ? new Date(dateStr + "T00:00:00") : new Date();
  const ym = ymLocal(d); // YYYY-MM
  if (!monthInp.value) monthInp.value = ym;

  historyV2_render(monthInp.value, dateStr);
}

let __historyV2_inited = false;

function historyV2_initOnce(){
  if (__historyV2_inited) return;
  __historyV2_inited = true;

  // Nav mois
  $("histPrevMonth")?.addEventListener("click", () => {
    window.__Phase6.Contracts.require('HistoryEntryPoints', 'changeMonthBy')(-1);
  });
  $("histNextMonth")?.addEventListener("click", () => {
    window.__Phase6.Contracts.require('HistoryEntryPoints', 'changeMonthBy')(1);
  });
  $("histMonth")?.addEventListener("change", () => {
    window.__Phase6.Contracts.require('HistoryEntryPoints', 'setMonth')($("histMonth")?.value);
  });

  window.addEventListener("resize", () => historyV2_syncSidebarHeight());

  // Clic jour calendrier
  $("histCalendar")?.addEventListener("click", (e) => {
    const btn = e.target?.closest?.(".calDay");
    if (!btn) return;
    if (btn.disabled) return;
    const dateStr = btn.getAttribute("data-date");
    if (!dateStr) return;

    window.__Phase6.Contracts.require('HistoryEntryPoints', 'selectDate')(dateStr);
    return;
  });



}

function historyV2_render(monthYYYYMM, selectedDateStr){
  historyV2_renderCalendar(monthYYYYMM, selectedDateStr);
  historyV2_renderSidebar(selectedDateStr);
  historyV2_syncSidebarHeight();
}


function historyV2_syncSidebarHeight(){
  const side = $("histSidebar");
  const calWrap = document.querySelector(".histCalendarWrap");
  if (!side || !calWrap) return;

  // En colonne unique (mobile), on laisse le flux normal (pas de hauteur forcée)
  if (window.matchMedia && window.matchMedia("(max-width: 880px)").matches){
    side.style.height = "";
    side.style.maxHeight = "";
    side.style.overflow = "";
    return;
  }

  requestAnimationFrame(() => {
    const h = Math.round(calWrap.getBoundingClientRect().height);
    if (!h || h < 120) return;
    side.style.height = h + "px";
    side.style.maxHeight = h + "px";
    side.style.overflow = "auto";
  });
}

function historyV2_renderCalendar(monthYYYYMM, selectedDateStr){
  const cal = $("histCalendar");
  if (!cal) return;

  const daysByDate = new Map(loadDays().map(d => [d.date, d]));
  const monthStart = new Date(monthYYYYMM + "-01T00:00:00");
  const y = monthStart.getFullYear();
  const m = monthStart.getMonth();

  // Lundi = 0..6
  const first = new Date(y, m, 1);
  const firstDow = (first.getDay() + 6) % 7; // JS: Sun=0 → Mon=0
  const gridStart = new Date(y, m, 1 - firstDow);

  const cells = [];
  for (let i=0;i<42;i++){
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const dateStr = ymdLocal(d);
    const inMonth = (d.getMonth() === m);
    const dayObj = inMonth ? daysByDate.get(dateStr) : null;

    const hasArchive = !!dayObj;
    const hasData = historyV2_hasMeaningfulData(dayObj);
    const isFilled = hasData;  // alias UX
const selClass = (selectedDateStr === dateStr) ? " is-selected" : "";
    const outClass = inMonth ? "" : " is-out";

    // Fond léger : uniquement pour les jours passés (date < date sélectionnée)
    const refStr = (selectedDateStr && selectedDateStr.length===10) ? selectedDateStr : ymdLocal(new Date());
    const ref = new Date(refStr + "T00:00:00");
    const cur = new Date(dateStr + "T00:00:00");
    const isPast = inMonth && (cur.getTime() < ref.getTime());
    const pastClass = isPast ? " is-past" : "";

    cells.push(`
      <button type="button" class="calDay${outClass}${pastClass}${selClass}${hasArchive?" is-archived":" is-unarchived"}${isFilled?" is-filled":" is-empty"}" data-date="${dateStr}" data-has="${hasData?1:0}" data-arch="${hasArchive?1:0}">
        <div class="calNum">${d.getDate()}</div>
              </button>
    `);
  }

  cal.innerHTML = cells.join("");
}


function historyV2_mealTotals(dayObj){
  const meals = Array.isArray(dayObj?.meals) ? dayObj.meals : [];
  return meals.reduce((acc, m) => {
    acc.k += Math.max(0, toNum(m.k));
    acc.p += Math.max(0, toNum(m.p));
    acc.c += Math.max(0, toNum(m.c));
    acc.f += Math.max(0, toNum(m.f));
    return acc;
  }, { k:0, p:0, c:0, f:0 });
}

function historyV2_hasMeaningfulData(dayObj){
  if (!dayObj) return false;

  // Repas / calories (significatif = >0 kcal)
  const tot = historyV2_mealTotals(dayObj);
  if (toNum(tot.k) > 0 || toNum(tot.p) > 0 || toNum(tot.c) > 0 || toNum(tot.f) > 0) return true;

  // Sport (significatif = minutes/kcal >0 OU au moins 1 séance sauvegardée)
  const sport = dayObj.sport || {};
  const ss = Array.isArray(dayObj.sportSessions) ? dayObj.sportSessions : [];
  if (ss.length) return true;
  if (toNum(sport.minutes) > 0 || toNum(sport.kcal) > 0) return true;

  // Sommeil
  const sleep = dayObj.sleep || {};
  if (toNum(sleep.minutes) > 0 || toNum(sleep.hours) > 0 || toNum(sleep.score) > 0 || String(sleep.bed||"").trim() || String(sleep.wake||"").trim()) return true;

  // Diabète (uniquement si option activée)
  try{
    const diabOn = !!$("diabEnabled")?.checked;
    if (diabOn){
      const gl = Array.isArray(dayObj.diabGlucose) ? dayObj.diabGlucose : [];
      const hasMeta = !!(dayObj.diabMeta && Object.keys(dayObj.diabMeta).length);
      const hasSettings = !!(dayObj.diabSettings && Object.keys(dayObj.diabSettings).length);
      if (gl.length || hasMeta || hasSettings) return true;
    }
  }catch(e){}

  return false;
}

function historyV2_renderSidebar(dateStr){
  const side = $("histSideSummary");
  if (!side) return;

  const d = getDay(dateStr);
  if (!d){
    side.innerHTML = `
      <div class="sideCard">
        <h3>${escapeHtml(dateStr || "")}</h3>
        <div class="muted">Aucune donnée enregistrée pour cette date.</div>
      </div>
    `;
    if ($("diabHistDate")) $("diabHistDate").value = dateStr || "";
    return;
  }

  const tot = historyV2_mealTotals(d);
  const eatK = Math.round(tot.k);
  const spendK = Math.round(toNum(d.montreAdjusted ?? d.montreRaw ?? 0));
  const targetK = Math.round(toNum(d.targetKcal ?? 0));
  const delta = (targetK > 0 && eatK > 0) ? Math.round(eatK - targetK) : null;

  const diet = escapeHtml(dietLabel(d.dietMode));
  const mealsN = Array.isArray(d.meals) ? d.meals.length : 0;

  // Sport / sommeil (journal local)
  const s = d.sport || {};
  const sl = d.sleep || {};
  const sportMin = Math.round(toNum(s.minutes)||0);
  const sportK = Math.round(toNum(s.kcal)||0);

  // Détails séances (UX : afficher ici les séances sauvegardées, pas un simple "type")
  const __sessions = (typeof getSportSessionsForDay === "function") ? getSportSessionsForDay(dateStr) : (Array.isArray(d?.sportSessions) ? d.sportSessions : []);
  const sportDetails = (!__sessions || !__sessions.length)
    ? `<div class="muted" style="margin-top:.35rem">Aucune séance enregistrée.</div>`
    : `<div class="kpiSportList" style="margin-top:.45rem">` + __sessions.slice(0,4).map(ss => {
        const t = escapeHtml(String(ss.type||"").trim() || "Sport");
        const mn = Math.round(toNum(ss.minutes)||0);
        const kk = Math.round(toNum(ss.kcal)||0);
        return `<div class="kpiSportRow"><span class="kpiSportType">${t}</span><span class="kpiSportMeta">${mn} min · ${kk} kcal</span></div>`;
      }).join("") + (__sessions.length>4 ? `<div class="muted" style="margin-top:.25rem">+${__sessions.length-4} autre(s) séance(s)</div>` : ``) + `</div>`;

  const sleepH = (toNum(sl.hours)||0);
  const sleepScore = Math.round(toNum(sl.score)||0);

  // Diabète (option)
  const diabOn = !!$("diabEnabled")?.checked;
  let diabCard = "";
  try{
    if (diabOn){
      const glRaw = Array.isArray(d?.diabGlucose) ? d.diabGlucose : [];
      const gl = glRaw.map(diab_normalizeGlucose);
      const settings = diab_getSettings();
      const unit = $("diab_glucoseUnit")?.value || settings.glucoseUnit || "mgdl";

      const last = gl.length ? gl[gl.length-1] : null;
      const lastVal = last ? diab_displayGlucose(last.mgdl, unit) : "-";

      const hypo = gl.filter(x => (toNum(x.mgdl)||0) > 0 && (toNum(x.mgdl)||0) < 70).length;
      const hyper = gl.filter(x => (toNum(x.mgdl)||0) > 180).length;

      const carbs = Math.round(toNum(tot.c)||0);

      const hasMeta = !!(d?.diabMeta && Object.keys(d.diabMeta).length);
      const hasSettings = !!(d?.diabSettings && Object.keys(d.diabSettings).length);

      if (gl.length || hasMeta || hasSettings){
        diabCard = `
          <div class="sideCard diabCard">
            <div class="sideTitleRow">
              <h3 style="margin:0">Diabète</h3>
              <span class="pill diab"><span class="mini">${gl.length||0}G</span><span class="muted">mesures</span></span>
            </div>
            <div class="sideRow" style="margin-top:.35rem">
              <div class="sideBig">${lastVal} <span class="muted">${unit==="mmol"?"mmol/L":"mg/dL"}</span></div>
              <div class="muted">${carbs}g glucides</div>
              <div class="muted">hypo:${hypo||0}</div>
              <div class="muted">hyper:${hyper||0}</div>
            </div>
            <div class="muted" style="margin-top:.35rem">Détail dans l’onglet Diabète.</div>
          </div>
        `;
      }
    }
  }catch(e){}

  side.innerHTML = `
    <div class="sideCard" style="background: var(--warn); border-color: var(--warn-b);">
      <div class="sideTitleRow">
        <h3 style="margin:0">${escapeHtml(dateStr)}</h3>
        <span class="pill ${delta==null ? "warn" : (delta<=150 && delta>=-250 ? "ok":"bad")}">
          <span class="mini">${delta==null ? "—" : (delta>0?"+":"") + delta}</span>
          <span class="muted">vs cible</span>
        </span>
      </div>

      <div class="sideRow" style="margin-top:.35rem">
        <div class="sideBig">${eatK || "—"} <span class="muted">kcal</span></div>
        <div class="muted">${tot.p ? Math.round(tot.p) : 0}g P</div>
        <div class="muted">${tot.c ? Math.round(tot.c) : 0}g G</div>
        <div class="muted">${tot.f ? Math.round(tot.f) : 0}g L</div>
      </div>

      <div class="muted" style="margin-top:.35rem">
        Dépense ${spendK || "—"} · Cible ${targetK || "—"} · ${diet} · ${mealsN} repas
      </div>

      <div class="kpi" style="margin-top:.55rem">
        <span class="pill"><span class="mini">${Math.round(toNum(d.goalPct ?? 0))}%</span><span class="muted">objectif</span></span>
      </div>
    </div>

    ${diabCard}

    <div class="sideCard" style="background: rgba(32,96,78,.35); border-color: rgba(90,220,170,.22);">
      <div class="sideTitleRow">
        <h3 style="margin:0">Sport</h3>
        <span class="pill"><span class="mini">${fmtSportMinutes(sportMin||0)}</span><span class="muted">${sportK||0} kcal</span></span>
      </div>
      ${sportDetails}
    </div>

    <div class="sideCard" style="background: rgba(70,90,170,.22); border-color: rgba(140,160,255,.16);">
      <div class="sideTitleRow">
        <h3 style="margin:0">Sommeil</h3>
        <span class="pill"><span class="mini">${fmtHM(getSleepMinutesFromObj(d.sleep||{}))}</span><span class="muted">${sleepScore? (sleepScore+"/10") : "score —"}</span></span>
      </div>
      <div class="muted" style="margin-top:.35rem">
        Coucher ${escapeHtml(sl.bed||"—")} · Lever ${escapeHtml(sl.wake||"—")}
      </div>
    </div>
  `;

  if ($("diabHistDate")) $("diabHistDate").value = dateStr || "";
}

function loadDayIntoForm(dateStr) {
        const d = getDay(dateStr);
        if (!d) return;
        $("dayDate").value = d.date;

        if (d.watchBrand) $("watchBrand").value = d.watchBrand;
        applyBrandPreset($("watchBrand").value, false);

        if (d.montreRaw != null) $("montre").value = d.montreRaw;
        if (d.errPct != null && $("errPct")) $("errPct").value = d.errPct;
        if (d.errMode && $("errMode")) $("errMode").value = d.errMode;

        if (d.dietMode && $("dietMode")) $("dietMode").value = d.dietMode;

        if (d.goalPct != null && $("goalPct")) $("goalPct").value = d.goalPct;
        if (d.protPerKg != null && $("protPerKg")) $("protPerKg").value = d.protPerKg;
        if (d.fatPerKg != null && $("fatPerKg")) $("fatPerKg").value = d.fatPerKg;

        if ($("dietMode")) setDietNote($("dietMode").value, false);

        renderMealsTable(d.date);
        updateBodyCompUI(d.date);

loadSportSleepIntoUI(dateStr);
renderSportSleep7d(dateStr);

        compute(true);
      }

function getSportSleepForDay(dateStr){
  const d = getDay(dateStr) || { date: dateStr };
  const sport = d.sport || {};
  const sleep = d.sleep || {};
  return {
    sport: {
      minutes: Math.max(0, toNum(sport.minutes) || 0),
      kcal: Math.max(0, toNum(sport.kcal) || 0),
      type: String(sport.type || "")
    },
    sleep: {
      hours: Math.max(0, toNum(sleep.hours) || 0),
      score: Math.max(0, toNum(sleep.score) || 0),
      bed: String(sleep.bed || ""),
      wake: String(sleep.wake || "")
    }
  };
}

function loadSportSleepIntoUI(dateStr){
  const d = getDay(dateStr) || { date: dateStr };

  // Sport : on prépare l'ajout d'une séance (on ne charge pas l'agrégat dans les champs)
  if ($("sportMin")) $("sportMin").value = 0;
  if ($("sportHh")) $("sportHh").value = 0;
  if ($("sportMm")) $("sportMm").value = 0;
  if ($("sportKcal")) $("sportKcal").value = 0;
  if ($("sportType")) $("sportType").value = "";

  // Liste des séances déjà sauvegardées
  renderSportSessionsList(dateStr);

  // Sommeil : 1 nuit = 1 enregistrement (on charge l'existant)
  const sleep = d.sleep || {};
  {
  const _mins = getSleepMinutesFromObj(sleep);
  const _hm = minutesToHM(_mins);
  if ($("sleepHh")) $("sleepHh").value = String(_hm.h);
  if ($("sleepMm")) $("sleepMm").value = String(_hm.m);
  if ($("sleepH")) $("sleepH").value = Math.max(0, toNum(sleep.hours) || 0);
}
  if ($("sleepScore")) $("sleepScore").value = Math.max(0, toNum(sleep.score) || 0);
  if ($("sleepBed")) $("sleepBed").value = String(sleep.bed || "");
  if ($("sleepWake")) $("sleepWake").value = String(sleep.wake || "");

  // UI: cartes compactes (pas d'autosave visible)
  try{ renderSleepSummaryForDay(dateStr); }catch(e){}
  try{ sleepUI_setEditMode(false); }catch(e){}
  try{ sportUI_setEditor(false); }catch(e){}

  renderSportSleep7d(dateStr);
}

function showSavedPill(id){
  const el = $(id);
  if (!el) return;
  el.classList.remove("is-hidden");
  clearTimeout(el.__t);
  el.__t = setTimeout(() => {
    el.classList.add("is-hidden");
  }, 1400);
}

function sportUI_setEditor(on){
  const ed = $("sportEditor");
  if (!ed) return;
  ed.classList.toggle("is-hidden", !on);
  if (on){
    // focus first field
    setTimeout(()=>{ $("sportType")?.focus(); }, 30);
  }
}

function sleepUI_setEditMode(on){
  $("sleepEditor")?.classList.toggle("is-hidden", !on);
  $("sleepSummary")?.classList.toggle("is-hidden", on);
  // When opening, focus first field
  if (on) setTimeout(()=>{ $("sleepHh")?.focus(); }, 30);
}

function renderSleepSummaryForDay(dateStr){
  const d = getDay(dateStr) || { date: dateStr };
  const sl = d.sleep || {};
  const mins = getSleepMinutesFromObj(sl);
  const score = Math.max(0, toNum(sl.score) || 0);
  const bed = String(sl.bed || "").trim();
  const wake = String(sl.wake || "").trim();

  const dur = $("sleepSummaryDur");
  const sc = $("sleepSummaryScore");
  const rg = $("sleepSummaryRange");

  if (dur) dur.textContent = (mins > 0) ? fmtHM(mins) : "—";
  if (sc) sc.textContent = (score > 0) ? (score + " / 10") : "score —";
  if (rg) rg.textContent = (bed || wake) ? (`${bed || "—"} → ${wake || "—"}`) : "—";
}

function getSportSessionsForDay(dateStr){
  const d = getDay(dateStr) || { date: dateStr };
  const arr = Array.isArray(d.sportSessions) ? d.sportSessions : [];
  return arr
    .filter(x => x && (toNum(x.minutes)||0) > 0 || (toNum(x.kcal)||0) > 0 || String(x.type||"").trim())
    .map(x => ({
      id: String(x.id || ""),
      type: String(x.type || "").trim(),
      minutes: Math.max(0, toNum(x.minutes) || 0),
      kcal: Math.max(0, toNum(x.kcal) || 0),
      createdAt: String(x.createdAt || "")
    }));
}

function computeSportAggregateFromSessions(sessions){
  const mins = sessions.reduce((s,x)=>s + (toNum(x.minutes)||0), 0);
  const kc = sessions.reduce((s,x)=>s + (toNum(x.kcal)||0), 0);
  const types = sessions.map(x=>String(x.type||"").trim()).filter(Boolean);
  const type = types.length === 0 ? "" : (types.length === 1 ? types[0] : "Multi");
  return { minutes: Math.round(mins), kcal: Math.round(kc), type };
}

function renderSportSessionsList(dateStr){
  const box = $("sportSessionsList");
  if (!box) return;

  const sessions = getSportSessionsForDay(dateStr);

  if (!sessions.length){
    box.innerHTML = `<div class="muted">Aucune séance.</div>`;
    return;
  }

  // Indicateur visuel simple : % de charge (kcal) vs repère fixe
  const REF_KCAL = 700; // repère “séance costaud” (pas médical)
  const pct = (k) => clamp((Math.max(0,toNum(k)||0) / REF_KCAL) * 100, 0, 100);

  box.innerHTML = sessions.map(s => {
    const p = pct(s.kcal);
    return `
      <div class="sportSessionRow">
        <div class="left">
          <div class="title">${escapeHtml(s.type || "Sport")}</div>
          <div class="meta">${Math.round(s.minutes||0)} min · ${Math.round(s.kcal||0)} kcal</div>
        </div>
        <div class="right">
          <div class="loadBar" aria-hidden="true"><i style="width:${p.toFixed(0)}%"></i></div>
          <div class="loadPct">${p.toFixed(0)}%</div>
          <button type="button" class="btn-ghost btn-icon" title="Supprimer" data-sportdel="${escapeHtml(s.id)}">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

function clearSportInputs(){
  if ($("sportMin")) $("sportMin").value = 0;
  if ($("sportKcal")) $("sportKcal").value = 0;
  if ($("sportType")) $("sportType").value = "";
}

function addSportSessionFromInputs(dateStr){
  const minutes = Math.max(0, toNum($("sportMin")?.value) || 0);
  const kcal = Math.max(0, toNum($("sportKcal")?.value) || 0);
  const type = String($("sportType")?.value || "").trim();

  // aucune donnée => pas de sauvegarde
  if (minutes <= 0 && kcal <= 0 && !type) return;

  const existing = getDay(dateStr) || { date: dateStr };
  const sessions = Array.isArray(existing.sportSessions) ? existing.sportSessions.slice() : [];

  const id = "s_" + Math.random().toString(36).slice(2,10) + "_" + Date.now().toString(36);
  sessions.push({ id, type, minutes, kcal, createdAt: new Date().toISOString() });

  const agg = computeSportAggregateFromSessions(sessions);

  const dayObj = {
    ...existing,
    date: dateStr,
    sportSessions: sessions,
    sport: agg, // agrégat compat (KPIs, calendrier)
    updatedAt: new Date().toISOString()
  };

  upsertDay(dayObj);

  // UI
  renderSportSessionsList(dateStr);
  renderSportSleep7d(dateStr);

  // rafraîchir calendrier + panneau (si présent)
  try{ phase6CompatRenderHistory(dateStr); }catch(e){}
  clearSportInputs();
}

function deleteSportSession(dateStr, sessionId){
  const existing = getDay(dateStr);
  if (!existing) return;

  const sessions = Array.isArray(existing.sportSessions) ? existing.sportSessions.slice() : [];
  const next = sessions.filter(s => String(s.id||"") !== String(sessionId||""));
  const agg = computeSportAggregateFromSessions(next);

  const dayObj = {
    ...existing,
    date: dateStr,
    sportSessions: next,
    sport: agg,
    updatedAt: new Date().toISOString()
  };
  upsertDay(dayObj);

  renderSportSessionsList(dateStr);
  renderSportSleep7d(dateStr);
  try{ phase6CompatRenderHistory(dateStr); }catch(e){}
}

function saveSleepForDay(dateStr){
  const existing = getDay(dateStr) || { date: dateStr };
  const dayObj = {
    ...existing,
    date: dateStr,
    sleep: {
      minutes: hmToMinutes($("sleepHh")?.value, $("sleepMm")?.value),
      hours: Math.max(0, toNum($("sleepH")?.value) || 0), // compat
      score: Math.max(0, toNum($("sleepScore")?.value) || 0),
      bed: String($("sleepBed")?.value || ""),
      wake: String($("sleepWake")?.value || "")
    },
    updatedAt: new Date().toISOString()
  };
  upsertDay(dayObj);
  renderSportSleep7d(dateStr);
  try{ phase6CompatRenderHistory(dateStr); }catch(e){}
}

// Compat : ancien nom (utilisé par certains écouteurs)
function saveSportSleepForDay(dateStr){
  saveSleepForDay(dateStr);
}

function getLastNDays(dateStr, n=7){
  // jours <= dateStr, triés asc (simple)
  const days = loadDays().filter(d => d?.date && d.date <= dateStr).sort((a,b)=>a.date.localeCompare(b.date));
  return days.slice(-n);
}

function computeSportSleep7d(dateStr){
  const arr = getLastNDays(dateStr, 7);

  let sportMin = 0, sportK = 0, sportDays = 0;
  let sleepMin = 0, sleepDays = 0;
  let intenseDays = 0, shortSleepDays = 0;

  arr.forEach(d=>{
    const s = d.sport || {};
    const sl = d.sleep || {};

    const m = Math.max(0, toNum(s.minutes) || 0);
    const k = Math.max(0, toNum(s.kcal) || 0);
    if (m > 0 || k > 0) sportDays++;
    sportMin += m; sportK += k;

    const sm = Math.max(0, getSleepMinutesFromObj(sl) || 0);
    if (sm > 0) sleepDays++;
    sleepMin += sm;

    if (k >= 700 || m >= 90) intenseDays++;
    if (sm > 0 && sm < 360) shortSleepDays++; // < 6h
  });

  return {
    n: arr.length,
    sportMin, sportK, sportDays,
    sleepMin, sleepDays,
    intenseDays, shortSleepDays,
    avgSportMin: sportDays ? (sportMin / sportDays) : 0,
    avgSportK: sportDays ? (sportK / sportDays) : 0,
    avgSleepMin: sleepDays ? (sleepMin / sleepDays) : 0
  };
}

function renderSportSleep7d(dateStr){
  const box = $("sportSleep7d");
  if (!box) return;

  const s = computeSportSleep7d(dateStr);

  const flags = [];
  if (s.intenseDays >= 3) flags.push("⚑ 3+ jours intenses");
  if (s.shortSleepDays >= 2) flags.push("⚑ 2+ nuits courtes");
  if (s.intenseDays >= 3 && s.shortSleepDays >= 2) flags.push("⚑ combo charge + sommeil court");

  box.innerHTML = `
    <div class="card" style="border:1px dashed #ddd">
      <b>Synthèse 7 jours</b>
      <div class="muted mt-025">
        Sport: ${fmtSportMinutes(Math.round(s.sportMin))} • ${Math.round(s.sportK)} kcal (sur ${s.sportDays} j)<br/>
        Sommeil: ${s.sleepDays ? fmtHM(Math.round(s.avgSleepMin)) : "—"} de moyenne (sur ${s.sleepDays} j)
        ${flags.length ? "<br/><br/>" + flags.join(" • ") : ""}
      </div>
    </div>
  `;
}


/* =====================================================================
   8) Viz calories (panneau pédagogique)
   UI piloté: #calFlowCard, #barP/#barC/#barF, #flow_* champs
   ===================================================================== */
      function updateCalorieFlowViz(ctx){
        const card = $("calFlowCard");
        if (!card) return;

        const {
          targetKcal=0,
          montreAdjusted=0,
          goalPct=0,
          w=0,

          // macros finaux
          targetP=0, targetC=0, targetF=0,

          // valeurs de base (avant redistribution)
          protPerKg=0,
          fatPerKgEff=0,
          targetFbase=0,      // lipides "plancher" en g
          targetCraw=0,       // glucides "théoriques" (kcal restantes) en g

          // carb-guard
          carbGuardEnabled=false,
          carbCapG=null,      // cap final (g/j) si actif, sinon null
          kcalRemaining=0,    // kcal déplacées vers les lipides (si cap)

          // low-carb
          lowCarbEnabled=false,
          lowCarbKg=0,
          lowCarbLevel="",
          lowCarbImpossible=false
        } = (ctx || {});

        const tK = Math.max(0, targetKcal);
        const spend = Math.max(0, montreAdjusted);

        const pG = Math.max(0, targetP);
        const cG = Math.max(0, targetC);
        const fG = Math.max(0, targetF);

        const pK = pG * 4;
        const cK = cG * 4;
        const fK = fG * 9;

        const pct = (k) => (tK > 0 ? clamp((k / tK) * 100, 0, 100) : 0);
        const setBar = (id, k) => {
          const el = $(id);
          if (!el) return;
          el.style.width = pct(k).toFixed(1) + "%";
        };
        const setTxt = (id, v) => { const el=$(id); if(el) el.textContent = v; };

        // Delta cible - dépense (pédagogie : déficit/surplus vs dépense corrigée)
        const delta = tK - spend;
        const deltaPill = $("flow_deltaKcal");
        if (deltaPill){
          const cls = delta < -50 ? "warn" : (Math.abs(delta) <= 50 ? "ok" : "");
          deltaPill.classList.remove("warn","ok");
          if (cls) deltaPill.classList.add(cls);
          const sign = delta > 0 ? "+" : "";
          deltaPill.textContent = `${sign}${round(delta,0)} kcal`;
        }

        // Remplissage valeurs principales
        setTxt("flow_targetKcal", round(tK,0));
        setTxt("flow_spendKcal", round(spend,0));

        setTxt("flow_pKcal", `${round(pK,0)} kcal`);
        setTxt("flow_cKcal", `${round(cK,0)} kcal`);
        setTxt("flow_fKcal", `${round(fK,0)} kcal`);

        setBar("barP", pK);
        setBar("barC", cK);
        setBar("barF", fK);

        setTxt("flow_pG", round(pG,1));
        setTxt("flow_cG", round(cG,1));
        setTxt("flow_fG", round(fG,1));

        // Etat / explication : cap glucides ou low-carb
        const capState = $("flow_capState");
        const capActive = (!!carbGuardEnabled && carbCapG != null && Number.isFinite(carbCapG) && carbCapG > 0);

        if (capState){
          capState.classList.remove("warn","ok");

          if (lowCarbEnabled){
            const lvl = (lowCarbLevel === "strict") ? "strict" : (lowCarbLevel === "moderate" ? "modéré" : "");
            capState.textContent = `Mode low-carb : ${lvl} (≈ ${round(lowCarbKg,2)} g/kg/j)`;
            capState.classList.add(lowCarbImpossible ? "warn" : "ok");
          } else if (!capActive){
            capState.textContent = "Plafond glucides : OFF";
          } else {
            const atCap = (cG >= carbCapG - 0.5);
            capState.textContent = atCap
              ? `Plafond glucides : ATTEINT (≈ ${round(carbCapG,0)} g/j)`
              : `Plafond glucides : actif (≈ ${round(carbCapG,0)} g/j)`;
            capState.classList.add(atCap ? "warn" : "ok");
          }
        }

        // Bloc "si cap atteint" (ou low-carb)
        const capG = capActive ? Math.max(0, carbCapG) : 0;
        const cTheoG = Math.max(0, targetCraw);        // glucides théoriques (sans cap / sans low-carb)
        const fBaseG = Math.max(0, targetFbase);       // lipides plancher en g
        const shiftK = Math.max(0, kcalRemaining);     // kcal déplacées (carb-guard)

        // En low-carb : on explique en écart vs "théorique"
        let shiftK2 = shiftK;
        if (lowCarbEnabled){
          const diffC = Math.max(0, (cTheoG - cG)); // glucides "retirés" vs théorie
          shiftK2 = diffC * 4; // kcal libérées par le retrait de glucides
        }

        const fExtraG = Math.max(0, fG - fBaseG);

        setTxt("flow_capG", (lowCarbEnabled ? `${round(cG,0)} g/j (fixé)` : (capActive ? `${round(capG,0)} g/j` : "—")));
        setTxt("flow_cTheoG", round(cTheoG,1));
        setTxt("flow_shiftKcal", round(shiftK2,0));
        setTxt("flow_fBaseG", round(fBaseG,1));
        setTxt("flow_fExtraG", round(fExtraG,1));

        // Griser si aucun régime
        card.style.opacity = ($("dietMode")?.value === "none") ? .55 : 1;
      }

/* =====================================================================
   9) Diabète (UI rapide + reco + historique diab)
   UI piloté: #diabEnabled, #diabPanelInRepas, boutons reco, etc.
   ===================================================================== */
     function diab_isEnabled(){ return !!($("diabEnabled")?.checked); }
        let __diabUIBusy = false;

    /** Verrouille/déverrouille l'encart "Option diabète — repères glucides" (UI only) */
function diab_setQuickPanelLocked(locked){
  const panel = $("diabPanelInRepas");
  if (!panel) return;
  panel.classList.toggle("is-disabled", !!locked);

  // Inputs read-only : on laisse disabled quand OFF, on les passe en readonly quand ON
  panel.querySelectorAll("input, select, button, textarea").forEach(el => {
    // On n'active pas les champs de saisie inexistants ici: uniquement lecture
    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA"){
      if (locked){
        el.setAttribute("disabled","disabled");
        el.classList.add("is-locked");
      }else{
        el.removeAttribute("disabled");
        el.classList.remove("is-locked");
        // empêcher la saisie: readonly pour inputs texte/num
        if (el.tagName === "INPUT") el.setAttribute("readonly","readonly");
      }
    }else if (el.tagName === "BUTTON"){
      // boutons de raccourci actifs seulement si ON
      el.disabled = !!locked;
    }
  });

  const pill = $("diabQuickStatus");
  if (pill) pill.textContent = locked ? "(Désactivé)" : "(Activé)";
}

let __diabLastPushedCarbs = null;

/** Met à jour les mini-indicateurs (issus des repas V1 + glycémies diabète) */
function diab_updateQuickKpis(dateStr){
  // anti-boucle: n'entraîne jamais compute()
  const on = diab_isEnabled();

  // Totaux repas V1 (déjà calculés et affichés dans le tableau Résultats)
  // On lit les champs déjà existants si présents (ne touche pas au moteur).
  const carbs = isFinite(toNum($("eatenC")?.value)) ? toNum($("eatenC")?.value) : toNum($("tC")?.value);  // priorité: "Déjà consommé" (repas)
  const cap   = toNum($("carbCeil")?.value || $("carbGuardCeil")?.value || $("carbGuardPillar")?.value); // si tu as un champ plafond existant

  // Dernière glycémie du jour: on lit la table glycémies si elle existe
  
  let lastTxt = "—";
  try{
    const d = dateStr || getSelectedDate?.() || "";
    const arr = (typeof diab_getGlucoseForDay === "function") ? diab_getGlucoseForDay(d) : [];
    if (arr && arr.length){
      const last = arr[arr.length-1];
      const unit = ($("diab_unit")?.value || "mgdl");
      if (last && isFinite(last.mgdl)){
        if (unit === "mmol"){
          lastTxt = round(diab_mgdlToMmol(last.mgdl), 1) + " mmol/L";
        }else{
          lastTxt = round(last.mgdl, 0) + " mg/dL";
        }
      }
    }
  }catch(e){ /* silence */ }
const setV = (id, v) => { const el=$(id); if(el) el.value = v; };

  // OFF -> on affiche "-" mais on n'efface rien côté stockage
  setV("diabQuickCarbG", on ? (isFinite(carbs)? String(round(carbs,1)) : "-") : "-");
const pushed = toNum($("diabQuickCarbG")?.value);
if (__diabLastPushedCarbs !== pushed){
  __diabLastPushedCarbs = pushed;
  try{
    const ev = new CustomEvent("diab:carbs-pushed", {
      detail: { date: dateStr || (getSelectedDate?.() || ""), carbsG: pushed }
    });
    window.dispatchEvent(ev);
  }catch(e){}
}

  setV("diabQuickLastG", on ? lastTxt : "-");

  const line = $("diabQuickLine");
  if (line){
    if (!on){
      line.textContent = "Option diabète désactivée : activer pour afficher zones, plafond et alertes.";
    }else{
      const capTxt = (isFinite(cap) && cap>0) ? ` • plafond ${round(cap,0)} g/j` : "";
      line.textContent = `(activés)${capTxt}.`;
    }
  }

  // Recos low-carb / Repères glucidiques
  const rec = $("diabQuickReco");
  if (rec){
    const lowOn = !!$("lowCarbEnabled")?.checked;
    const guardOn = !!$("carbGuardEnabled")?.checked;
    rec.classList.toggle("hidden", !on);
const txt = $("diabQuickRecoText");
    if (txt){
      if (!on) txt.textContent = "";
      else{
        const parts = [];
        if (!lowOn && !guardOn){
          parts.push("Pour réduire ou encadrer les glucides, active Low-carb ou Repères dans la section « Repères glucidiques ».");
        } else if (!lowOn){
          parts.push("Pour réduire davantage les glucides, active l’option Low-carb dans « Repères glucidiques ».");
        } else if (!guardOn){
          parts.push("Pour encadrer la journée, active l’option Repères dans « Repères glucidiques ».");
        } else {
          parts.push("Options actives : ajustement possible dans « Repères glucidiques ».");
        }
        parts.push("Ces options sont facultatives et n’affectent pas l’historique.");
        txt.textContent = parts.join(" ");
      }
    }
}
}

/** Active/désactive le mode diabète (UI + recommandations). Ne modifie pas le moteur V1. */
function applyDiabMode(enabled){
  const on = !!enabled;

  // Affichage du menu diabète
  const item = $("diabMenuItem");
  if (item) item.classList.toggle("hidden", !on);

  // Si on désactive alors qu'on est sur l'onglet diabète -> retour dashboard
  const current = document.body.getAttribute("data-tab") || "";
  if (!on && current === "diab"){
    window.__Phase6.Contracts.require('CompositeEntryPoints', 'openTab')("dash", { delay:0 });
  }

  diab_setQuickPanelLocked(!on);
  diab_setHistoryLocked(!on);
  diab_refreshHistoryUI(!on);

  // Cache sur la page diabète: on garde uniquement journal + contexte
  $("diabBlocksWrap")?.classList.add("hidden"); // repas+historique diabètes inutiles (repas gérés sur page Repas)
  $("diabBlocksHome")?.classList.add("hidden");

  // Rafraîchir affichage
  diab_updateQuickKpis(getSelectedDate?.() || "");
}

function notifyDiabProfileChanged(){
        const frame = $("diabFrame");
        try{
          frame?.contentWindow?.postMessage({ type:"PROFILE_CHANGED" }, "*");
        } catch(e){}
      }

/* =========================================================
   HISTORIQUE JOURNÉE — DIABÈTE (page Suivi)
   - Visible seulement si option diabète activée
   - Sauvegarde: réutilise le stockage "day" (loadDays/upsertDay)
   - Ne touche pas au moteur V1
   ========================================================= */
function diab_setHistoryLocked(locked){
  const body = $("diabHistoryBody");
  const msg  = $("diabHistoryLockMsg");
  if (body) body.classList.toggle("diab-locked", !!locked);
  if (msg)  msg.classList.toggle("hidden", !locked);
}

function diab_refreshHistoryUI(){
  // Render tableau historique diabète dans Suivi (si présent)
  if ($("diab_daysHistory_suivi")){
    diab_renderDaysHistory("diab_daysHistory_suivi");
  }
}

function diab_deleteDiabDataForDay(dateStr){
  const d = getDay(dateStr);
  if (!d) return;
  // On supprime uniquement les données diabète (journal + meta), sans toucher aux repas V1.
  const dayObj = { ...d };
  delete dayObj.diabGlucose;
  delete dayObj.diabMeta;
  delete dayObj.diabMeals; // si jamais existait dans d'anciennes versions
  dayObj.updatedAt = new Date().toISOString();
  upsertDay(dayObj);

  // Rafraîchir affichages (si l'utilisateur est sur la même date)
  const cur = getSelectedDate?.() || "";
  if (cur && cur === dateStr){
    try{ diab_renderGlucoseTable(cur); }catch(e){}
    try{ diab_renderDayKpis(cur); }catch(e){}
    try{ diab_refreshHistoryUI(); }catch(e){}
  }
}

function diab_deleteDiabHistoryRow(dateStr){
  const d = getDay(dateStr);
  if (!d) return;

  // Supprime UNIQUEMENT les données diabète de la journée (historique diabète),
  // sans toucher aux repas V1 stockés dans d.meals
  const dayObj = { ...d };

  delete dayObj.diabGlucose;
  delete dayObj.diabMeta;
  delete dayObj.diabSettings;
  delete dayObj.diabMeals; // au cas où legacy

  dayObj.updatedAt = new Date().toISOString();
  upsertDay(dayObj);

  // Si on est sur la même date, on rafraîchit les panneaux diabète
  const cur = getSelectedDate?.() || "";
  if (cur === dateStr){
    try{ diab_renderGlucoseTable(cur); }catch(e){}
    try{ diab_renderDayKpis(cur); }catch(e){}
  }
  try{ diab_renderDaysHistory(); }catch(e){}
  try{ diab_refreshHistoryUI?.(); }catch(e){}
}


function diab_initHistorySuivi(){
  const inp = $("diabHistDate");
  const ref = $("btnDiabHistRefresh");
  const selectHistoryDate = window.__Phase6.Contracts.require('DiabetesEntryPoints', 'selectHistoryDate');
  const refreshHistoryUI = window.__Phase6.Contracts.require('DiabetesEntryPoints', 'refreshHistoryUI');

  if (inp){
    inp.value = getSelectedDate?.() || new Date().toISOString().slice(0,10);
    inp.addEventListener("change", () => {
      selectHistoryDate(inp.value);
    });
  }
  if (ref){
    ref.addEventListener("click", () => {
      refreshHistoryUI(getSelectedDate());
    });
  }
}


/* =========================
   Diabète — module intégré
   (stocké dans dayObj: diabMeta, diabMeals, diabGlucose + diabSettings)
   ========================= */

function diab_mgdlToMmol(mgdl){ return mgdl / 18; }
function diab_mmolToMgdl(mmol){ return mmol * 18; }

function diab_displayGlucose(valueMgdl, unit){
  if (!Number.isFinite(valueMgdl) || valueMgdl <= 0) return "-";
  return (unit === "mmol") ? round(diab_mgdlToMmol(valueMgdl), 1) : round(valueMgdl, 0);
}

function diab_parseGlucoseInput(v, unit){
  const x = toNum(v);
  if (x <= 0) return 0;
  return (unit === "mmol") ? diab_mmolToMgdl(x) : x; // store mg/dL
}

function diab_getSettings(){
  const d = getDay(getSelectedDate());
  const s = d?.diabSettings || null;
  return {
    glucoseUnit: s?.glucoseUnit || "mgdl",
    carbPortionG: Math.max(5, toNum(s?.carbPortionG || 15))
  };
}

function diab_saveSettings(){
  const dateStr = getSelectedDate();
  const existing = getDay(dateStr) || { date: dateStr };
  const settings = {
    glucoseUnit: ($("diab_glucoseUnit")?.value || "mgdl"),
    updatedAt: new Date().toISOString()
  };
  const dayObj = { ...existing, date: dateStr, diabSettings: settings, updatedAt: new Date().toISOString() };
  upsertDay(dayObj);
  return settings;
}


function diab_normalizeMeta(meta){
  const sick = String(meta?.sick ?? "");
  const alcohol = String(meta?.alcohol ?? "");

  // HbA1c (optionnel)
  const hba1cRaw = (meta?.hba1c ?? "");
  const hba1cNum = (String(hba1cRaw).trim() !== "" && Number.isFinite(toNum(hba1cRaw)))
    ? clamp(toNum(hba1cRaw), 3, 20)
    : null;

  const hba1cDate = String(meta?.hba1cDate ?? "").trim();

  return {
    activity: String(meta?.activity ?? "").trim(),
    stress: (String(meta?.stress).trim() !== "" && Number.isFinite(toNum(meta?.stress))) ? clamp(toNum(meta.stress), 0, 10) : null,
    sleepH:  (String(meta?.sleepH).trim() !== "" && Number.isFinite(toNum(meta?.sleepH))) ? clamp(toNum(meta.sleepH), 0, 24) : null,
    sick: (sick === "yes" || sick === "no") ? sick : "",
    alcohol: (alcohol === "yes" || alcohol === "no") ? alcohol : "",
    note: String(meta?.note ?? "").trim(),

    // NEW
    hba1c: hba1cNum,
    hba1cDate: hba1cDate
  };
}



function diab_loadMetaIntoUI(dateStr){
  const d = getDay(dateStr);
  const meta = diab_normalizeMeta(d?.diabMeta || {});
  if ($("diab_dayActivity")) $("diab_dayActivity").value = meta.activity || "";
  if ($("diab_dayStress")) $("diab_dayStress").value = (meta.stress==null) ? "" : meta.stress;
  if ($("diab_daySleepH")) $("diab_daySleepH").value = (meta.sleepH==null) ? "" : meta.sleepH;
  if ($("diab_daySick")) $("diab_daySick").value = meta.sick || "";
  if ($("diab_dayAlcohol")) $("diab_dayAlcohol").value = meta.alcohol || "";
  if ($("diab_dayNoteFree")) $("diab_dayNoteFree").value = meta.note || "";

  // NEW
  if ($("diab_hba1c")) $("diab_hba1c").value = (meta.hba1c==null) ? "" : round(meta.hba1c,1);
  if ($("diab_hba1cDate")) $("diab_hba1cDate").value = meta.hba1cDate || "";
}

function diab_saveMetaFromUI(dateStr){
  const existing = getDay(dateStr) || { date: dateStr };
  const meta = diab_normalizeMeta({
    activity: $("diab_dayActivity")?.value,
    stress: $("diab_dayStress")?.value,
    sleepH: $("diab_daySleepH")?.value,
    sick: $("diab_daySick")?.value,
    alcohol: $("diab_dayAlcohol")?.value,
    note: $("diab_dayNoteFree")?.value,

    // NEW
    hba1c: $("diab_hba1c")?.value,
    hba1cDate: $("diab_hba1cDate")?.value
  });
  const dayObj = { ...existing, date: dateStr, diabMeta: meta, updatedAt: new Date().toISOString() };
  upsertDay(dayObj);
}


function diab_normalizeMeal(m){
  const carb = Math.max(0, toNum(m.carb));
  const fiber = Math.max(0, toNum(m.fiber));
  const sugar = Math.max(0, toNum(m.sugar));
  const net = Math.max(0, carb - fiber);
  return {
    id: m.id || crypto.randomUUID?.() || String(Date.now() + Math.random()),
    name: String(m.name ?? "").trim() || "Repas",
    carb, fiber, sugar,
    net,
    note: String(m.note ?? "").trim(),
    createdAt: m.createdAt || new Date().toISOString()
  };
}

function diab_getMealsForDay(dateStr){
  const d = getDay(dateStr);
  return Array.isArray(d?.diabMeals) ? d.diabMeals.map(diab_normalizeMeal) : [];
}

function diab_setMealsForDay(dateStr, meals){
  const existing = getDay(dateStr) || { date: dateStr };
  const dayObj = { ...existing, date: dateStr, diabMeals: meals.map(diab_normalizeMeal), updatedAt: new Date().toISOString() };
  upsertDay(dayObj);
}

function diab_mealsTotals(meals){
  return meals.reduce((acc, m) => {
    acc.carb += toNum(m.carb);
    acc.fiber += toNum(m.fiber);
    acc.sugar += toNum(m.sugar);
    acc.net += Math.max(0, toNum(m.carb) - toNum(m.fiber));
    return acc;
  }, { carb:0, fiber:0, sugar:0, net:0 });
}

function diab_renderMealsTable(dateStr){
  const meals = diab_getMealsForDay(dateStr).sort((a,b)=> (a.createdAt||"").localeCompare(b.createdAt||""));
  const wrap = $("diab_mealsTableWrap");
  if (!wrap) return;

  const settings = diab_getSettings();
  const portionG = Math.max(5, toNum(settings.carbPortionG)) || 15;

  if (meals.length === 0){
    wrap.innerHTML = `<p class="muted">Aucun repas encodé pour cette journée.</p>`;
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Repas</th>
            <th>Glucides (g)</th>
            <th>Portions</th>
            <th style="text-align:left">Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${meals.map(m => {
            const net = Math.max(0, toNum(m.carb) - toNum(m.fiber));
            const portions = portionG > 0 ? (net / portionG) : 0;
            return `
              <tr data-mealid="${m.id}">
                <td class="td-left"><input data-field="name" value="${escapeHtml(m.name)}" /></td>
                <td><input data-field="carb" type="number" min="0" step="0.1" value="${round(m.carb,1)}" /></td>
                <td><input data-field="fiber" type="number" min="0" step="0.1" value="${round(m.fiber,1)}" /></td>
                <td><input data-field="sugar" type="number" min="0" step="0.1" value="${round(m.sugar,1)}" /></td>
                <td><b>${round(net,1)}</b></td>
                <td>${round(portions,2)}</td>
                <td class="td-left"><input data-field="note" value="${escapeHtml(m.note)}" /></td>
                <td><button class="btn-mini btn-danger" data-action="del">🗑️</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("change", () => {
      const tr = inp.closest("tr");
      const id = tr.getAttribute("data-mealid");
      const field = inp.getAttribute("data-field");
      const mealsNow = diab_getMealsForDay(dateStr);
      const idx = mealsNow.findIndex(x => x.id === id);
      if (idx < 0) return;

      const updated = { ...mealsNow[idx] };
      if (field === "name" || field === "note") updated[field] = inp.value;
      else updated[field] = toNum(inp.value);

      mealsNow[idx] = diab_normalizeMeal(updated);
      diab_setMealsForDay(dateStr, mealsNow);

      diab_renderMealsTable(dateStr);
      diab_renderDayKpis(dateStr);
    });
  });

  wrap.querySelectorAll("button[data-action='del']").forEach(btn => {
    btn.addEventListener("click", () => {
      const tr = btn.closest("tr");
      const id = tr.getAttribute("data-mealid");
      const mealsNow = diab_getMealsForDay(dateStr).filter(x => x.id !== id);
      diab_setMealsForDay(dateStr, mealsNow);
      diab_renderMealsTable(dateStr);
      diab_renderDayKpis(dateStr);
    });
  });
}

function diab_addMealFromInputs(){
  const dateStr = getSelectedDate();
  const m = diab_normalizeMeal({
    name: $("diab_mealName")?.value?.trim() || "Repas",
    carb: toNum($("diab_mealCarb")?.value),
    fiber: toNum($("diab_mealFiber")?.value),
    sugar: toNum($("diab_mealSugar")?.value),
    note: $("diab_mealNote")?.value?.trim() || "",
    createdAt: new Date().toISOString()
  });

  const mealsNow = diab_getMealsForDay(dateStr);
  mealsNow.push(m);
  diab_setMealsForDay(dateStr, mealsNow);

  if ($("diab_mealName")) $("diab_mealName").value = "";
  if ($("diab_mealCarb")) $("diab_mealCarb").value = 0;
  if ($("diab_mealFiber")) $("diab_mealFiber").value = 0;
  if ($("diab_mealSugar")) $("diab_mealSugar").value = 0;
  if ($("diab_mealNote")) $("diab_mealNote").value = "";

  diab_renderMealsTable(dateStr);
  diab_renderDayKpis(dateStr);
}

function diab_clearMealsForDay(){
  const dateStr = getSelectedDate();
  diab_setMealsForDay(dateStr, []);
  diab_renderMealsTable(dateStr);
  diab_renderDayKpis(dateStr);
}

function diab_applyPer100ToMeal(){
  const c100  = toNum($("diab_qC100")?.value);
  const fi100 = toNum($("diab_qFi100")?.value);
  const su100 = toNum($("diab_qSu100")?.value);
  const g     = toNum($("diab_qWeight")?.value);

  if (g > 0 && c100 >= 0 && $("diab_mealCarb")) $("diab_mealCarb").value = round(c100 * g / 100, 1);
  if (g > 0 && fi100 >= 0 && $("diab_mealFiber")) $("diab_mealFiber").value = round(fi100 * g / 100, 1);
  if (g > 0 && su100 >= 0 && $("diab_mealSugar")) $("diab_mealSugar").value = round(su100 * g / 100, 1);
}

function diab_normalizeGlucose(x){
  const mgdl = Math.max(0, toNum(x.mgdl));
  return {
    id: x.id || crypto.randomUUID?.() || String(Date.now() + Math.random()),
    mgdl,
    context: String(x.context ?? "").trim() || "autre",
    time: String(x.time ?? "").trim(),
    note: String(x.note ?? "").trim(),
    createdAt: x.createdAt || new Date().toISOString()
  };
}

function diab_getGlucoseForDay(dateStr){
  const d = getDay(dateStr);
  return Array.isArray(d?.diabGlucose) ? d.diabGlucose.map(diab_normalizeGlucose) : [];
}

function diab_setGlucoseForDay(dateStr, items){
  const existing = getDay(dateStr) || { date: dateStr };
  const dayObj = { ...existing, date: dateStr, diabGlucose: items.map(diab_normalizeGlucose), updatedAt: new Date().toISOString() };
  upsertDay(dayObj);
}

function diab_renderGlucoseTable(dateStr){
  const unit = $("diab_glucoseUnit")?.value || diab_getSettings().glucoseUnit || "mgdl";
  const items = diab_getGlucoseForDay(dateStr).sort((a,b)=> (a.createdAt||"").localeCompare(b.createdAt||""));
  const wrap = $("diab_glucoseTableWrap");
  if (!wrap) return;

  if (items.length === 0){
    wrap.innerHTML = `<p class="muted">Aucune glycémie encodée pour cette journée.</p>`;
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Heure</th>
            <th>Moment</th>
            <th>Valeur (${unit === "mmol" ? "mmol/L" : "mg/dL"})</th>
            <th style="text-align:left">Note</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(g => `
            <tr data-gid="${g.id}">
              <td><input data-field="time" type="time" value="${escapeHtml(g.time)}" /></td>
              <td>
                <select data-field="context">
                  ${["à jeun","avant repas","2h après repas","coucher","nuit / réveil hypo","avant sport","après sport","autre"]
                    .map(opt => `<option value="${escapeHtml(opt)}" ${opt===g.context?"selected":""}>${escapeHtml(opt)}</option>`)
                    .join("")}
                </select>
              </td>
              <td>
                <input data-field="value" type="number" min="0" step="${unit==="mmol" ? "0.1":"1"}"
                       value="${diab_displayGlucose(g.mgdl, unit)}" />
              </td>
              <td class="td-left"><input data-field="note" value="${escapeHtml(g.note)}" /></td>
              <td><button class="btn-mini btn-danger" data-action="del">🗑️</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;

  wrap.querySelectorAll("input,select").forEach(el => {
    el.addEventListener("change", () => {
      const tr = el.closest("tr");
      const id = tr.getAttribute("data-gid");
      const field = el.getAttribute("data-field");
      const now = diab_getGlucoseForDay(dateStr);
      const idx = now.findIndex(x => x.id === id);
      if (idx < 0) return;

      const updated = { ...now[idx] };
      if (field === "context") updated.context = el.value;
      else if (field === "time") updated.time = el.value;
      else if (field === "note") updated.note = el.value;
      else if (field === "value") updated.mgdl = diab_parseGlucoseInput(el.value, unit);

      now[idx] = diab_normalizeGlucose(updated);
      diab_setGlucoseForDay(dateStr, now);
      diab_renderDayKpis(dateStr);
      diab_renderDaysHistory();
    });
  });

  wrap.querySelectorAll("button[data-action='del']").forEach(btn => {
    btn.addEventListener("click", () => {
      const tr = btn.closest("tr");
      const id = tr.getAttribute("data-gid");
      const now = diab_getGlucoseForDay(dateStr).filter(x => x.id !== id);
      diab_setGlucoseForDay(dateStr, now);
      diab_renderGlucoseTable(dateStr);
      diab_renderDayKpis(dateStr);
      diab_renderDaysHistory();
    });
  });
}


function diab_syncMomentChips(){
  const wrap = $("diab_momentChips");
  const sel  = $("diab_gContext");
  if (!wrap || !sel) return;
  const v = String(sel.value || "").toLowerCase();
  wrap.querySelectorAll("button.chip").forEach(btn => {
    const bv = String(btn.getAttribute("data-val") || "").toLowerCase();
    btn.classList.toggle("is-selected", bv === v);
  });
}

function diab_renderMiniChart(dateStr){
  const svg = $("diabMiniChart");
  const line = $("diabLine");
  const dots = $("diabDots");
  const xAxis = $("diabXAxis");
  const empty = $("diabMiniChartEmpty");
  if (!svg || !line || !dots || !xAxis || !empty) return;

  const d = getDay(dateStr);
  const unit = $("diab_glucoseUnit")?.value || "mgdl";
  const gl = Array.isArray(d?.diabGlucose) ? d.diabGlucose.map(diab_normalizeGlucose) : [];

  const ptsRaw = gl
    .map(x => {
      const mgdl = Number.isFinite(toNum(x.mgdl)) ? toNum(x.mgdl) : null;
      const t = (x.time || x.t || x.hour || "").toString();
      return { mgdl, time: t, ctx: x.ctx || x.context || x.moment || "" };
    })
    .filter(x => x.mgdl != null);

  if (ptsRaw.length === 0){
    line.setAttribute("d", "");
    dots.innerHTML = "";
    xAxis.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  // --- X : temps (si time présent) sinon index ---
  const hasTime = ptsRaw.some(p => /^\d{2}:\d{2}$/.test(p.time));
  const toMin = (hhmm) => {
    const [hh, mm] = hhmm.split(":").map(n=>parseInt(n,10));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh*60 + mm;
  };

  const pts = ptsRaw.map((p,i) => {
    const xKey = hasTime && /^\d{2}:\d{2}$/.test(p.time) ? toMin(p.time) : i;
    const yVal = (unit === "mmol") ? diab_mgdlToMmol(p.mgdl) : p.mgdl;
    return { xKey, yVal, label: p.time || "" };
  }).sort((a,b)=> (a.xKey??0) - (b.xKey??0));

  const W = 640, H = 140;
  const padL = 26, padR = 10, padT = 12, padB = 22;
  const w = W - padL - padR;
  const h = H - padT - padB;

  const xMin = pts[0].xKey;
  const xMax = pts[pts.length-1].xKey;
  const xSpan = (xMax - xMin) || 1;

  let yMin = Math.min(...pts.map(p=>p.yVal));
  let yMax = Math.max(...pts.map(p=>p.yVal));
  const padY = Math.max((yMax - yMin) * 0.15, unit==="mmol" ? 0.6 : 12);
  yMin -= padY; yMax += padY;
  const ySpan = (yMax - yMin) || 1;

  const X = (xKey) => padL + ((xKey - xMin) / xSpan) * w;
  const Y = (yVal) => padT + (1 - ((yVal - yMin) / ySpan)) * h;

  // --- Path (polyline lissée simple) ---
  const dPath = pts.map((p,idx)=>{
    const x = X(p.xKey), y = Y(p.yVal);
    return `${idx===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  line.setAttribute("d", dPath);

  // --- Dots ---
  dots.innerHTML = pts.map(p=>{
    const x = X(p.xKey), y = Y(p.yVal);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="rgba(87,255,162,.85)" stroke="rgba(0,0,0,.35)" stroke-width="1.2"></circle>`;
  }).join("");

  // --- X axis labels (sobre) ---
  xAxis.innerHTML = "";
  if (hasTime){
    const ticks = ["06:00","12:00","18:00","24:00"];
    const tickMins = [360, 720, 1080, 1440];
    const gx = ticks.map((t,i)=>{
      const x = X(tickMins[i]);
      return `<text x="${x.toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="middle" fill="rgba(220,230,255,.65)" font-size="10">${t}</text>`;
    }).join("");
    xAxis.innerHTML = gx;
  } else {
    // indices -> juste début/fin
    const x0 = X(xMin), x1 = X(xMax);
    xAxis.innerHTML =
      `<text x="${x0.toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="start" fill="rgba(220,230,255,.65)" font-size="10">début</text>
       <text x="${x1.toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="end" fill="rgba(220,230,255,.65)" font-size="10">fin</text>`;
  }
}

function diab_addGlucoseFromInputs(){
  const dateStr = getSelectedDate();
  const unit = $("diab_glucoseUnit")?.value || "mgdl";
  const mgdl = diab_parseGlucoseInput($("diab_gValue")?.value, unit);
  if (mgdl <= 0) { alert("Entre une valeur > 0."); return; }

  const entry = diab_normalizeGlucose({
    mgdl,
    context: $("diab_gContext")?.value || "autre",
    time: $("diab_gTime")?.value || "",
    note: ($("diab_gNote")?.value || "").trim(),
    createdAt: new Date().toISOString()
  });

  const now = diab_getGlucoseForDay(dateStr);
  now.push(entry);
  diab_setGlucoseForDay(dateStr, now);

  if ($("diab_gValue")) $("diab_gValue").value = "";
  if ($("diab_gNote")) $("diab_gNote").value = "";
  if ($("diab_gTime")) $("diab_gTime").value = "";

  diab_renderGlucoseTable(dateStr);
  diab_renderMiniChart(dateStr);
  diab_renderDayKpis(dateStr);
  diab_renderDaysHistory();
  diab_syncMomentChips();
}

function diab_clearGlucoseForDay(){
  const dateStr = getSelectedDate();
  diab_setGlucoseForDay(dateStr, []);
  diab_renderGlucoseTable(dateStr);
  diab_renderMiniChart(dateStr);
  diab_renderDayKpis(dateStr);
  diab_renderDaysHistory();
  diab_syncMomentChips();
}

function diab_glucoseStats(itemsMgdl){
  const vals = itemsMgdl.filter(x => Number.isFinite(x) && x > 0);
  if (vals.length === 0) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const avg = vals.reduce((s,v)=>s+v,0) / vals.length;
  return { count: vals.length, min, max, avg };
}

function diab_renderDayKpis(dateStr){
  const box = $("diab_dayKpis");
  const note = $("diab_dayNote");
  if (!box || !note) return;

  // Source de vérité = repas V1 : eatenC (priorité) sinon tC
  const carbsDay = isFinite(toNum($("eatenC")?.value))
    ? toNum($("eatenC")?.value)
    : toNum($("tC")?.value);

  const carbs = Number.isFinite(carbsDay) ? carbsDay : 0;

  box.innerHTML = `<div class="card"><b>Glucides (g)</b>${round(carbs,1)}</div>`;
  note.textContent = "Valeur informative. Total des glucides des repas encodés pour la journée.";
}

function diab_renderDaysHistory(targetId){
  const box = $(targetId || "diab_daysHistory");
  if (!box) return;

  const settings = diab_getSettings();
  const unit = $("diab_glucoseUnit")?.value || settings.glucoseUnit || "mgdl";

  const days = loadDays().sort((a,b)=> String(b.date).localeCompare(String(a.date)));

  // On garde seulement les jours qui ont AU MOINS une donnée diabète
  const filtered = days.filter(d =>
    (Array.isArray(d?.diabGlucose) && d.diabGlucose.length) ||
    (d?.diabMeta && Object.keys(d.diabMeta).length) ||
    (d?.diabSettings && Object.keys(d.diabSettings).length)
  );

  if (filtered.length === 0){
    box.innerHTML = "<p class='muted'>Aucune journée diabète enregistrée.</p>";
    return;
  }

  // Carry-forward HbA1c : on calcule en ASC, puis on affiche en DESC
  const asc = [...filtered].sort((a,b)=> String(a.date).localeCompare(String(b.date)));
  let lastA1c = null;
  let lastA1cDate = "";
  const a1cByDate = {};

  for (const d of asc){
    const meta = diab_normalizeMeta(d?.diabMeta || {});
    if (meta.hba1c != null){
      lastA1c = meta.hba1c;
      lastA1cDate = meta.hba1cDate || d.date;
    }
    a1cByDate[d.date] =
      (lastA1c != null)
        ? `${round(lastA1c,1)}%${lastA1cDate ? ` (${escapeHtml(lastA1cDate)})` : ""}`
        : "-";
  }

  box.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Glucides (g)</th>
            <th>Total glycémies (${unit==="mmol"?"mmol/L":"mg/dL"})</th>
            <th>HbA1c</th>
            <th>Maladie</th>
            <th>Alcool</th>
            <th>Stress</th>
            <th>Sommeil</th>
            <th style="text-align:left">Activité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(d => {
            // Glucides du jour : on calcule depuis les repas V1 du jour (stockés par date)
            const meals = getMealsForDay(d.date);
            const t = mealsTotals(meals);
            const carbs = Number.isFinite(toNum(t?.c)) ? toNum(t.c) : 0;

            // Glycémies : somme des valeurs
            const gl = Array.isArray(d.diabGlucose) ? d.diabGlucose.map(diab_normalizeGlucose) : [];
            const sumMgdl = gl.reduce((s,x)=> s + (Number.isFinite(toNum(x.mgdl)) ? toNum(x.mgdl) : 0), 0);
            const totalGly = (gl.length === 0)
              ? "-"
              : (unit === "mmol" ? round(diab_mgdlToMmol(sumMgdl), 1) : round(sumMgdl, 0));

            const meta = diab_normalizeMeta(d?.diabMeta || {});
            const sickTxt = meta.sick ? (meta.sick==="yes"?"Oui":"Non") : "-";
            const alcTxt  = meta.alcohol ? (meta.alcohol==="yes"?"Oui":"Non") : "-";
            const stressTxt = (meta.stress == null) ? "-" : `${meta.stress}/10`;
            const sleepTxt  = (meta.sleepH == null) ? "-" : `${round(meta.sleepH,1)}h`;
            const actTxt    = meta.activity ? escapeHtml(meta.activity) : "-";

            return `
              <tr>
                <td>${escapeHtml(d.date)}</td>
                <td>${round(carbs,1)}</td>
                <td>${totalGly}</td>
                <td>${a1cByDate[d.date] || "-"}</td>
                <td>${sickTxt}</td>
                <td>${alcTxt}</td>
                <td>${stressTxt}</td>
                <td>${sleepTxt}</td>
                <td class="td-left">${actTxt}</td>
                <td>
                  <button class="btn-mini btn-danger"
                          data-action="diab-day-del"
                          data-date="${escapeHtml(d.date)}"
                          type="button">🗑️</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  // ✅ Wire delete : supprime UNIQUEMENT l’historique diabète de la date (pas les repas)
  box.querySelectorAll("button[data-action='diab-day-del']").forEach(btn => {
    btn.addEventListener("click", () => {
      const dateStr = btn.getAttribute("data-date");
      if (!dateStr) return;
      if (!confirm(`Supprimer l’historique diabète de la journée ${dateStr} ?`)) return;
      const p6 = window.__Phase6;
      if (p6?.DiabetesEntryPoints?.deleteHistoryRow) return p6.DiabetesEntryPoints.deleteHistoryRow(dateStr);
      diab_deleteDiabHistoryRow(dateStr);
    });
  });
}

function diab_renderAll(dateStr){
  // Settings from day if any
  const d = getDay(dateStr);
  const s = d?.diabSettings || null;
  if ($("diab_glucoseUnit") && s?.glucoseUnit) $("diab_glucoseUnit").value = s.glucoseUnit;
  if ($("diab_carbPortionG") && s?.carbPortionG) $("diab_carbPortionG").value = Math.max(5, toNum(s.carbPortionG));

  diab_loadMetaIntoUI(dateStr);
  diab_renderMealsTable(dateStr);
  diab_renderGlucoseTable(dateStr);
  diab_renderMiniChart(dateStr);
  diab_renderDayKpis(dateStr);
  diab_renderDaysHistory();
  diab_syncMomentChips();
}

function initDiabModule(){
  // Si l'onglet diab n'existe pas dans cette version, on ne fait rien.
  if (!$("diab_glucoseUnit")) return;

  const dateStr = getSelectedDate();

  // boutons
  $("diab_btnAddMeal")?.addEventListener("click", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.addMeal) return p6.DiabetesEntryPoints.addMeal(getSelectedDate());
    return diab_addMealFromInputs();
  });
  $("diab_btnClearMeals")?.addEventListener("click", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.clearMeals) return p6.DiabetesEntryPoints.clearMeals(getSelectedDate());
    return diab_clearMealsForDay();
  });
  $("diab_btnApplyPer100")?.addEventListener("click", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.applyPer100) return p6.DiabetesEntryPoints.applyPer100();
    return diab_applyPer100ToMeal();
  });

  $("diab_btnAddGlucose")?.addEventListener("click", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.addGlucose) return p6.DiabetesEntryPoints.addGlucose(getSelectedDate());
    return diab_addGlucoseFromInputs();
  });
  $("diab_btnClearGlucose")?.addEventListener("click", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.clearGlucose) return p6.DiabetesEntryPoints.clearGlucose(getSelectedDate());
    return diab_clearGlucoseForDay();
  });

  // moment chips (UX) -> alimente le select compat
  const chipsWrap = $("diab_momentChips");
  const selMoment = $("diab_gContext");
  if (chipsWrap && selMoment){
    chipsWrap.querySelectorAll("button.chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-val") || "";
        selMoment.value = v;
        diab_syncMomentChips();
      });
    });
    selMoment.addEventListener("change", diab_syncMomentChips);
    diab_syncMomentChips();
  }

  // settings change => sauvegarde (dans la journée) + refresh
  ["diab_glucoseUnit"].forEach(id => {
    $(id)?.addEventListener("change", () => {
      const v = (id==="diab_carbPortionG") ? clamp(toNum($("diab_carbPortionG").value), 5, 60) : null;
      if (v != null) $("diab_carbPortionG").value = v;
      const p6 = window.__Phase6;
      if (p6?.DiabetesEntryPoints?.saveSettings) return p6.DiabetesEntryPoints.saveSettings(getSelectedDate());
      diab_saveSettings();
      diab_renderAll(getSelectedDate());
    });
  });

  // meta autosave
  ["diab_dayActivity","diab_dayStress","diab_daySleepH","diab_daySick","diab_dayAlcohol","diab_dayNoteFree","diab_hba1c","diab_hba1cDate"]
.forEach(id => {
    $(id)?.addEventListener("change", () => {
      const d = getSelectedDate();
      const p6 = window.__Phase6;
      if (p6?.DiabetesEntryPoints?.saveMeta) return p6.DiabetesEntryPoints.saveMeta(d, { source:'autosave' });
      diab_saveMetaFromUI(d);
      diab_renderDayKpis(d);
      diab_renderDaysHistory();
    });
  });
$("diab_btnSaveDayMeta")?.addEventListener("click", () => {
  const d = getSelectedDate();
  const p6 = window.__Phase6;
  if (p6?.DiabetesEntryPoints?.saveMeta) return p6.DiabetesEntryPoints.saveMeta(d, { source:'button-refresh' });
  diab_renderDayKpis(d);
  diab_renderDaysHistory();
  diab_syncMomentChips();
});


  // synchro changements date/profil
  $("dayDate")?.addEventListener("change", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.renderAll) return p6.DiabetesEntryPoints.renderAll(getSelectedDate(), { source:'day-change' });
    diab_renderAll(getSelectedDate());
  });
  $("profileSelect")?.addEventListener("change", () => {
    const p6 = window.__Phase6;
    if (p6?.DiabetesEntryPoints?.renderAll) return p6.DiabetesEntryPoints.renderAll(getSelectedDate(), { source:'profile-change' });
    diab_renderAll(getSelectedDate());
  });

  diab_renderAll(dateStr);
}

initDiabModule();


/* =====================================================================
   10) Cloud sync (Supabase)
   UI piloté: #cloudStatus + boutons cloud
   ===================================================================== */
// Sync multi-support (Supabase)
// - Permet de retrouver tes données sur plusieurs appareils.
// - L'app reste utilisable en local si la synch est indisponible.
// ==============================
      const ENABLE_CLOUD_SYNC = true;

      const SUPABASE_URL = "https://ztrqqtjktydibcznbpen.supabase.co";
      const SUPABASE_ANON_KEY = "sb_publishable_VvPPkGiqqRBj1QSsdVboGg_uHzO06-o";

      let supa = null;
      if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        if (ENABLE_CLOUD_SYNC) {
          supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } else {
          supa = null;
        }
      } 
      

/* createClient */ 

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




  function phase660LabelTextForMode(mode){
    const m = (mode === "sport" || mode === "expert") ? mode : "simple";
    return {
      dietType: 'Type de régime',
      fatFloor: (m === 'simple') ? 'Minimum lipides (g/kg)' : 'Plancher lipides (g/kg)',
      ratio: (m === 'simple') ? 'Répartition glucides/protéines' : 'Ratio glucides/protéines',
      carbToggle: (m === 'simple') ? 'Niveau glucides' : 'Repères glucides',
      carbGoal: (m === 'expert') ? 'Cible glucidique (g/kg/j)' : ((m === 'sport') ? 'Repères glucides (g/kg/j)' : 'Niveau glucides (g/kg/j)'),
      carbPanelTitle: (m === 'simple') ? 'Niveau glucides' : 'Repères glucides',
      protHintPrefix: (m === 'simple') ? 'Repère protéines' : 'Plage protéines',
      fatHintPrefix: (m === 'simple') ? 'Minimum lipides' : 'Plage lipides'
    };
  }

  function phase660SetLabelTextFor(inputId, text){
    const input = $(inputId);
    const label = input ? input.closest('div')?.querySelector('label') : null;
    if (!label) return;
    const info = label.querySelector('.info-dot');
    label.textContent = text;
    if (info){
      label.appendChild(document.createTextNode(' '));
      label.appendChild(info);
    }
  }

  function phase660SetToggleText(inputId, text){
    const input = $(inputId);
    const span = input?.closest('label')?.querySelector('span:not(.info-dot)');
    if (span) span.textContent = text;
  }

  function phase660RetitleHint(el, prefix){
    if (!el) return;
    const current = (el.textContent || '').trim();
    const value = current.includes(':') ? current.split(':').slice(1).join(':').trim() : '—';
    el.textContent = `${prefix} : ${value || '—'}`;
  }

  function phase660ApplyLexicalHierarchy(){
    const mode = ($('useMode')?.value || document.body?.dataset?.usemode || 'simple');
    const t = phase660LabelTextForMode(mode);
    phase660SetLabelTextFor('dietMode', t.dietType);
    phase660SetLabelTextFor('fatFloorGPerKg', t.fatFloor);
    phase660SetLabelTextFor('ratioCP', t.ratio);
    phase660SetLabelTextFor('carbGoal', t.carbGoal);
    phase660SetToggleText('carbGuardEnabled', t.carbToggle);
    const panelTitle = document.querySelector('#carbGuardBox')?.closest('.card.panel-subtle')?.querySelector('h3.h3');
    if (panelTitle) panelTitle.textContent = t.carbPanelTitle;
    phase660RetitleHint($('protRangeHint'), t.protHintPrefix);
    phase660RetitleHint($('fatRangeHint'), t.fatHintPrefix);
  }

// 6) Fix rappel rapide : écrase le doublon (modeCopy -> positioningText)
  window.setPositioningCopy = function setPositioningCopy(mode){
    const el = $("positioningText");
    if (!el) return;
    const m = (mode === "sport" || mode === "expert") ? mode : "simple";

    if (m === "sport") {
      el.textContent = "Mode sportif : équilibre entre charge et récupération.";
    } else if (m === "expert") {
      el.textContent = "Mode Expert : la valeur du jour peut varier. Lis surtout la tendance sur 7 jours.";
    } else {
      el.textContent = "Mode simple : priorité à la régularité sur 7 jours.";
    }
    try { phase660ApplyLexicalHierarchy(); } catch(e){}
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
    $("useMode")?.addEventListener("change", phase660ApplyLexicalHierarchy);
    window.addEventListener("load", phase660ApplyLexicalHierarchy, { once:true });
    setTimeout(phase660ApplyLexicalHierarchy, 0);
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
      objectif:["Poids stable","Énergie régulière","Glycémie plus stable","Habitudes durables" ],
      compromis:["Pas d’optimisation extrême","Progression physique modérée"],
      macros:{ c:"≈ 45–55 %", p:"≈ 18–22 %", f:"≈ 25–35 %" },
      ajust:["Journée active → glucides ↑, lipides ↓","Journée calme → glucides ↓, lipides ↑","Protéines stables"],
      app:{ preset:"maintain / équilibre", carbGoals:["maintain"], fatFloors:["maintain"] },
      plus:["Idéal pour poser une base saine avant toute phase plus spécifique.","Convient si l’objectif principal est la régularité, pas la transformation rapide."]
    },
    eq_gly: {
      title:"Stabilité glycémique (équilibrage orienté satiété)",
      phase:"Équilibrage / transition",
      objectif:["Stabiliser la glycémie","Maintenir l’énergie","Augmenter la satiété"],
      compromis:["Flexibilité alimentaire réduite","Phase d’adaptation possible"],
      macros:{ c:"≈ 35–45 %", p:"≈ 20–25 %", f:"≈ 30–35 %" },
      ajust:["Glucides concentré autour de l’effort","Fibres ↑","Lipides plutôt éloignés du post-effort"],
      app:{ preset:"recomp", carbGoals:["recomp","maintain"], fatFloors:["recomp","maintain"], note:"inactive" },
      plus:["Utile si tu as souvent faim, des coups de barre ou des envies de sucre.","Convient mieux aux journées peu explosives qu’aux efforts très intenses."]
    },
    cut_sport: {
      title:"Sèche progressive (référence amaigrissement)",
      phase:"Amaigrissement",
      objectif:["Perte de gras progressive","Performance encore exploitable","Masse musculaire préservée"],
      compromis:["Perte de gras plus progressive","Rigueur alimentaire plus élevée"],
      macros:{ c:"≈ 35–45 %", p:"≈ 25–30 %", f:"≈ 25–30 %" },
      ajust:["Jours lourds → glucides ↑, lipides ↓","Jours OFF → glucides ↓, lipides ↑","Protéines constantes"],
      app:{ preset:"cut_standard", carbGoals:["sport"], fatFloors:["sport"] },
      plus:["Le meilleur compromis pour perdre du gras sans sacrifier l’entraînement.","C’est le choix le plus sûr pour une sèche active et durable."]
    },
    cut_fast: {
      title:"Sèche rapide (court terme)",
      phase:"Amaigrissement (court terme)",
      objectif:["Perte de gras rapide","Résultat visible à court terme"],
      compromis:["Performance en baisse","Fatigue accrue","Durée limitée"],
      macros:{ c:"≈ 25–35 %", p:"≈ 30–35 %", f:"≈ 25–30 %" },
      ajust:["Réduire le volume d’entraînement","Planifier une pause / refeed si nécessaire","Surveiller sommeil / récupération"],
      app:{ preset:"cut_aggressive", carbGoals:["strict"], fatFloors:["strict"] },
      plus:["À utiliser comme un outil ponctuel, jamais comme un mode de vie.","Adapté à un objectif rapide avec une date précise."]
    },
    recomp: {
      title:"Recomposition modérée",
      phase:"Transition",
      objectif:["Améliorer la composition corporelle","Préserver la masse musculaire","Maintenir un niveau d’énergie stable"],
      compromis:["Progression plus progressive","Rigueur alimentaire plus élevée"],
      macros:{ c:"≈ 40–50 %", p:"≈ 20–25 %", f:"≈ 25–30 %" },
      ajust:["Glucides modulés à l’entraînement","Léger déficit certains jours seulement","Priorité au rassasiant"],
      app:{ preset:"recomp", carbGoals:["recomp"], fatFloors:["recomp"] },
      plus:["Idéal si le poids stagne mais que la composition corporelle s’améliore.","Convient bien aux phases de transition ou de reprise."]
    },
    endurance: {
      title:"Performance / endurance",
      phase:"Performance",
      objectif:["Soutenir l’endurance","Maintenir l’énergie","Soutenir la performance"],
      compromis:["Amaigrissement non prioritaire","Apports énergétiques plus élevés"],
      macros:{ c:"≈ 55–65 %", p:"≈ 15–20 %", f:"≈ 20–25 %" },
      ajust:["Carb-loading ponctuel si besoin","Lipides plus bas transitoirement (48–72 h) en carb-load","Protéines stables"],
      app:{ preset:"endurance", carbGoals:["volume","carbload"], fatFloors:["volume","carbload"] },
      plus:["À privilégier quand la performance et le volume priment sur l’esthétique.","Peu compatible avec un objectif d’amaigrissement rapide."]
    },
    protect: {
      title:"Protection musculaire / récupération prioritaire",
      phase:"Sèche longue / fatigue",
      objectif:["Préserver la masse maigre","Améliorer la récupération","Réduire le risque de surmenage"],
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
