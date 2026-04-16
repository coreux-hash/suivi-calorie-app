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
  const wrap = $("diabHistoryTableWrap");
  const chart = $("diabHistoryChartAcc");
  if (body){
    body.classList.toggle("diab-locked", !!locked);
    body.setAttribute("aria-disabled", locked ? "true" : "false");
  }
  if (wrap) wrap.classList.toggle("diab-locked", !!locked);
  if (chart) chart.classList.toggle("diab-locked", !!locked);
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
  const chartTargets = [
    { svg:"diabMiniChart", line:"diabLine", dots:"diabDots", xAxis:"diabXAxis", empty:"diabMiniChartEmpty" },
    { svg:"diabHistoryMiniChart", line:"diabHistoryLine", dots:"diabHistoryDots", xAxis:"diabHistoryXAxis", empty:"diabHistoryMiniChartEmpty" }
  ];

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

  chartTargets.forEach(ids => {
    const svg = $(ids.svg);
    const line = $(ids.line);
    const dots = $(ids.dots);
    const xAxis = $(ids.xAxis);
    const empty = $(ids.empty);
    if (!svg || !line || !dots || !xAxis || !empty) return;

    if (ptsRaw.length === 0){
      line.setAttribute("d", "");
      dots.innerHTML = "";
      xAxis.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

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

    const dPath = pts.map((p,idx)=>{
      const x = X(p.xKey), y = Y(p.yVal);
      return `${idx===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
    line.setAttribute("d", dPath);

    dots.innerHTML = pts.map(p=>{
      const x = X(p.xKey), y = Y(p.yVal);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="rgba(87,255,162,.85)" stroke="rgba(0,0,0,.35)" stroke-width="1.2"></circle>`;
    }).join("");

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
      const x0 = X(xMin), x1 = X(xMax);
      xAxis.innerHTML =
        `<text x="${x0.toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="start" fill="rgba(220,230,255,.65)" font-size="10">début</text>
         <text x="${x1.toFixed(1)}" y="${(H-6).toFixed(1)}" text-anchor="end" fill="rgba(220,230,255,.65)" font-size="10">fin</text>`;
    }
  });
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
    <div class="historyDiabTableShell">
      <div class="historyDiabTableHead">
        <div>
          <div class="historyDiabTableEyebrow">Journal diabète consolidé</div>
          <div class="historyDiabTableTitle">${filtered.length} journée${filtered.length > 1 ? 's' : ''} avec données diabète</div>
        </div>
        <div class="historyDiabTableUnit">Unité glycémie : ${unit==="mmol"?"mmol/L":"mg/dL"}</div>
      </div>
      <div class="table-wrap historyDiabTableWrapInner">
        <table class="historyDiabTable">
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

