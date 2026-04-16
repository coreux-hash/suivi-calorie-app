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

function getSportEditingSessionId(){
  return String(window.__sportEditingSessionId || "");
}

function setSportEditingSessionId(id){
  window.__sportEditingSessionId = String(id || "");
  const btn = $("btnSportSave");
  if (btn) btn.textContent = window.__sportEditingSessionId ? "Mettre à jour" : "Enregistrer";
}

function resetSportEditorState(){
  setSportEditingSessionId("");
}

function fillSportInputsFromSession(session){
  const mins = Math.max(0, toNum(session?.minutes) || 0);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  if ($("sportType")) $("sportType").value = String(session?.type || "");
  if ($("sportHh")) $("sportHh").value = String(hh);
  if ($("sportMm")) $("sportMm").value = String(mm);
  if ($("sportMin")) $("sportMin").value = mins;
  if ($("sportKcal")) $("sportKcal").value = Math.max(0, toNum(session?.kcal) || 0);
}

function editSportSession(dateStr, sessionId){
  const sessions = getSportSessionsForDay(dateStr);
  const session = sessions.find(s => String(s.id||"") === String(sessionId||""));
  if (!session) return;
  setSportEditingSessionId(session.id);
  fillSportInputsFromSession(session);
  sportUI_setEditor(true);
}

function loadSportSleepIntoUI(dateStr){
  const d = getDay(dateStr) || { date: dateStr };

  // Sport : on prépare l'ajout d'une séance (on ne charge pas l'agrégat dans les champs)
  if ($("sportMin")) $("sportMin").value = 0;
  if ($("sportHh")) $("sportHh").value = 0;
  if ($("sportMm")) $("sportMm").value = 0;
  if ($("sportKcal")) $("sportKcal").value = 0;
  if ($("sportType")) $("sportType").value = "";
  resetSportEditorState();

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
  if (on){
    $("sleepSummary")?.classList.add("is-hidden");
    $("sleepEmptyNote")?.classList.add("is-hidden");
    setTimeout(()=>{ $("sleepBed")?.focus() || $("sleepHh")?.focus(); }, 30);
    return;
  }
  try {
    renderSleepSummaryForDay(getSelectedDateStr());
  } catch(e){}
}

function ensureSleepSummaryStructure(){
  const root = $("sleepSummary");
  if (!root) return null;
  if ($("sleepSummaryDur") && $("sleepSummaryScore") && $("sleepSummaryRange") && $("btnSleepDelete")) return root;

  root.classList.add("sleepSummary");
  root.innerHTML = `
    <div class="sleepSummaryTop">
      <strong id="sleepSummaryDur" class="sideBig">—</strong>
      <div class="sleepSummaryMetaRight">
        <span id="sleepSummaryScore" class="muted">score —</span>
        <button id="btnSleepDelete" type="button" class="btn-ghost btn-icon" title="Supprimer">✕</button>
      </div>
    </div>
    <div id="sleepSummaryRange" class="sleepSummaryRange">—</div>
    <div class="muted mt-03">Corrige plus tard si nécessaire.</div>
  `;
  return root;
}

function ensureSleepEmptyNote(){
  const card = $("sleepCard");
  if (!card) return null;
  let note = $("sleepEmptyNote");
  if (!note){
    note = document.createElement("div");
    note.id = "sleepEmptyNote";
    note.className = "sleepEmptyNote muted mt-06";
    note.textContent = "Aucun sommeil encodé ce jour.";
  }

  note.classList.add("sleepEmptyNote", "muted", "mt-06");

  const splitNote = card.querySelector(".phase1SplitNote");
  const editBtn = $("btnSleepEdit");

  if (splitNote && splitNote.parentNode === card){
    if (splitNote.nextSibling !== note){
      splitNote.insertAdjacentElement("afterend", note);
    }
  } else if (editBtn && editBtn.parentNode === card){
    if (editBtn.previousSibling !== note){
      card.insertBefore(note, editBtn);
    }
  } else if (note.parentNode !== card){
    card.appendChild(note);
  }

  return note;
}

