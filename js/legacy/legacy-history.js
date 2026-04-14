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

