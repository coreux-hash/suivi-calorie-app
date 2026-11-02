# Passation — v24.0 : vocabulaire, passe 1 (arrivée, Mon cadre, noms des espaces) — 2026-11-02

## État du dossier
Dossier = **v24.0** (v23.5 + cette passe, écrite en place). Précédente passation : `PASSATION_v23.5_2026-11-01.md`. À déposer sur GitHub **dans les sous-dossiers** (voir liste des fichiers).

## Décisions validées par M. Colin (2026-11-02)
Lexique validé en bloc ; **tutoiement** partout ; **les quatre espaces sont renommés à l'affichage** : Pilotage → **Aujourd'hui**, Journal → **Noter**, Historique → **Relire**, Réglages → **Mon cadre**. L'architecture (`data-tab`, ids, registre de navigation, destinations) ne change pas ; seuls les mots affichés changent.

## Périmètre de cette passe
1. Les quatre noms d'espaces partout où ils sont lus : menu, onglets, titres, pastilles (« Mon cadre * »), textes d'aide, attributs `aria-label`/`title`/`data-modaltext`, barre de statut (JS), messages d'accès (JS), guides desktop (« Comment ça marche ? », « Comprendre l'application ») — substitution des noms et des phrases qui les portent, sans réécriture complète de ces guides (réservée à la passe desktop).
2. Première ouverture : modale « Avant de commencer » (ex-Conditions d'accès) réécrite en entier.
3. Mon cadre : intro mobile, quatre étapes (**Toi · Ce que tu brûles · Ce que tu vises · Ta façon de manger**), statuts (« encore N choses », « Prêt », « N étapes faites »), panneau Toi (profils, infos, glycémie), panneau Ce que tu brûles (montre, marge de sécurité), panneau Ce que tu vises (titres, libellés, aides statiques), affichage (« Ce que tu veux voir : L'essentiel / + sport et sommeil / Tout »), mini-tutos de Mon cadre ramenés à une phrase sous le préfixe « Comment ça marche — … ».
4. Titres des modales du menu alignés (Avant de commencer, Sauvegarder / synchroniser, Aide et mots-clés, Comment utiliser cet écran).

**Hors de cette passe** (passes suivantes) : Aujourd'hui (mobile et desktop), Noter, Relire, les textes dynamiques de « Ce que tu vises » produits par `legacy-compromise-ui.js` (fiches, tableau, « Aucun compromis actif », niveaux de charge), les guides desktop en prose, les teasers « Visible avec l'affichage… » (seule la phrase a été alignée), le lexique de la modale Aide.

## Liste complète avant → après
`RELECTURE_v24.0_avant_apres.md` (218 lignes, générée par comparaison des textes visibles de `index.html`). C'est le support du temps 3 : corrige directement dans ce fichier ce qui ne sonne pas juste, je reporte.

## Points techniques importants (à lire avant toute passe suivante)
Trois mécanismes **reposaient sur du texte visible** et auraient cassé en silence :
- `legacy-shell-observers.js` `phase3SplitSettingsWatch()` trouvait la carte Montre par son titre exact « Ma dépense du jour (montre) » → remplacé par une ancre structurelle : la `.card` qui contient `#watchBrand` (`closest`). Première tentative avec `querySelector` sur chaque carte attrapait la carte englobante et déplaçait tout le panneau Toi — corrigé, couvert par la suite mobile.
- `phase6-mobile-daily.js` `portMobileSetupContext()` : même titre + regex « Profil de la montre » → ancres `#watchBrand` / `#watchProfileInfo`.
- Les mini-tutos sont collectés par préfixe de titre (`/^Mini-tuto/`) et classés par mots-clés (Profil, Dépense, Objectif, « Charge d'activité et compromis »…) pour la modale « Comment utiliser cet écran ». Le préfixe « Comment ça marche — » est désormais accepté à côté de « Mini-tuto — », et « Sport et objectif » ajouté aux mots-clés. **Les autres mini-tutos (Repas, Synthèse, Historique…) gardent leur préfixe « Mini-tuto » jusqu'à leur passe** : à renommer avec un mot-clé reconnu.
- Tests cités : `browser-non-regression.cjs` (« Relire → Calendrier »), `mobile-daily-structure.test.cjs` (« Changer mon cadre », « Aide pour démarrer »), `structure.test.cjs` (« Pour comprendre »), `mobile-daily-surface.cjs` (libellés Montre, chaîne Dépense). Mis à jour.

## Fichiers touchés
`index.html` · `js/legacy/legacy-shell-observers.js` · `js/legacy/legacy-app-init.js` · `js/legacy/legacy-history.js` · `js/phase6/phase6-mobile-daily.js` · `tests/browser-non-regression.cjs` · `tests/mobile-daily-structure.test.cjs` · `tests/mobile-daily-surface.cjs` · `tests/structure.test.cjs` · `RELECTURE_v24.0_avant_apres.md` (nouveau) · cette passation.
Aucun `id`, `class`, `data-*`, `value` d'option, clé de stockage ni calcul modifié. Le CSS n'est pas touché.

## Contrôles exécutés
`node --check` OK ; 0 id dupliqué ; 11/11 · 12/12 · 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` 13/13 ; débordement 0 px à 390 (premier lancement, Mon cadre, menu) ; captures contrôlées : modale Avant de commencer, Mon cadre (Toi, Ce que tu brûles, Ce que tu vises), menu mobile, menu et Mon cadre desktop ; relecture octet pour octet après écriture.

## Pont NutriApp (préparé, non implémenté)
Dépôt public `coreux-hash/nutri-app` lu (commit du 12/08). Même origine `coreux-hash.github.io` → **localStorage partagé**. Clé : `nutriapp.ingredients.v2` (tableau d'aliments ; champs `name`, `kcal100`, `p100`, `g100`, `l100`, avec alias `kcal/p/carbs/fat` et anciens noms tolérés par `normalizeIngredient()` dans `assets/js/features/recipes/03-store-runtime.js`) ; recettes sous `nutriapp.recipes.v2`. Conception prévue : dans la carte Repas, un champ « Chercher un aliment » qui remplit les champs /100 g de l'onglet Rapide ; le poids et le calcul existent déjà. Lecture seule, aucune écriture dans les clés de NutriApp.

## Suite
Passe 2 : Aujourd'hui (mobile puis desktop) + Noter. Passe 3 : Relire + textes dynamiques de Ce que tu vises. Passe 4 : guides desktop et Aide. Puis pont NutriApp.
