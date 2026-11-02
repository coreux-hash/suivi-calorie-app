/* v25.0 — Pont NutriApp (lecture seule).
   NutriApp et SuiviCalorieApp sont servies depuis la même origine (coreux-hash.github.io) :
   le stockage local est partagé. On lit uniquement `nutriapp.ingredients.v2` et
   `nutriapp.recipes.v2` ; on n'écrit JAMAIS dans les clés `nutriapp.*`.
   Les fonctions de calcul sont pures (entrée explicite, sortie explicite) et testables sous Node.
   Les champs lus suivent l'ordre de `normalizeIngredient` / `normalizeRecipeRow` de NutriApp
   (assets/js/core/04-data-contracts-and-state.js). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SuiviNutriApp = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const KEYS = Object.freeze({ ingredients: 'nutriapp.ingredients.v2', recipes: 'nutriapp.recipes.v2' });

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

  /* Recette NutriApp → valeurs pour UNE portion = somme des lignes (macros déjà calculées par
     NutriApp, `macrosResolved`) / nombre de portions. Écarte une recette dont le total est nul. */
  function toRecipe(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = text(pick(raw.name, raw.nom, raw.title));
    if (!name) return null;
    const parts = Math.max(1, Math.min(999, Math.round(num(pick(raw.parts, raw.portions, raw.recipePortions, 1)) || 1)));
    const total = { k: 0, p: 0, c: 0, f: 0 };
    (Array.isArray(raw.rows) ? raw.rows : []).forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const m = row.macrosResolved && typeof row.macrosResolved === 'object' ? row.macrosResolved
        : (row.macros && typeof row.macros === 'object' ? row.macros : {});
      total.k += num(pick(m.kcal, row.kcal));
      total.p += num(pick(m.p, row.p));
      total.c += num(pick(m.c, m.carbs, row.c, row.carbs));
      total.f += num(pick(m.f, m.fat, row.f, row.fat));
    });
    if (!(total.k || total.p || total.c || total.f)) return null;
    return { name, parts, k: round(total.k / parts, 0), p: round(total.p / parts, 1), c: round(total.c / parts, 1), f: round(total.f / parts, 1) };
  }

  function byName(a, b) { return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }); }

  function listIngredients(storage) {
    return readArray(storage, KEYS.ingredients).map(toIngredient).filter(Boolean).sort(byName);
  }
  function listRecipes(storage) {
    return readArray(storage, KEYS.recipes).map(toRecipe).filter(Boolean).sort(byName);
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

  /* ---------------------------------------------------------------------------------------
     Interface : recherche d'ingrédients dans l'onglet « L'étiquette » (desktop et mobile).
     Choisir un ingrédient remplit le nom du repas et les valeurs /100 g, puis place le curseur
     sur le poids. L'ajout reste celui de « Calculer et ajouter » (chemin legacy inchangé).
     --------------------------------------------------------------------------------------- */
  function installIngredientSearch(doc) {
    const box = doc.getElementById('nutriSearchBox');
    const input = doc.getElementById('nutriSearch');
    const results = doc.getElementById('nutriResults');
    if (!box || !input || !results || box.dataset.ready === '1') return;
    box.dataset.ready = '1';
    let current = [];
    const close = () => { results.textContent = ''; results.hidden = true; input.setAttribute('aria-expanded', 'false'); };
    const pickItem = (item) => {
      if (!item) return;
      const set = (id, v) => { const el = doc.getElementById(id); if (el) el.value = String(v); };
      set('mealName', item.name);
      set('qKcal100', item.k100); set('qP100', item.p100); set('qC100', item.c100); set('qF100', item.f100);
      input.value = '';
      close();
      doc.getElementById('qWeight')?.focus();
    };
    const render = () => {
      current = search(listIngredients(browserStorage()), input.value, 8);
      results.textContent = '';
      current.forEach((item, index) => {
        const li = doc.createElement('li');
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'nutriResult';
        btn.dataset.nutriIndex = String(index);
        btn.setAttribute('role', 'option');
        const strong = doc.createElement('strong'); strong.textContent = item.name;
        const small = doc.createElement('small'); small.textContent = `${item.k100} kcal / 100 g`;
        btn.append(strong, small);
        li.appendChild(btn);
        results.appendChild(li);
      });
      if (!current.length && text(input.value)) {
        const li = doc.createElement('li');
        li.className = 'nutriResults__empty muted';
        li.textContent = 'Rien dans NutriApp sous ce nom.';
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
    syncIngredientSearch(doc);
  }
  /* Sans ingrédient NutriApp sur cet appareil, le champ n'apparaît pas. */
  function syncIngredientSearch(doc) {
    const box = doc.getElementById('nutriSearchBox');
    if (!box) return;
    box.hidden = listIngredients(browserStorage()).length === 0;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const start = () => installIngredientSearch(document);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
    /* NutriApp ouverte dans un autre onglet : le navigateur signale ses écritures. */
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.startsWith('nutriapp.')) syncIngredientSearch(document);
    });
  }

  return { KEYS, toIngredient, toRecipe, listIngredients, listRecipes, search, syncIngredientSearch };
});