function renderSleepSummaryForDay(dateStr){
  ensureSleepSummaryStructure();
  const emptyNote = ensureSleepEmptyNote();
  const root = $("sleepSummary");
  const d = getDay(dateStr) || { date: dateStr };
  const sl = d.sleep || {};
  const mins = getSleepMinutesFromObj(sl);
  const score = Math.max(0, toNum(sl.score) || 0);
  const bed = String(sl.bed || "").trim();
  const wake = String(sl.wake || "").trim();
  const hasSleep = (mins > 0) || (score > 0) || (bed !== "") || (wake !== "");

  const dur = $("sleepSummaryDur");
  const sc = $("sleepSummaryScore");
  const rg = $("sleepSummaryRange");

  if (dur) dur.textContent = (mins > 0) ? fmtHM(mins) : "—";
  if (sc) sc.textContent = (score > 0) ? (score + " / 100") : "score —";
  if (rg) rg.textContent = (bed || wake) ? (`${bed || "—"} → ${wake || "—"}`) : "—";

  if (root) root.classList.toggle("is-hidden", !hasSleep);
  if (emptyNote) emptyNote.classList.toggle("is-hidden", hasSleep);
  bindSleepSummaryActions(dateStr);
}


function deleteSleepForDay(dateStr){
  const existing = getDay(dateStr);
  if (!existing) return;

  const dayObj = {
    ...existing,
    date: dateStr,
    sleep: {},
    updatedAt: new Date().toISOString()
  };
  upsertDay(dayObj);

  if ($("sleepHh")) $("sleepHh").value = "0";
  if ($("sleepMm")) $("sleepMm").value = "0";
  if ($("sleepH")) $("sleepH").value = "0";
  if ($("sleepScore")) $("sleepScore").value = "0";
  if ($("sleepBed")) $("sleepBed").value = "";
  if ($("sleepWake")) $("sleepWake").value = "";

  renderSleepSummaryForDay(dateStr);
  try{ sleepUI_setEditMode(false); }catch(e){}
  renderSportSleep7d(dateStr);
  try{ phase6CompatRenderHistory(dateStr); }catch(e){}
}

function bindSleepSummaryActions(dateStr){
  const btn = $("btnSleepDelete");
  if (!btn) return;
  btn.onclick = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    deleteSleepForDay(dateStr);
  };
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
          <div class="loadPct">${p.toFixed(0)}%</div>
          <div class="loadBar" aria-hidden="true"><i style="width:${p.toFixed(0)}%"></i></div>
          <div class="actions">
            <button type="button" class="btn-ghost btn-icon" title="Modifier" aria-label="Modifier" data-sportedit="${escapeHtml(s.id)}">✎</button>
            <button type="button" class="btn-ghost btn-icon" title="Supprimer" aria-label="Supprimer" data-sportdel="${escapeHtml(s.id)}">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function clearSportInputs(){
  if ($("sportMin")) $("sportMin").value = 0;
  if ($("sportHh")) $("sportHh").value = 0;
  if ($("sportMm")) $("sportMm").value = 0;
  if ($("sportKcal")) $("sportKcal").value = 0;
  if ($("sportType")) $("sportType").value = "";
  resetSportEditorState();
}

function addSportSessionFromInputs(dateStr){
  const minutes = Math.max(0, toNum($("sportMin")?.value) || 0);
  const kcal = Math.max(0, toNum($("sportKcal")?.value) || 0);
  const type = String($("sportType")?.value || "").trim();

  // aucune donnée => pas de sauvegarde
  if (minutes <= 0 && kcal <= 0 && !type) return;

  const existing = getDay(dateStr) || { date: dateStr };
  const sessions = Array.isArray(existing.sportSessions) ? existing.sportSessions.slice() : [];

  const editingId = getSportEditingSessionId();
  if (editingId){
    const idx = sessions.findIndex(s => String(s?.id||"") === editingId);
    if (idx >= 0){
      sessions[idx] = {
        ...sessions[idx],
        type,
        minutes,
        kcal,
        updatedAt: new Date().toISOString()
      };
    } else {
      const id = "s_" + Math.random().toString(36).slice(2,10) + "_" + Date.now().toString(36);
      sessions.push({ id, type, minutes, kcal, createdAt: new Date().toISOString() });
    }
  } else {
    const id = "s_" + Math.random().toString(36).slice(2,10) + "_" + Date.now().toString(36);
    sessions.push({ id, type, minutes, kcal, createdAt: new Date().toISOString() });
  }

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
  if (String(getSportEditingSessionId() || "") === String(sessionId || "")) clearSportInputs();

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



document.addEventListener("click", function(ev){
  const t = ev.target;
  if (!t) return;

  const sleepDel = t.closest && t.closest("#btnSleepDelete");
  if (sleepDel){
    ev.preventDefault();
    ev.stopPropagation();
    try{ deleteSleepForDay(getSelectedDateStr()); }catch(e){}
    return;
  }
});
