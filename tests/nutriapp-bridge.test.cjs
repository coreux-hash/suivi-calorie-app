/* v25.0 — Pont NutriApp : fonctions pures (lecture, conversion, recherche). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const N = require('../js/phase6/phase6-nutriapp-bridge.js');

const store = (data) => ({ getItem: (k) => (k in data ? data[k] : null) });

test('ingrédients : champs NutriApp lus dans l’ordre du contrat, entrées vides écartées, tri par nom', () => {
  const list = N.listIngredients(store({ 'nutriapp.ingredients.v2': JSON.stringify([
    { name:'Flocons d’avoine', kcal100:372, p100:13.5, g100:58.7, l100:7 },
    { nom:'Œuf', kcal:143, p:12.6, carbs:0.7, fat:9.5 },
    { name:'Huile d’olive', macros:{ kcal:900, fat:100 } },
    { name:'Vide', kcal:0 },
    { name:'', kcal:100 },
    null
  ]) }));
  assert.deepEqual(list, [
    { name:'Flocons d’avoine', k100:372, p100:13.5, c100:58.7, f100:7 },
    { name:'Huile d’olive', k100:900, p100:0, c100:0, f100:100 },
    { name:'Œuf', k100:143, p100:12.6, c100:0.7, f100:9.5 }
  ]);
});

test('recettes : une portion = somme des lignes / portions ; recette sans macros écartée', () => {
  const list = N.listRecipes(store({ 'nutriapp.recipes.v2': JSON.stringify([
    { name:'Porridge', parts:2, rows:[{ macrosResolved:{ kcal:372, p:13.5, c:58.7, f:7 } }, { macrosResolved:{ kcal:130, p:6.8, c:9.6, f:7.2 } }] },
    { name:'Ancienne', parts:4, rows:[{ qty:100 }] },
    { name:'Soupe', portions:3, rows:[{ kcal:300, p:9, carbs:45, fat:6 }] }
  ]) }));
  assert.deepEqual(list.map(({ key, updatedAt, ...rest }) => rest), [
    { name:'Porridge', parts:2, k:251, p:10.2, c:34.2, f:7.1 },
    { name:'Soupe', parts:3, k:100, p:3, c:15, f:2 }
  ]);
  assert.deepEqual(list.map((r) => r.key), ['name:porridge', 'name:soupe'], 'sans id : clé = nom');
});

test('données absentes ou illisibles : listes vides, aucune exception', () => {
  assert.deepEqual(N.listIngredients(null), []);
  assert.deepEqual(N.listRecipes(store({})), []);
  assert.deepEqual(N.listIngredients(store({ 'nutriapp.ingredients.v2':'pas du json' })), []);
  assert.deepEqual(N.listRecipes(store({ 'nutriapp.recipes.v2':'{"a":1}' })), []);
});

test('recherche : sans accents ni casse, ligatures, « commence par » avant « contient », limite', () => {
  const list = [{ name:'Bœuf haché' }, { name:'Œuf' }, { name:'Pâtes' }, { name:'Pâté' }];
  assert.deepEqual(N.search(list, 'oeuf').map((x) => x.name), ['Œuf', 'Bœuf haché']);
  assert.deepEqual(N.search(list, 'PATE').map((x) => x.name), ['Pâtes', 'Pâté']);
  assert.deepEqual(N.search(list, '  '), []);
  assert.equal(N.search(list, 'e', 2).length, 2);
});

test('lecture seule : aucune écriture dans le stockage depuis le module', () => {
  const src = fs.readFileSync(path.join(__dirname, '../js/phase6/phase6-nutriapp-bridge.js'), 'utf8');
  assert.doesNotMatch(src, /setItem|removeItem|\.clear\(/);
});

test('recette retirée : cachée, puis de retour si NutriApp la modifie après le retrait', () => {
  const [r] = N.listRecipes(store({ 'nutriapp.recipes.v2': JSON.stringify([{ id:'r1', name:'Porridge', parts:1, updatedAt:'2026-11-01T10:00:00.000Z', rows:[{ kcal:300 }] }]) }));
  assert.equal(r.key, 'id:r1');
  assert.equal(r.updatedAt, '2026-11-01T10:00:00.000Z');
  assert.deepEqual(N.visibleRecipes([r], {}), [r]);
  assert.deepEqual(N.visibleRecipes([r], { 'id:r1':'2026-11-02T08:00:00.000Z' }), [], 'retirée après sa dernière modification : cachée');
  assert.deepEqual(N.visibleRecipes([{ ...r, updatedAt:'2026-11-03T09:00:00.000Z' }], { 'id:r1':'2026-11-02T08:00:00.000Z' }).length, 1, 'modifiée ensuite : de retour');
  assert.deepEqual(N.visibleRecipes([{ ...r, updatedAt:'' }], { 'id:r1':'2026-11-02T08:00:00.000Z' }), [], 'sans date de modification : reste cachée');
});
