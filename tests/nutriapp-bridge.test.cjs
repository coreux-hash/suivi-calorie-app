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

test('recettes : recalculées comme NutriApp (ingrédient par id puis nom, unités converties, lignes non résolues ignorées)', () => {
  const ing = [
    { id:'avoine', name:'Flocons d’avoine', kcal100:372, p100:13.5, g100:58.7, l100:7 },
    { id:'lait', name:'Lait', profile:'liquid', allowedUnits:['g', 'ml'], conversions:{ mlWeightG:1.03 }, kcal:47, p:3.4, carbs:4.8, fat:1.6 },
    { id:'oeuf', name:'Œuf', allowedUnits:['g', 'piece'], conversions:{ pieceWeightG:60 }, kcal:143, p:12.6, carbs:0.7, fat:9.5 },
    { id:'sel', name:'Sel', allowedUnits:['g'], kcal:0 }
  ];
  const rec = [
    { id:'r1', name:'Porridge', parts:2, rows:[{ ingredientId:'avoine', qty:100, unit:'g' }, { ingredientName:'LAIT', qty:200, unit:'ml' }] },
    { id:'r2', name:'Omelette', parts:1, rows:[{ ingredientId:'oeuf', qty:2, unit:'piece' }, { ingredientId:'inconnu', qty:10 }, { ingredientId:'sel', qty:2, unit:'tsp' }] },
    { id:'r3', name:'Ancienne', parts:1, rows:[{ macrosResolved:{ kcal:500, p:10, c:60, f:20 } }] },
    { name:'Sans id', parts:1, rows:[{ ingredientId:'avoine', qty:50 }] }
  ];
  const list = N.listRecipes(store({ 'nutriapp.ingredients.v2':JSON.stringify(ing), 'nutriapp.recipes.v2':JSON.stringify(rec) }));
  /* Valeurs de référence relevées dans NutriApp (computeRecipeTotalsFromRows, navigateur) :
     Porridge 234,41 / 10,25 / 34,29 / 5,15 par portion ; Omelette 171,6 / 15,12 / 0,84 / 11,4. */
  assert.deepEqual(list.map((r) => [r.name, r.k, r.p, r.c, r.f]), [
    ['Omelette', 172, 15.1, 0.8, 11.4],
    ['Porridge', 234, 10.3, 34.3, 5.1],
    ['Sans id', 186, 6.8, 29.4, 3.5]
  ], 'Ancienne (aucune ligne calculable, 0 dans NutriApp aussi) écartée');
  assert.deepEqual(list.map((r) => r.key), ['id:r2', 'id:r1', 'name:sans id']);
});

test('sélection « Suivi » cochée dans NutriApp : clé absente = toutes ; présente = uniquement les cochées', () => {
  const data = {
    'nutriapp.ingredients.v2':JSON.stringify([{ id:'a', name:'A', kcal:100 }]),
    'nutriapp.recipes.v2':JSON.stringify([{ id:'r1', name:'Un', rows:[{ ingredientId:'a', qty:100 }] }, { id:'r2', name:'Deux', rows:[{ ingredientId:'a', qty:100 }] }])
  };
  assert.deepEqual(N.listRecipes(store(data)).map((r) => r.name), ['Deux', 'Un']);
  assert.deepEqual(N.listRecipes(store({ ...data, 'nutriapp.suiviExport.v1':'["r2"]' })).map((r) => r.name), ['Deux']);
  assert.deepEqual(N.listRecipes(store({ ...data, 'nutriapp.suiviExport.v1':'[]' })), []);
  assert.deepEqual(N.listRecipes(store({ ...data, 'nutriapp.suiviExport.v1':'illisible' })).map((r) => r.name), ['Deux', 'Un'], 'clé illisible = comme absente');
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
  const [r] = N.listRecipes(store({ 'nutriapp.ingredients.v2':JSON.stringify([{ id:'a', name:'A', kcal:300 }]), 'nutriapp.recipes.v2': JSON.stringify([{ id:'r1', name:'Porridge', parts:1, updatedAt:'2026-11-01T10:00:00.000Z', rows:[{ ingredientId:'a', qty:100 }] }]) }));
  assert.equal(r.key, 'id:r1');
  assert.equal(r.updatedAt, '2026-11-01T10:00:00.000Z');
  assert.deepEqual(N.visibleRecipes([r], {}), [r]);
  assert.deepEqual(N.visibleRecipes([r], { 'id:r1':'2026-11-02T08:00:00.000Z' }), [], 'retirée après sa dernière modification : cachée');
  assert.deepEqual(N.visibleRecipes([{ ...r, updatedAt:'2026-11-03T09:00:00.000Z' }], { 'id:r1':'2026-11-02T08:00:00.000Z' }).length, 1, 'modifiée ensuite : de retour');
  assert.deepEqual(N.visibleRecipes([{ ...r, updatedAt:'' }], { 'id:r1':'2026-11-02T08:00:00.000Z' }), [], 'sans date de modification : reste cachée');
});

test('v25.4 : recettes proposées dans Suivi = sélection NutriApp moins les retraits faits avant v25.4 (par profil)', () => {
  const data = {
    'secheapp.activeProfile.v1':'alpha',
    'secheapp.alpha.hiddenNutriRecipes.v1':JSON.stringify({ 'id:r1':'2026-11-02T08:00:00.000Z' }),
    'nutriapp.ingredients.v2':JSON.stringify([{ id:'a', name:'A', kcal:100 }]),
    'nutriapp.recipes.v2':JSON.stringify([{ id:'r1', name:'Un', rows:[{ ingredientId:'a', qty:100 }] }, { id:'r2', name:'Deux', rows:[{ ingredientId:'a', qty:100 }] }])
  };
  assert.deepEqual(N.readHiddenRecipes(store(data)), { 'id:r1':'2026-11-02T08:00:00.000Z' });
  assert.deepEqual(N.listSuiviRecipes(store(data)).map((r) => r.name), ['Deux']);
  assert.deepEqual(N.listSuiviRecipes(store({ ...data, 'secheapp.activeProfile.v1':'beta' })).map((r) => r.name), ['Deux', 'Un'], 'autre profil : rien de retiré');
  assert.deepEqual(N.readHiddenRecipes(store({ 'secheapp.default.hiddenNutriRecipes.v1':'illisible' })), {});
});
