/* v25.5 — Suggestions dans « Ce que tu as mangé » (ordinateur et téléphone).
   En tapant au moins 2 lettres, on te propose :
   - tes repas déjà notés (tout l'historique du profil, oubliés exclus) — étiquette « Noté » ;
   - tes recettes NutriApp proposées dans Suivi (une portion) — étiquette « NutriApp ».
   Tout ce qui est proposé remplit l'onglet « Les valeurs ». Les ingrédients restent dans « L'étiquette ».
   Rien n'est choisi tout seul : ce que tu tapes reste tel quel si tu ignores la liste.
   Si une recette et un repas noté portent le même nom, seule la recette est proposée (décision 2026-11-03).
   Lecture seule : aucune écriture dans le stockage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SuiviMealSuggest = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const MAX = 6;
  function text(v) { return v === undefined || v === null ? '' : String(v).trim(); }
  function fold(s) { return text(s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  /* Pure : fusionne habitudes et recettes, dédoublonne par nom (la recette gagne), classe :
     début du nom, puis début d'un mot, puis ailleurs dans le nom ; à égalité, ordre d'origine. */
  function suggest(habits, recipes, query, limit) {
    const q = fold(query);
    if (q.length < 2) return [];
    const recipeNames = new Set((recipes || []).map((r) => fold(r.name)));
    const pool = []
      .concat((habits || []).filter((h) => !recipeNames.has(fold(h.name))).map((x) => ({ kind: 'noted', x })))
      .concat((recipes || []).map((x) => ({ kind: 'recipe', x })));
    const scored = [];
    pool.forEach((item, order) => {
      const n = fold(item.x.name);
      let score = -1;
      if (n.startsWith(q)) score = 0;
      else if (n.split(/[\s'’\-]+/).some((w) => w.startsWith(q))) score = 1;
      else if (n.includes(q)) score = 2;
      if (score >= 0) scored.push({ ...item, score, order });
    });
    return scored.sort((a, b) => a.score - b.score || a.order - b.order).slice(0, limit || MAX);
  }

  function sources(global) {
    let habits = [];
    let recipes = [];
    try { habits = global.SuiviHabits?.list(Infinity) || []; } catch (_) { habits = []; }
    try { recipes = global.SuiviNutriApp?.listSuiviRecipes(global.localStorage) || []; } catch (_) { recipes = []; }
    return { habits, recipes };
  }

  function install(global, doc) {
    const input = doc.getElementById('mealName');
    if (!input || input.dataset.mealSuggest === '1') return;
    input.dataset.mealSuggest = '1';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'mealSuggest');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');
    const list = doc.createElement('ul');
    list.id = 'mealSuggest';
    list.className = 'nutriResults mealSuggest';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Repas proposés');
    list.hidden = true;
    let cache = null;
    let current = [];
    let active = -1;

    /* La liste suit le champ : sur téléphone, il vit dans la cellule combinée (corbeille + ▾). */
    const place = () => {
      const anchor = input.closest('.mobileDailyRecentMeals__field') || input;
      if (anchor.nextElementSibling !== list) anchor.insertAdjacentElement('afterend', list);
    };
    const close = () => { list.hidden = true; list.textContent = ''; active = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
    const pick = (item) => {
      if (!item) return;
      const v = item.x;
      const set = (id, value) => { const el = doc.getElementById(id); if (el) el.value = String(value); };
      set('mealName', v.name); set('mealK', v.k); set('mealP', v.p); set('mealC', v.c); set('mealF', v.f);
      doc.getElementById('mealModeManual')?.click();
      close();
      input.dispatchEvent(new Event('change', { bubbles: true })); /* corbeille, etc. */
      doc.getElementById('btnAddMeal')?.focus({ preventScroll: true });
    };
    const highlight = () => {
      [...list.querySelectorAll('[role="option"]')].forEach((el, i) => {
        el.classList.toggle('is-active', i === active);
        el.setAttribute('aria-selected', String(i === active));
      });
      if (active >= 0) input.setAttribute('aria-activedescendant', `mealSuggest-${active}`);
      else input.removeAttribute('aria-activedescendant');
    };
    const render = () => {
      if (!cache) cache = sources(global);
      current = suggest(cache.habits, cache.recipes, input.value, MAX);
      active = -1;
      list.textContent = '';
      if (!current.length) { close(); return; }
      current.forEach((item, i) => {
        const li = doc.createElement('li');
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.id = `mealSuggest-${i}`;
        btn.className = 'nutriResult mealSuggest__item';
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', 'false');
        btn.dataset.suggestIndex = String(i);
        const tag = doc.createElement('span');
        tag.className = `mealSuggest__tag mealSuggest__tag--${item.kind}`;
        tag.textContent = item.kind === 'recipe' ? 'NutriApp' : 'Noté';
        const name = doc.createElement('strong'); name.textContent = item.x.name;
        const kcal = doc.createElement('small');
        kcal.textContent = item.kind === 'recipe' ? `${Math.round(item.x.k)} kcal / portion` : `${Math.round(item.x.k)} kcal`;
        btn.append(tag, name, kcal);
        li.appendChild(btn);
        list.appendChild(li);
      });
      place();
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };

    input.addEventListener('focus', () => { cache = null; });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (list.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % current.length; highlight(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + current.length) % current.length; highlight(); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(current[active]); } /* pas de choix sans sélection */
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault()); /* garde le focus dans le champ */
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-suggest-index]');
      if (btn) pick(current[Number(btn.dataset.suggestIndex)]);
    });
    doc.addEventListener('click', (e) => { if (e.target !== input && !list.contains(e.target)) close(); });
    /* Une note ajoutée, un profil changé, NutriApp modifiée ailleurs : on relira les sources. */
    global.addEventListener('storage', () => { cache = null; });
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const start = () => install(window, document);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }

  return { suggest, fold };
});
