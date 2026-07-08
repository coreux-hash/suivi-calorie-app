;(function(global){
  'use strict';

  const DOC = global.document;
  const WEEK_DAYS = 7;
  const ENERGY_LOW = 0.85;
  const ENERGY_OK_MIN = 0.85;
  const ENERGY_OK_MAX = 1.15;
  const PROTEIN_OK_MIN = 0.90;

  function $(id){ return DOC ? DOC.getElementById(id) : null; }
  function toNum(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
  function clampInt(v){ return Math.max(0, Math.round(toNum(v))); }
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function isoToday(){ return new Date().toISOString().slice(0,10); }
  function parseISODate(dateStr){
    const s = String(dateStr || '').slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const y = Number(s.slice(0,4));
    const m = Number(s.slice(5,7));
    const d = Number(s.slice(8,10));
    return new Date(y, m - 1, d);
  }
  function ymdLocal(dt){
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const d = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function getSelectedDateSafe(){
    try{
      if (typeof global.getSelectedDate === 'function') return String(global.getSelectedDate() || isoToday()).slice(0,10);
    }catch(_){ }
    return String($('dayDate')?.value || isoToday()).slice(0,10);
  }
  function loadDaysSafe(){
    try{ return (typeof global.loadDays === 'function') ? (global.loadDays() || []) : []; }
    catch(_){ return []; }
  }
  function getDaySafe(dateStr){
    try{
      if (typeof global.getDay === 'function') return global.getDay(dateStr) || null;
    }catch(_){ }
    return loadDaysSafe().find(d => d && d.date === dateStr) || null;
  }
  function mealTotals(dayObj){
    const meals = Array.isArray(dayObj?.meals) ? dayObj.meals : [];
    return meals.reduce((acc, meal) => {
      acc.k += Math.max(0, toNum(meal?.k));
      acc.p += Math.max(0, toNum(meal?.p));
      acc.c += Math.max(0, toNum(meal?.c));
      acc.f += Math.max(0, toNum(meal?.f));
      return acc;
    }, { k:0, p:0, c:0, f:0 });
  }
  function normalizePlayfulDay(dayObj){
    const d = dayObj || {};
    const savedEaten = d.eaten || {};
    const meal = mealTotals(d);
    const eaten = {
      k: Math.max(0, toNum(savedEaten.k) || meal.k),
      p: Math.max(0, toNum(savedEaten.p) || meal.p),
      c: Math.max(0, toNum(savedEaten.c) || meal.c),
      f: Math.max(0, toNum(savedEaten.f) || meal.f)
    };
    const sport = d.sport || {};
    const sportSessions = Array.isArray(d.sportSessions) ? d.sportSessions : [];
    const hasSport = sportSessions.length > 0 || toNum(sport.minutes) > 0 || toNum(sport.kcal) > 0;
    const hasSpend = toNum(d.montreAdjusted) > 0 || toNum(d.montreRaw) > 0;
    const hasActivity = hasSpend || hasSport;
    const mealsCount = Array.isArray(d.meals) ? d.meals.length : 0;
    return {
      raw: d,
      date: String(d.date || getSelectedDateSafe()).slice(0,10),
      mealsCount,
      eaten,
      targetKcal: Math.max(0, toNum(d.targetKcal)),
      targetP: Math.max(0, toNum(d.targetP)),
      targetC: Math.max(0, toNum(d.targetC)),
      targetF: Math.max(0, toNum(d.targetF)),
      montreAdjusted: Math.max(0, toNum(d.montreAdjusted)),
      montreRaw: Math.max(0, toNum(d.montreRaw)),
      dietMode: d.dietMode || '',
      goalPct: toNum(d.goalPct),
      morningWeight: Math.max(0, toNum(d.morningWeight)),
      hasActivity,
      hasSport,
      hasSpend,
      hasMealEnergy: eaten.k > 0 || eaten.p > 0 || eaten.c > 0 || eaten.f > 0
    };
  }
  function hasMeaningfulData(dayObj){
    try{
      if (typeof global.historyV2_hasMeaningfulData === 'function') return !!global.historyV2_hasMeaningfulData(dayObj);
    }catch(_){ }
    const d = normalizePlayfulDay(dayObj);
    const sleep = dayObj?.sleep || {};
    const glucose = Array.isArray(dayObj?.diabGlucose) ? dayObj.diabGlucose : [];
    return !!(d.hasMealEnergy || d.hasActivity || d.morningWeight > 0 || toNum(sleep.minutes) > 0 || toNum(sleep.hours) > 0 || glucose.length);
  }

  function hasReadableInput(dayObj){
    const d = normalizePlayfulDay(dayObj);
    const sleep = dayObj?.sleep || {};
    const glucose = Array.isArray(dayObj?.diabGlucose) ? dayObj.diabGlucose : [];
    return !!(
      d.mealsCount > 0 ||
      d.hasMealEnergy ||
      d.hasActivity ||
      d.morningWeight > 0 ||
      toNum(sleep.minutes) > 0 ||
      toNum(sleep.hours) > 0 ||
      glucose.length
    );
  }


  function etatDuJour(dayObj){
    const d = normalizePlayfulDay(dayObj);
    const kRatio = d.targetKcal > 0 ? d.eaten.k / d.targetKcal : null;
    const pRatio = d.targetP > 0 ? d.eaten.p / d.targetP : null;
    const hasFoodEntry = d.mealsCount > 0 || d.hasMealEnergy;

    if (!hasReadableInput(dayObj)){
      return {
        key:'no_data', tone:'muted', label:'À renseigner',
        summary:'Aucune donnée enregistrée pour cette date.',
        signal:'Commence par renseigner un repas ou une activité.'
      };
    }
    if (d.hasActivity && !hasFoodEntry){
      return {
        key:'partial_activity', tone:'warn', label:'À compléter',
        summary:'Activité prise en compte. Repas encore à renseigner.',
        signal:'Activité prise en compte. Ajoute le repas si tu veux lire la journée.'
      };
    }
    if (hasFoodEntry && !d.hasMealEnergy){
      return {
        key:'partial_food', tone:'warn', label:'À compléter',
        summary:'Repas créé. Valeurs encore à renseigner.',
        signal:'Le repas existe. Complète les valeurs pour lire la journée.'
      };
    }
    if (!hasFoodEntry){
      return {
        key:'partial_info', tone:'warn', label:'À compléter',
        summary:'Une information est présente. Repas encore à renseigner.',
        signal:'Ajoute au moins un repas pour obtenir une lecture utile.'
      };
    }
    if (!(d.targetKcal > 0) && !(d.targetP > 0)){
      return {
        key:'incomplete', tone:'warn', label:'À compléter',
        summary:'Repas présent. Objectifs encore à vérifier.',
        signal:'La journée existe. Vérifie les objectifs pour obtenir une lecture plus claire.'
      };
    }
    if (d.hasActivity && kRatio != null && kRatio < ENERGY_LOW && pRatio != null && pRatio < PROTEIN_OK_MIN){
      return {
        key:'recovery_attention', tone:'warn', label:'À surveiller',
        summary:'Activité présente avec apports bas.',
        signal:'Activité présente et apports bas : vérifie que la récupération suit.'
      };
    }
    if (pRatio != null && pRatio < PROTEIN_OK_MIN){
      return {
        key:'protein_low', tone:'warn', label:'Protéines à compléter',
        summary:'Les protéines sont sous le repère enregistré.',
        signal:'Les protéines sont le point principal à compléter.'
      };
    }
    if (kRatio != null && kRatio < ENERGY_LOW){
      return {
        key:'energy_low', tone:'warn', label:'Sous la cible',
        summary:'L’apport est bas par rapport à la cible du jour.',
        signal:'L’apport est bas par rapport à la cible enregistrée.'
      };
    }
    if (kRatio != null && kRatio > ENERGY_OK_MAX){
      return {
        key:'energy_high', tone:'watch', label:'Au-dessus',
        summary:'L’apport dépasse le repère énergétique enregistré.',
        signal:'L’apport dépasse la cible du jour. À relire selon ton objectif.'
      };
    }
    if ((kRatio == null || (kRatio >= ENERGY_OK_MIN && kRatio <= ENERGY_OK_MAX)) && (pRatio == null || pRatio >= PROTEIN_OK_MIN)){
      return {
        key:'stable', tone:'ok', label:'Stable',
        summary:'Repères principaux cohérents.',
        signal:'La journée est cohérente avec le compromis choisi.'
      };
    }
    return {
      key:'incomplete', tone:'warn', label:'À compléter',
      summary:'Lecture partielle : certaines valeurs utiles manquent.',
      signal:'Complète les champs principaux pour obtenir un état plus net.'
    };
  }

  function missionsDuJour(dayObj){
    const d = normalizePlayfulDay(dayObj);
    const energyRatio = d.targetKcal > 0 ? d.eaten.k / d.targetKcal : null;
    const proteinRatio = d.targetP > 0 ? d.eaten.p / d.targetP : null;
    const hasFoodEntry = d.mealsCount > 0 || d.hasMealEnergy;
    return [
      {
        key:'meals', label:'Repas', done:hasFoodEntry,
        detail:hasFoodEntry ? 'Repas ajouté' : 'Ajoute au moins un repas'
      },
      {
        key:'proteins', label:'Protéines', done:proteinRatio != null && proteinRatio >= PROTEIN_OK_MIN,
        detail:proteinRatio == null ? 'À vérifier après les repas' : (proteinRatio >= PROTEIN_OK_MIN ? 'Repère atteint' : 'À compléter')
      },
      {
        key:'activity', label:'Activité', done:d.hasActivity,
        detail:d.hasActivity ? 'Activité ajoutée' : 'Ajoute une activité si besoin'
      },
      {
        key:'weight', label:'Poids', done:d.morningWeight > 0,
        detail:d.morningWeight > 0 ? 'Poids indiqué' : 'Optionnel'
      },
      {
        key:'energy', label:'Apport', done:energyRatio != null && energyRatio >= ENERGY_OK_MIN && energyRatio <= ENERGY_OK_MAX,
        detail:energyRatio == null ? 'À vérifier après les repas' : (energyRatio >= ENERGY_OK_MIN && energyRatio <= ENERGY_OK_MAX ? 'Proche du repère' : 'À ajuster selon ton objectif')
      }
    ];
  }

  function weekStartISO(dateStr){
    const base = parseISODate(dateStr) || parseISODate(isoToday());
    const day = (base.getDay() + 6) % 7; // lundi = 0
    const start = new Date(base);
    start.setDate(base.getDate() - day);
    return start;
  }
  function rythmeSemaine(days, selectedDate){
    const all = Array.isArray(days) ? days : [];
    const map = new Map(all.filter(Boolean).map(d => [d.date, d]));
    const start = weekStartISO(selectedDate);
    const segments = [];
    let count = 0;
    for (let i=0;i<WEEK_DAYS;i++){
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const date = ymdLocal(cur);
      const dayObj = map.get(date) || null;
      const filled = hasMeaningfulData(dayObj);
      if (filled) count += 1;
      segments.push({ date, filled });
    }
    return { count, total:WEEK_DAYS, segments, label:`${count}/${WEEK_DAYS} jours renseignés` };
  }
  function trajectoireSemaine(days, selectedDate){
    const rhythm = rythmeSemaine(days, selectedDate);
    const map = new Map((Array.isArray(days) ? days : []).filter(Boolean).map(d => [d.date, d]));
    let proteinDays = 0;
    let energyDays = 0;
    let activityDays = 0;
    rhythm.segments.forEach(seg => {
      const dayObj = map.get(seg.date) || null;
      if (!dayObj || !hasMeaningfulData(dayObj)) return;
      const d = normalizePlayfulDay(dayObj);
      if (d.targetP > 0 && d.eaten.p >= d.targetP * PROTEIN_OK_MIN) proteinDays += 1;
      if (d.targetKcal > 0) {
        const ratio = d.eaten.k / d.targetKcal;
        if (ratio >= ENERGY_OK_MIN && ratio <= ENERGY_OK_MAX) energyDays += 1;
      }
      if (d.hasActivity) activityDays += 1;
    });
    return { rhythm, proteinDays, energyDays, activityDays };
  }
  function missionDoneCount(dayObj){
    return missionsDuJour(dayObj).filter(m => m.done).length;
  }
  function getWeekDayObjects(days, selectedDate){
    const all = Array.isArray(days) ? days : [];
    const map = new Map(all.filter(Boolean).map(d => [d.date, d]));
    return rythmeSemaine(all, selectedDate).segments.map(seg => map.get(seg.date) || null);
  }
  function badgeProgress(current, target){
    const t = Math.max(1, clampInt(target));
    const c = Math.max(0, Math.min(clampInt(current), t));
    return { current:c, target:t, pct:Math.round((c / t) * 100), unlocked:c >= t };
  }
  function makeBadge(id, label, description, icon, family, current, target){
    const p = badgeProgress(current, target);
    return Object.assign({ id, label, description, icon, family }, p);
  }
  function badgeStats(days, selectedDate){
    const all = Array.isArray(days) ? days.filter(Boolean) : [];
    const weekObjs = getWeekDayObjects(all, selectedDate);
    const active = getDaySafe(selectedDate) || { date:selectedDate };
    const activeDone = missionDoneCount(active);
    const trajectory = trajectoireSemaine(all, selectedDate);

    let mealDaysAll = 0;
    let activityDaysAll = 0;
    let weightDaysAll = 0;
    let readableDaysAll = 0;
    all.forEach(dayObj => {
      if (!dayObj || !hasMeaningfulData(dayObj)) return;
      const d = normalizePlayfulDay(dayObj);
      const hasFoodEntry = d.mealsCount > 0 || d.hasMealEnergy;
      if (hasFoodEntry) mealDaysAll += 1;
      if (d.hasActivity) activityDaysAll += 1;
      if (d.morningWeight > 0) weightDaysAll += 1;
      if (hasFoodEntry && missionDoneCount(dayObj) >= 3) readableDaysAll += 1;
    });

    let weekReadableDays = 0;
    weekObjs.forEach(dayObj => {
      if (!dayObj || !hasMeaningfulData(dayObj)) return;
      const d = normalizePlayfulDay(dayObj);
      const hasFoodEntry = d.mealsCount > 0 || d.hasMealEnergy;
      if (hasFoodEntry && missionDoneCount(dayObj) >= 3) weekReadableDays += 1;
    });

    return {
      activeDone,
      trajectory,
      mealDaysAll,
      activityDaysAll,
      weightDaysAll,
      readableDaysAll,
      weekReadableDays
    };
  }
  function badgesDuParcours(days, selectedDate){
    const stats = badgeStats(days, selectedDate);
    const t = stats.trajectory;
    return [
      makeBadge('day_3_missions', 'Journée lancée', '3 repères du jour complétés.', '✓', 'jour', stats.activeDone, 3),
      makeBadge('day_4_missions', 'Journée lisible', '4 repères du jour complétés.', '◎', 'jour', stats.activeDone, 4),
      makeBadge('first_meal', 'Premier repas', 'Un repas a été ajouté.', '🍽', 'encodage', stats.mealDaysAll, 1),
      makeBadge('first_activity', 'Première activité', 'Une activité a été prise en compte.', '↯', 'activité', stats.activityDaysAll, 1),
      makeBadge('first_weight', 'Premier poids', 'Une mesure du jour est indiquée.', '⚖', 'suivi', stats.weightDaysAll, 1),
      makeBadge('week_3_days', 'Semaine lancée', '3 jours renseignés cette semaine.', '3', 'rythme', t.rhythm.count, 3),
      makeBadge('week_5_days', 'Semaine régulière', '5 jours renseignés cette semaine.', '5', 'rythme', t.rhythm.count, 5),
      makeBadge('week_7_days', 'Semaine complète', '7 jours renseignés cette semaine.', '7', 'rythme', t.rhythm.count, 7),
      makeBadge('protein_3_days', 'Repère protéines', '3 jours avec protéines cadrées.', 'P', 'nutrition', t.proteinDays, 3),
      makeBadge('energy_3_days', 'Apport cadré', '3 jours proches de la cible.', 'kcal', 'nutrition', t.energyDays, 3),
      makeBadge('activity_3_days', 'Activité suivie', '3 jours avec activité prise en compte.', '⚡', 'activité', t.activityDays, 3),
      makeBadge('readable_3_days', 'Suivi complet', '3 journées lisibles cette semaine.', '◆', 'équilibre', stats.weekReadableDays, 3)
    ];
  }
  function prochainBadge(days, selectedDate){
    const badges = badgesDuParcours(days, selectedDate);
    const locked = badges.filter(b => !b.unlocked);
    if (!locked.length) {
      return makeBadge('all_basic', 'Parcours bien lancé', 'Tous les badges de base sont débloqués.', '★', 'parcours', 1, 1);
    }
    locked.sort((a,b) => {
      const pa = a.current / a.target;
      const pb = b.current / b.target;
      if (pb !== pa) return pb - pa;
      return a.target - b.target;
    });
    return locked[0];
  }
  function renderNextBadgeMini(badge){
    if ($('playfulNextBadgeTitleMini')) $('playfulNextBadgeTitleMini').textContent = badge.label;
    if ($('playfulNextBadgeDescMini')) $('playfulNextBadgeDescMini').textContent = badge.unlocked ? 'Badge débloqué.' : badge.description;
    if ($('playfulNextBadgeProgressMini')) $('playfulNextBadgeProgressMini').textContent = `${badge.current}/${badge.target}`;
    if ($('playfulNextBadgeIconMini')) $('playfulNextBadgeIconMini').textContent = badge.icon || '🏅';
  }
  function renderBadgesHero(badge){
    const pct = Math.max(0, Math.min(100, badge.pct || 0));
    const ring = $('playfulBadgeRing');
    if (ring) ring.style.setProperty('--badge-progress', `${pct}%`);
    if ($('playfulBadgeRingText')) $('playfulBadgeRingText').textContent = `${badge.current}/${badge.target}`;
    if ($('playfulNextBadgeTitle')) $('playfulNextBadgeTitle').textContent = badge.label;
    if ($('playfulNextBadgeDescription')) $('playfulNextBadgeDescription').textContent = badge.unlocked ? 'Badge débloqué.' : badge.description;
  }
  function renderBadgesGrid(target, badges){
    const summary = $('playfulBadgesGridSummary');
    if (summary && Array.isArray(badges)) {
      const unlocked = badges.filter(b => b && b.unlocked).length;
      summary.textContent = `${unlocked}/${badges.length} débloqués`;
    }
    if (!target) return;
    target.innerHTML = badges.map(b => {
      const cls = b.unlocked ? ' is-unlocked' : ' is-locked';
      const label = b.unlocked ? 'Débloqué' : 'À débloquer';
      const pct = Math.max(0, Math.min(100, b.pct || 0));
      const lock = b.unlocked ? '<span class="playfulBadgeCard__check" aria-hidden="true">✓</span>' : '<span class="playfulBadgeCard__lock" aria-hidden="true">🔒</span>';
      return `<article class="playfulBadgeCard${cls}" title="${esc(b.description)}" aria-label="${esc(b.label)} — ${label}">
        <div class="playfulBadgeCard__icon" style="--badge-card-progress:${pct}%"><span>${esc(b.icon || '🏅')}</span>${lock}</div>
        <strong>${esc(b.label)}</strong>
        <small>${esc(b.current)}/${esc(b.target)}</small>
      </article>`;
    }).join('');
  }

  function renderMissionChips(target, missions){
    if (!target) return;
    target.innerHTML = missions.map(m => {
      const cls = m.done ? ' is-done' : '';
      const icon = m.done ? '✓' : '○';
      return `<span class="playfulMission${cls}" title="${esc(m.detail)}"><span aria-hidden="true">${icon}</span>${esc(m.label)}</span>`;
    }).join('');
  }
  function renderSegments(target, rhythm){
    if (!target) return;
    target.innerHTML = rhythm.segments.map((seg, idx) => {
      const cls = seg.filled ? ' is-filled' : '';
      return `<span class="playfulRhythm__seg${cls}" title="${esc(seg.date)}" aria-label="Jour ${idx+1}: ${seg.filled ? 'renseigné' : 'non renseigné'}"></span>`;
    }).join('');
  }
  function setTone(tone){
    const panel = $('playfulCockpitPanel');
    const pill = $('playfulStatePill');
    [panel, pill].forEach(el => {
      if (!el) return;
      el.dataset.tone = tone || 'muted';
    });
  }

  function renderPlayfulPilotage(){
    const date = getSelectedDateSafe();
    const dayObj = getDaySafe(date) || { date };
    const days = loadDaysSafe();
    const state = etatDuJour(dayObj);
    const missions = missionsDuJour(dayObj);
    const rhythm = rythmeSemaine(days, date);
    const next = prochainBadge(days, date);
    const done = missions.filter(m => m.done).length;

    setTone(state.tone);
    if ($('playfulStateLabel')) $('playfulStateLabel').textContent = state.label;
    if ($('playfulRhythmLabel')) $('playfulRhythmLabel').textContent = rhythm.label;
    if ($('playfulMissionsCount')) $('playfulMissionsCount').textContent = `${done}/${missions.length} complétées`;
    renderSegments($('playfulRhythmSegments'), rhythm);
    renderMissionChips($('playfulMissionsList'), missions);
    renderNextBadgeMini(next);
  }
  function renderPlayfulJournal(){
    const date = getSelectedDateSafe();
    const dayObj = getDaySafe(date) || { date };
    const missions = missionsDuJour(dayObj);
    const done = missions.filter(m => m.done).length;
    if ($('playfulJournalCount')) $('playfulJournalCount').textContent = `${done}/${missions.length}`;
    renderMissionChips($('playfulJournalMissions'), missions);
  }
  function renderPlayfulHistory(){
    const date = getSelectedDateSafe();
    const days = loadDaysSafe();
    const t = trajectoireSemaine(days, date);
    const badges = badgesDuParcours(days, date);
    const next = prochainBadge(days, date);
    if ($('playfulTrajectoryDays')) $('playfulTrajectoryDays').textContent = `${t.rhythm.count}/${t.rhythm.total}`;
    if ($('playfulTrajectoryProteins')) $('playfulTrajectoryProteins').textContent = `${t.proteinDays} j`;
    if ($('playfulTrajectoryEnergy')) $('playfulTrajectoryEnergy').textContent = `${t.energyDays} j`;
    if ($('playfulTrajectoryActivity')) $('playfulTrajectoryActivity').textContent = `${t.activityDays} j`;
    renderBadgesHero(next);
    renderBadgesGrid($('playfulBadgesGrid'), badges);
  }
  function renderAll(){
    try{ renderPlayfulPilotage(); }catch(e){ console.warn('playful pilotage render failed', e); }
    try{ renderPlayfulJournal(); }catch(e){ console.warn('playful journal render failed', e); }
    try{ renderPlayfulHistory(); }catch(e){ console.warn('playful history render failed', e); }
  }

  let refreshTimer = null;
  function queueRefresh(delay){
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(renderAll, typeof delay === 'number' ? delay : 40);
  }
  function wrapPersistence(){
    if (global.__playfulTrackingWrapped) return;
    global.__playfulTrackingWrapped = true;
    ['upsertDay','deleteDay','deleteAllDays','importDays','clearDays'].forEach(name => {
      const original = global[name];
      if (typeof original !== 'function') return;
      global[name] = function(){
        const result = original.apply(this, arguments);
        queueRefresh(80);
        return result;
      };
    });
  }
  function bind(){
    if (global.__playfulTrackingInit) return;
    global.__playfulTrackingInit = true;
    wrapPersistence();
    ['dayDate','histMonth','profileSelect'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener('change', () => queueRefresh(40));
      el.addEventListener('input', () => queueRefresh(40));
    });
    DOC.addEventListener('click', (e) => {
      const target = e.target?.closest?.('.calDay, [data-tab], [data-history-jump], [data-journal-jump], [data-today-jump], #btnAddMeal, #btnClearMeals, #btnSportSave, #btnSleepSave, #btnDeleteDay');
      if (target) queueRefresh(120);
    });
    global.addEventListener('storage', () => queueRefresh(80));
    queueRefresh(20);
    setTimeout(renderAll, 300);
  }

  global.__PlayfulTracking = {
    normalizePlayfulDay,
    etatDuJour,
    missionsDuJour,
    rythmeSemaine,
    trajectoireSemaine,
    badgesDuParcours,
    prochainBadge,
    renderAll,
    queueRefresh
  };

  if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', bind);
  else setTimeout(bind, 0);
})(window);
