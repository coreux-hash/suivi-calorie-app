/* v25.0 — Pont NutriApp (lecture seule).
   NutriApp et SuiviCalorieApp sont servies depuis la même origine (coreux-hash.github.io) :
   le stockage local est partagé. On lit uniquement `nutriapp.ingredients.v2` et
   `nutriapp.recipes.v2` (+ `nutriapp.suiviExport.v1` depuis v25.2) ; on n'écrit JAMAIS dans les clés `nutriapp.*`.
   Les fonctions de calcul sont pures (entrée explicite, sortie explicite) et testables sous Node.
   Les champs lus suivent l'ordre de `normalizeIngredient` / `normalizeRecipeRow` de NutriApp
   (assets/js/core/04-data-contracts-and-state.js). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SuiviNutriApp = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const KEYS = Object.freeze({ ingredients: 'nutriapp.ingredients.v2', recipes: 'nutriapp.recipes.v2', suiviExport: 'nutriapp.suiviExport.v1' });

  function pick(...values) {
    for (const v of values) if (v !== undefined && v !== null && v !== '') return v;
    return undefined;
  }
  function num(v) { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; }
  function text(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function round(v, d) { const f = 10 ** d; return Math.round(v * f) / f; }
  function fold(s) { return text(s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  function readArray(storage, key) {
    try {
      const raw = storage && storage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) { return []; }
  }

  /* Ingrédient NutriApp → valeurs pour 100 g. Écarte les entrées sans nom ou sans aucune valeur
     (toutes à 0 = probablement jamais remplies). */
  function toIngredient(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const m = raw.macros && typeof raw.macros === 'object' ? raw.macros : {};
    const name = text(pick(raw.name, raw.ingName, raw.cmName, raw.title, raw.nom, raw.label));
    if (!name) return null;
    const k = num(pick(raw.kcal, raw.Kcal, raw.kcal100, raw.calories, raw.energy, m.kcal, m.Kcal));
    const p = num(pick(raw.p, raw.P, raw.p100, raw.prot, raw.protein, raw.proteines, m.p, m.P));
    const c = num(pick(raw.carbs, raw.c, raw.g, raw.G, raw.g100, raw.glucides, raw.gluc, m.carbs, m.g, m.G));
    const f = num(pick(raw.fat, raw.f, raw.l, raw.L, raw.l100, raw.lipides, raw.lip, m.fat, m.l, m.L));
    if (!(k || p || c || f)) return null;
    return { name, k100: round(k, 0), p100: round(p, 1), c100: round(c, 1), f100: round(f, 1) };
  }

  /* v25.2 : ingrédient tel que NutriApp le prépare pour calculer ses recettes (contrat
     `normalizeIngredient`, 04-data-contracts-and-state.js l.52-97) : valeurs /100 g non arrondies,
     unités permises et conversions. Sert uniquement au calcul des recettes. */
  const UNITS = ['g', 'piece', 'ml', 'tbsp', 'tsp'];
  function toCalcIngredient(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const m = raw.macros && typeof raw.macros === 'object' ? raw.macros : {};
    const profile = text(pick(raw.profile, raw.ingProfile, raw.cmProfile, 'solid')).toLowerCase() === 'liquid' ? 'liquid' : 'solid';
    const rawUnits = pick(raw.allowedUnits, raw.unitsAllowed, raw.units, raw.allowed_units);
    let units = (Array.isArray(rawUnits) ? rawUnits : []).map((u) => text(u).toLowerCase()).filter((u) => UNITS.includes(u));
    units = units.filter((u) => (profile === 'liquid' ? u !== 'piece' : u !== 'ml'));
    if (!units.includes('g')) units.unshift('g');
    units = Array.from(new Set(units));
    const conv = raw.conversions && typeof raw.conversions === 'object' ? raw.conversions : {};
    const conversions = {
      pieceWeightG: num(pick(conv.pieceWeightG, raw.pieceWeightG, raw.piece_weight_g)),
      mlWeightG: num(pick(conv.mlWeightG, raw.mlWeightG, raw.ml_weight_g)),
      tbspWeightG: num(pick(conv.tbspWeightG, raw.tbspWeightG, raw.tbsp_weight_g)),
      tspWeightG: num(pick(conv.tspWeightG, raw.tspWeightG, raw.tsp_weight_g))
    };
    if (units.includes('ml') && conversions.mlWeightG <= 0) units = units.filter((u) => u !== 'ml');
    return {
      id: text(pick(raw.id, raw._id, raw.uid, raw.key)),
      name: text(pick(raw.name, raw.ingName, raw.cmName, raw.title, raw.nom, raw.label, 'Ingrédient')),
      units, conversions,
      k: num(pick(raw.kcal, raw.Kcal, raw.kcal100, raw.calories, raw.energy, m.kcal, m.Kcal)),
      p: num(pick(raw.p, raw.P, raw.p100, raw.prot, raw.protein, raw.proteines, m.p, m.P)),
      c: num(pick(raw.carbs, raw.c, raw.g, raw.G, raw.g100, raw.glucides, raw.gluc, m.carbs, m.g, m.G)),
      f: num(pick(raw.fat, raw.f, raw.l, raw.L, raw.l100, raw.lipides, raw.lip, m.fat, m.l, m.L))
    };
  }

  /* Une ligne de recette, résolue comme `resolveRecipeRow` de NutriApp
     (04-recipe-editor-runtime.js l.140-215) : ingrédient par id puis par nom exact (sans casse),
     quantité convertie en grammes selon l'unité permise, macros /100 g. Ligne non résolue = ignorée,
     comme dans `computeRecipeTotalsFromRows` (03-store-runtime.js l.390). */
  function resolveRow(row, ingredients) {
    if (!row || typeof row !== 'object') return null;
    const ingredientId = text(pick(row.ingredientId, row.ingId, row.ing, row.id));
    const ingredientName = text(pick(row.ingredientName, row.name, row.nameSnapshot)).toLowerCase();
    const qty = num(pick(row.qty, row.quantity));
    const unitRaw = text(pick(row.unit, row.u, 'g')).toLowerCase();
    const unit = UNITS.includes(unitRaw) ? unitRaw : 'g';
    const ing = (ingredientId && ingredients.find((i) => i.id === ingredientId))
      || (ingredientName && ingredients.find((i) => i.name.toLowerCase() === ingredientName)) || null;
    if (!ing || !(qty > 0)) return null;
    let grams = 0;
    if (unit === 'g') grams = qty;
    else if (ing.units.includes(unit)) {
      grams = qty * ({ piece: ing.conversions.pieceWeightG, ml: ing.conversions.mlWeightG, tbsp: ing.conversions.tbspWeightG, tsp: ing.conversions.tspWeightG }[unit] || 0);
    }
    if (!(grams > 0)) return null;
    return { k: ing.k * grams / 100, p: ing.p * grams / 100, c: ing.c * grams / 100, f: ing.f * grams / 100 };
  }

  /* Recette NutriApp → valeurs pour UNE portion = total recalculé (même calcul que NutriApp) /
     nombre de portions. Écarte une recette dont le total est nul (NutriApp affiche alors 0 aussi). */
  function toRecipe(raw, ingredients) {
    if (!raw || typeof raw !== 'object') return null;
    const name = text(pick(raw.name, raw.nom, raw.title));
    if (!name) return null;
    const parts = Math.max(1, Math.min(999, Math.round(num(pick(raw.parts, raw.portions, raw.recipePortions, 1)) || 1)));
    const total = { k: 0, p: 0, c: 0, f: 0 };
    const list = Array.isArray(ingredients) ? ingredients : [];
    (Array.isArray(raw.rows) ? raw.rows : []).forEach((row) => {
      const m = resolveRow(row, list);
      if (!m) return;
      total.k += m.k; total.p += m.p; total.c += m.c; total.f += m.f;
    });
    if (!(total.k || total.p || total.c || total.f)) return null;
    /* v25.1 : identifiant stable (id NutriApp, sinon le nom) et date de modification (ISO, posée
       par l'éditeur de recettes NutriApp) pour pouvoir retirer une recette de la liste. */
    const id = text(pick(raw.id, raw.uuid, raw._id));
    const key = id ? `id:${id}` : `name:${name.toLowerCase()}`;
    const updatedAt = text(raw.updatedAt);
    return { key, id, updatedAt, name, parts, k: round(total.k / parts, 0), p: round(total.p / parts, 1), c: round(total.c / parts, 1), f: round(total.f / parts, 1) };
  }

  /* v25.2 : sélection « Envoyer vers Suivi » cochée sur les cartes recettes de NutriApp
     (clé écrite par NutriApp, liste d'identifiants). Clé absente = NutriApp pas encore à jour
     ou jamais touchée → toutes les recettes, comme avant. Clé présente → uniquement les cochées. */
  function readExportSelection(storage) {
    try {
      const raw = storage && storage.getItem(KEYS.suiviExport);
      if (raw === null || raw === undefined) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((x) => text(x)).filter(Boolean) : null;
    } catch (_) { return null; }
  }

  function byName(a, b) { return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }); }

  function listIngredients(storage) {
    return readArray(storage, KEYS.ingredients).map(toIngredient).filter(Boolean).sort(byName);
  }
  function listRecipes(storage) {
    const ingredients = readArray(storage, KEYS.ingredients).map(toCalcIngredient).filter(Boolean);
    const selection = readExportSelection(storage);
    return readArray(storage, KEYS.recipes)
      .filter((raw) => !selection || selection.includes(text(raw && pick(raw.id, raw.uuid, raw._id))))
      .map((raw) => toRecipe(raw, ingredients)).filter(Boolean).sort(byName);
  }

  /* Recherche sans accents ni casse ; « commence par » avant « contient ». */
  function search(list, query, limit) {
    const q = fold(query);
    if (!q) return [];
    const starts = [], contains = [];
    list.forEach((item) => {
      const n = fold(item.name);
      if (n.startsWith(q)) starts.push(item);
      else if (n.includes(q)) contains.push(item);
    });
    return starts.concat(contains).slice(0, limit || 8);
  }

  function browserStorage() {
    try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; }
  }

  /* v25.4 : recettes retirées par l'ancienne corbeille de Suivi (v25.1), par profil. Lecture seule,
     pour qu'une recette retirée ne revienne pas. */
  function readHiddenRecipes(storage) {
    try {
      const profile = (storage && storage.getItem('secheapp.activeProfile.v1')) || 'default';
      const parsed = JSON.parse((storage && storage.getItem(`secheapp.${profile}.hiddenNutriRecipes.v1`)) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  }
  function listSuiviRecipes(storage) {
    return visibleRecipes(listRecipes(storage), readHiddenRecipes(storage));
  }

  /* ---------------------------------------------------------------------------------------
     Interface : recherche d'ingrédients dans « L'étiquette » (v25.0, généralisée en v25.4).
     Ingrédient NutriApp → nom + valeurs /100 g ; curseur sur le poids.
     Chaque champ n'apparaît que s'il y a des données NutriApp correspondantes sur l'appareil.
     --------------------------------------------------------------------------------------- */
  const SEARCHES = [
    {
      box: 'nutriSearchBox', input: 'nutriSearch', results: 'nutriResults',
      list: listIngredients,
      meta: (item) => `${item.k100} kcal / 100 g`,
      empty: 'Aucun ingrédient NutriApp sous ce nom.',
      fill: { mealName: 'name', qKcal100: 'k100', qP100: 'p100', qC100: 'c100', qF100: 'f100' },
      focus: 'qWeight'
    },
    /* v25.5 : les recettes sont proposées dans « Ce que tu as mangé » (phase6-meal-suggest.js). */
  ];

  function installSearch(doc, cfg) {
    const box = doc.getElementById(cfg.box);
    const input = doc.getElementById(cfg.input);
    const results = doc.getElementById(cfg.results);
    if (!box || !input || !results || box.dataset.ready === '1') return;
    box.dataset.ready = '1';
    let current = [];
    const close = () => { results.textContent = ''; results.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    const pickItem = (item) => {
      if (!item) return;
      Object.entries(cfg.fill).forEach(([id, field]) => { const el = doc.getElementById(id); if (el) el.value = String(item[field]); });
      input.value = '';
      close();
      doc.getElementById(cfg.focus)?.focus();
    };
    const render = () => {
      current = search(cfg.list(browserStorage()), input.value, 8);
      results.textContent = '';
      current.forEach((item, index) => {
        const li = doc.createElement('li');
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'nutriResult';
        btn.dataset.nutriIndex = String(index);
        btn.setAttribute('role', 'option');
        const strong = doc.createElement('strong'); strong.textContent = item.name;
        const small = doc.createElement('small'); small.textContent = cfg.meta(item);
        btn.append(strong, small);
        li.appendChild(btn);
        results.appendChild(li);
      });
      if (!current.length && text(input.value)) {
        const li = doc.createElement('li');
        li.className = 'nutriResults__empty muted';
        li.textContent = cfg.empty;
        results.appendChild(li);
      }
      results.hidden = !results.children.length;
      input.setAttribute('aria-expanded', String(!results.hidden));
    };
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') { e.preventDefault(); pickItem(current[0]); }
    });
    results.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-nutri-index]');
      if (btn) pickItem(current[Number(btn.dataset.nutriIndex)]);
    });
    doc.addEventListener('click', (e) => { if (!box.contains(e.target)) close(); });
  }
  /* Sans donnée NutriApp correspondante sur cet appareil, le champ n'apparaît pas. */
  function syncSearches(doc) {
    SEARCHES.forEach((cfg) => {
      const box = doc.getElementById(cfg.box);
      if (box) box.hidden = cfg.list(browserStorage()).length === 0;
    });
  }
  function syncIngredientSearch(doc) { syncSearches(doc); } /* nom conservé (v25.0) */

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const start = () => { SEARCHES.forEach((cfg) => installSearch(document, cfg)); syncSearches(document); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
    /* NutriApp ouverte dans un autre onglet : le navigateur signale ses écritures. */
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.startsWith('nutriapp.') || /hiddenNutriRecipes/.test(e.key)) syncSearches(document);
    });
  }

  /* v25.1 : une recette retirée revient quand NutriApp la modifie après le retrait. Pure. */
  function visibleRecipes(recipes, hidden) {
    const map = hidden && typeof hidden === 'object' ? hidden : {};
    return (recipes || []).filter((r) => !map[r.key] || (r.updatedAt && r.updatedAt > String(map[r.key])));
  }

  return { KEYS, toIngredient, toCalcIngredient, toRecipe, readExportSelection, readHiddenRecipes, listIngredients, listRecipes, listSuiviRecipes, visibleRecipes, search, syncIngredientSearch, syncSearches };
});
