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
    const html = dot.getAttribute("data-modalhtml") || "";
    const txt = dot.getAttribute("data-modaltext") || dot.getAttribute("data-help") || "";
    if (!html && !txt) return;
    try { openWatchInfoModal(html ? { html } : txt); } catch(err) { console.warn("info-dot modal failed", err); }
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
      #watchInfoBody table{ width:100%; border-collapse:collapse; color:inherit; }
      #watchInfoBody th,#watchInfoBody td{ border-bottom:1px solid rgba(255,255,255,.14); padding:.45rem .35rem; text-align:left; vertical-align:top; }
      #watchInfoBody th{ font-weight:700; }
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

  phase0MoveNode('#miniSummaryGoalCard', 'todayGoalSummarySlot');

  phase0MoveNode('#historyV2Card', 'historyMainSlot');
  phase0MoveNode('#sportCard', 'journalActivitySlot');
  phase0MoveNode('#sleepCard', 'journalSleepSlot');
  phase0MoveNode('#accHistAdvanced', 'journalMetricsSlot');
  phase0MoveNode('#accTrendExpert', 'historyTrendSlot');
  phase0MoveNode('#accDiabHistoryFull', 'historyDiabSlot');
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
  const accepted = !!(typeof isTermsAccepted === 'function' && isTermsAccepted());
  const initialTab = accepted ? "today" : "settings";
  setActiveTab(initialTab);

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
  custom:         { min: 0.0, max: 2.0 }
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


