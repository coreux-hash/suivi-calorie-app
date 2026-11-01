# Passation — correction v23.3 : menu burger et tiroir Contexte (2026-11-01)

## État du dossier
Dossier = **v23.3** (v23.2 + cette correction, écrite en place). Précédente passation : `PASSATION_v23.2_2026-11-01.md`. À repousser sur GitHub Pages pour être visible sur le téléphone.

## Retour utilisateur traité
1. Menu burger → « Réglages » : le menu restait ouvert (les autres entrées se fermaient).
2. Tiroir « Contexte » difficile à fermer.

## Causes vérifiées
1. `phase6-mobile-daily.js`, écouteur `[data-mobile-menu-view]` : `setView('settings')` passe par `setActiveTab()`, qui ferme déjà le menu (`legacy-core-runtime.js` l.459). Le code appelait ensuite `menuBtn.click()` pour fermer → `toggleMenu()` → **réouverture**. Trace au runtime : `openMenu ← toggleMenu ← menuBtn click`.
2. Le tiroir n'avait qu'un seul contrôle : la languette latérale fine (`#mobileDailyContextBtn`), qui fait toggle.

## Modifications
- `js/phase6/phase6-mobile-daily.js`
  - menu : remplacement de `menuBtn.click()` par `closeMenu()` (wrapper legacy global).
  - tiroir : bouton `.mobileDailyDrawerClose` (✕, 36 px, `aria-label` « Fermer le contexte ») en tête du tiroir ; fermeture au tap/clic en dehors du tiroir et de la languette (écouteur `document`, actif seulement si le tiroir est ouvert).
- `css/screens/mobile-daily.css` : style de la croix, dans le bloc `.phase5StatusBar--drawer` (mobile uniquement).
- `tests/mobile-daily-surface.cjs` : groupe « Menu → Réglages ferme le menu ; tiroir : croix et tap extérieur ».

## Contrôles exécutés
`node --check` OK ; CSS équilibré (254/254) ; 11/11 · 12/12 · 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` **11/11** ; capture 390 px du tiroir ouvert avec la croix ; débordement 0 px ; relecture octet pour octet après écriture.

## Points remontés mais NON traités (décisions à prendre)
- **Chaîne des kcal illisible** (observé sur les captures de M. Colin, mode Simple, montre « Personnalisé ») : saisi 4000 → retenu 3200 (« Prudent », incertitude 20 %) → cible 2944 (92 %) → consommé 400 → reste 2544 ; l'Historique affiche « −2544 vs cible » (consommé − cible), même chiffre que le reste mais présenté comme un écart négatif. Quatre nombres différents pour une seule saisie. Propositions à trancher : (a) sur la carte Dépense mobile, afficher explicitement « Montre 4000 · retenue 3200 (prudence −20 %) » ; (b) ajouter « cible 2944 » dans l'en-tête à côté du reste ; (c) décider si la marge de prudence a un sens quand la marque est « Personnalisé » (saisie manuelle) — c'est un réglage moteur, hors correction locale ; (d) le libellé « vs cible » est un composant partagé desktop (`legacy-history.js` l.280) : à relibeller seulement si décision explicite.
- **Repas récents, attente différente** : M. Colin s'attendait à ce que retaper un nom déjà utilisé préremplisse les valeurs. Le mécanisme livré en v23.2 est une rangée « Récents » en tête de la carte Repas (ajout en 1 tap), pas un préremplissage par nom. Deux hypothèses : v23.2 pas encore poussée sur GitHub (le bloc n'apparaissait donc pas), ou bloc vu mais attente d'un autocomplétion. Proposition complémentaire possible : quand le nom tapé correspond à un repas récent et que les 4 champs sont à 0, préremplir les champs (sans ajouter). À valider.
