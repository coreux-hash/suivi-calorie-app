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

      
