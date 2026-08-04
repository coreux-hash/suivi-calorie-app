# Consolidation des états et de la navigation — rapport QA

Base exclusive : `SuiviCalorieApp_historique_guide_harmonise_2026-08-04(1).zip`
Date de validation : 2026-08-04

## Diagnostic préalable

1. **Sources de vérité initiales.** La configuration était principalement calculée dans `phase6GetSetupState()` (`legacy-app-init.js`) ; la charge sportive et énergétique dans `legacy-training-load-matrix.js` ; la destination initiale dans `initTabs()` après appel de `phase6GetInitialEntryTarget()` ; la disponibilité de navigation dans `phase6GetShellAvailabilityMap()` (`legacy-shell-observers.js`).
2. **Duplications.** Les conditions `(minutes > 0) || energyLoad.complete`, les maps de disponibilité, les correspondances clé → panneau, les listes d’identifiants et certains handlers desktop/mobile étaient répétés. La présence d’une tuile et sa disponibilité pouvaient donc diverger.
3. **Fichiers concernés.** `index.html`, `legacy-app-init.js`, `legacy-shell-observers.js`, `legacy-training-load-matrix.js`, `legacy-compromise-ui.js`, `legacy-profiles-settings.js`, plus un fichier central, des tests et une correction CSS ciblée.
4. **Architecture cible minimale.** Un script legacy compatible navigateur et Node expose des fonctions pures et un registre déclaratif ; les adaptateurs DOM/stockage existants collectent les entrées et les consommateurs ne recalculent plus les règles.
5. **Risques identifiés.** Confondre `L0` avec l’absence de sport, accepter `D 6/7`, désactiver Compromis lorsqu’il est requis, faire hériter un compromis du profil précédent, écrire une journée au changement de date/profil, ou désynchroniser desktop/mobile et les deux pastilles.

## Cartographie des cinq états — avant

| État | Calcul et données | Consommateurs / variantes | Effets de bord et comportement à préserver |
|---|---|---|---|
| `configurationComplete` | `phase6GetSetupState()` assemblait quatre fonctions locales dans `legacy-app-init.js`. Entrées lues depuis le DOM, puis le stockage : sexe, âge, taille, poids, marque, `montre`, `dietMode`, `compromiseId`. Le compromis était seulement testé comme chaîne non vide. | Routage, métadonnées d’accès, `data-ready`, statuts `prêt/requis`, compteurs et état global. La migration du compromis vivait séparément dans `legacy-profiles-settings.js` / `legacy-compromise-ui.js`. | Les lectures DOM/stockage n’écrivaient pas. Conserver les quatre sections et leurs compteurs, mais valider le compromis contre la liste réellement disponible. |
| `sportLoadAvailable` | Pas de valeur nommée. Deux expressions locales utilisaient `state.minutes > 0`. `minutes` vient des sessions sport de la fenêtre `[date pilotée − 6 jours, date pilotée]`. | Statut Charge de Réglages et visibilité des deux pastilles. Le niveau `L0…L4` était calculé séparément à partir des heures. | Aucune écriture. Préserver la fenêtre de sept jours et distinguer une durée positive donnant éventuellement `L0` de l’absence de donnée sportive. |
| `energyLoadComplete` | `validDays === 7` dans `getWeeklyEnergyLoad()`. Chaque jour doit exister dans la fenêtre, ne pas avoir `energyExplicit === false`, et avoir une dépense (`montreAdjusted` ou `montreRaw`) et un BMR strictement positifs. | Calcul de `D`, combinaison, libellés, statut Charge et pastilles via `energyLoad.complete`. | Aucun `D0…D4` avant 7/7. Les valeurs absentes restent distinctes de zéro et la distinction dépense automatique / explicite est conservée telle quelle. |
| `loadAvailable` | Pas de valeur nommée commune ; deux duplications de `(minutes > 0) || energyLoad.complete`. | `data-ready` de la tuile Charge et `data-onboarding-visible` des deux pastilles. | Aucune écriture. Visibilité des pastilles = négation exacte de la disponibilité. |
| `initialDestination` | `phase6GetInitialEntryTarget()` retournait `phase6GetSetupState().entryTarget`; `initTabs()` l’appelait après chargement du profil. Identifiants internes : `today` = Pilotage, `settings` = Réglages. | `initTabs()` et les redirections après acceptation des conditions. | `setActiveTab()` déclenche les effets visuels normaux de navigation, sans sauvegarde de journée. Conserver Pilotage si complet, Réglages sinon, après hydratation/migration. |

## Cartographie des cinq états — après

Source unique : `js/legacy/legacy-app-state-navigation.js`.

| État | Fonction de référence | Entrées explicites | Consommateurs raccordés |
|---|---|---|---|
| `configurationComplete` | `computeConfigurationState(input)` | Valeurs de profil, montre, objectif, `compromiseId`, `validCompromiseIds` | Routage, statuts, compteurs, données `ready/missing`, pastille Sport de Réglages via l’état Charge séparé |
| `sportLoadAvailable` | `computeSportLoadAvailable({ sportMinutes })` | Total de minutes dans la fenêtre métier existante | `availability` de la matrice, statut Charge, deux pastilles |
| `energyLoadComplete` | `computeEnergyLoadComplete({ energyValidDays, energyRequiredDays })` | Nombre de jours énergétiques valides ; constante requise 7 | `getWeeklyEnergyLoad()`, calcul de `D`, disponibilité et pastilles |
| `loadAvailable` | `computeLoadAvailability(input)` | Disponibilités sport et énergie dérivées des entrées précédentes | Tuile Charge et les deux pastilles via `showLoadNudge` |
| `initialDestination` | `computeInitialDestination({ configurationComplete })` | Booléen central, après adaptation DOM/stockage | `phase6GetInitialEntryTarget()`, déverrouillage et `initTabs()` |

Les fonctions sont sans accès DOM, stockage ou effet de bord. `phase6CollectConfigurationInput()` est l’adaptateur séparé. Le moteur conserve ses fonctions `getWeeklySportMinutes()`, `getWeeklyEnergyLoad()` et `combineSportAndEnergyLoad()` : les formules de `L`, `D` et `max(L,D)` ne sont pas réécrites.

## Navigation — audit avant

- Quicknavs desktop : handlers et fonctions clé → cible dans `legacy-app-init.js`.
- Navigation mobile : mêmes attributs de données, plus des proxys Today bouton mobile → bouton desktop.
- Disponibilité : grande map imbriquée `phase6GetShellAvailabilityMap()` dans `legacy-shell-observers.js`.
- Synchronisation : maps supplémentaires Journal, Réglages et Historique, puis une liste séparée de couples identifiant/section/clé.
- Changements d’espace et défilement : fonctions dédiées `phase2Goto*`, branches History et delegates vers d’autres boutons.
- Accès transverses `*` : branches Today → Journal/Réglages et Historique → Journal.
- Pastilles : deux identifiants reliés à une fonction commune, qui ouvrait Historique puis simulait un clic Calendrier.
- Désactivation : `disabled`, `aria-disabled`, `tabIndex`, classe `is-disabled` appliqués par une fonction commune, mais alimentés par les maps dispersées.

## Registre unique après

`NAVIGATION_ENTRIES` contient 24 entrées : 5 Réglages, 7 Pilotage, 5 Journal, 6 Historique et 1 destination partagée par les pastilles.

```js
{
  key,
  sourceSpace,
  destinationSpace,
  targetSelectors,
  desktopSelector,
  mobileSelector,
  controlSelectors,
  availability,          // always | sport | expert | diabetes
  behavior,              // scroll | open-and-scroll
  crossSpace,
  track,
  panelSelector,
  hidePanelWhenUnavailable,
  requiresVisibleTarget
}
```

Seules les propriétés utiles à chaque entrée sont renseignées. `getNavigationEntries()`, `getEntrySelectors()` et `isNavigationEntryAvailable()` alimentent maintenant les handlers, la désactivation accessible, les panneaux masqués et le suivi de section active. Desktop et mobile consomment la même entrée. `settings:compromise` a explicitement `availability: "always"` : `requis` n’implique jamais `disabled`. Les accès `crossSpace` conservent l’astérisque et leur destination. Les deux pastilles distinctes consomment `shared:load-calendar`, qui ouvre directement Historique et cible le calendrier, sans modale ni clic intermédiaire.

## Duplications supprimées

- quatre calculateurs locaux de readiness et leur agrégateur ;
- deux expressions locales de disponibilité de charge ;
- `phase6GetShellAvailabilityMap()` et `phase6MatchesMinimumMode()` ;
- maps Journal, Réglages et Historique de disponibilité/cible ;
- liste séparée des boutons à désactiver ;
- fonctions `phase6GetSettingsJumpTarget()`, `phase6GetJournalJumpTarget()`, `phase6GetHistoryJumpTarget()` et le delegate History ;
- proxys de navigation mobile Today ;
- handlers Today et helpers `phase2Goto*` dupliqués dans le shell ;
- branche qui remappait un `compromiseId` explicitement vide lors d’un changement de profil.

## Fichiers modifiés, ajoutés et supprimés

### Modifiés

- `index.html`
- `css/screens/flowviz.css`
- `js/legacy/legacy-app-init.js`
- `js/legacy/legacy-compromise-ui.js`
- `js/legacy/legacy-profiles-settings.js`
- `js/legacy/legacy-shell-observers.js`
- `js/legacy/legacy-training-load-matrix.js`

### Ajoutés

- `js/legacy/legacy-app-state-navigation.js`
- `tests/app-state-navigation.test.cjs`
- `tests/browser-non-regression.cjs`
- `tests/structure.test.cjs`
- `QA_ARCHITECTURE_REPORT.md`

### Supprimés

- Aucun.

## Tests automatisés

Commande native, sans dépendance ajoutée :

```bash
node --test tests/*.test.cjs
```

Résultat final : **17 tests réussis, 0 échec**.

Couverture fonctionnelle :

1. nouveau profil incomplet, Réglages, sections requises accessibles ;
2. profil complet, Pilotage (`today`) ;
3. migration exacte et unique du compromis ;
4. ancien profil ambigu/non migrable, aucun compromis inventé ;
5. aucune charge et deux pastilles visibles ;
6. `D 6/7`, aucun niveau D final ;
7. `D 7/7`, niveau D calculé ;
8. sport récent avec niveau `L0`, disponibilité vraie, puis `max(L,D)` ;
9. registre desktop/mobile cohérent, clés uniques, Compromis toujours accessible ;
10. identifiant de compromis inconnu refusé ;
11. syntaxe de tous les scripts JavaScript ;
12. identifiants HTML uniques ;
13. scripts et feuilles de style locaux présents ;
14. accolades CSS équilibrées ;
15. sélecteurs principaux du registre non orphelins ;
16. dépendance distante historique bornée au client Supabase optionnel.
17. accès `Dépense *` déclaré une seule fois, disponible et identique sur desktop/mobile vers Pilotage → Lecture du jour.

QA navigateur :

```bash
node tests/browser-non-regression.cjs
```

Cette commande suppose Playwright/Chromium disponible dans l’environnement de QA. Commande exacte utilisée dans l’environnement de validation :

```bash
FONTCONFIG_PATH=/tmp/fonts XDG_CACHE_HOME=/tmp/font-cache CHROMIUM_EXECUTABLE_PATH=/tmp/chromium node tests/browser-non-regression.cjs
```

Résultat final : **QA navigateur réussie, 0 erreur JavaScript, 0 assertion en échec**. Le script sert l’application locale et bloque volontairement le CDN Supabase : le parcours local reste opérationnel sans réseau.

Assertions navigateur : routage initial, une seule section active, disponibilité réelle de Compromis, absence de débordement horizontal, titres non rognés, états sans charge/sport/`D 6/7`/`D 7/7`, synchronisation des pastilles, clic des deux pastilles vers Historique → Calendrier, absence de modale, parité desktop/mobile, accès transverse vers Réglages, accès `Dépense *` desktop/mobile vers Pilotage → Lecture du jour sans changement de date ni écriture, ouverture et contenu de l’info-dot, changement de profil sans état hérité ni sauvegarde, changement de date sans création de journée ni bascule de `energyExplicit`.

## QA visuelle responsive

Résolutions contrôlées sur Réglages, Pilotage et Historique :

- 360 × 800 ;
- 390 × 844 ;
- 768 × 1024 ;
- 859 × 900 (juste avant le breakpoint 860) ;
- 861 × 900 (juste après) ;
- 1366 × 768 ;
- 1440 × 900.

États dynamiques capturés et inspectés à 390 × 844 : profil incomplet, profil complet sans charge, activité récente, `D 6/7` et `D 7/7`. L’arrivée depuis chacune des deux pastilles a été vérifiée à 390 × 844 et 1366 × 768. L’accès `Dépense *` a été contrôlé sur mobile à 390 × 844 et sur ordinateur à 1366 × 768 ; l’info-dot a été ouverte et inspectée à 390 × 844.

Défauts démontrés et corrigés :

- le titre **Compromis** restait rogné avec Chromium 149 à 360, 768 et 861 px ; correction limitée au padding horizontal responsive et à la typographie jusqu’à 980 px, sans changer la grille, la hauteur métier ou les statuts ;
- un profil possédant explicitement `compromiseId: ""` pouvait récupérer visuellement une correspondance issue des réglages courants ; le remappage est désormais réservé aux anciens profils où la clé est absente et où la correspondance exacte est unique.

Aucun chevauchement, faux grisé, focus invisible, débordement horizontal, pastille désynchronisée, collision de tuile ou défaut isolé de marge/rayon n’a été observé après correction. La sixième tuile complète la grille Historique et l’info-dot reste alignée avec le titre du guide sur toutes les largeurs contrôlées.

## Non-régression explicitement confirmée

- **L** : fenêtre existante de sept jours et seuils `L0…L4` inchangés ; une activité de 30 minutes donnant `L0` reste une source disponible.
- **D** : mêmes dépenses/BMR admissibles, même distinction `energyExplicit`, même exigence stricte 7/7, mêmes seuils `D0…D4`.
- **Combinaison** : `combineSportAndEnergyLoad()` reste fondée sur `Math.max(s, d)` lorsque D existe.
- **Persistance** : aucune sauvegarde lors des changements de date, profil, espace ou rafraîchissement ; test de stockage avant/après réussi.
- **Routage** : décision après hydratation/migration ; profil complet → Pilotage, incomplet → Réglages ; aucune destination concurrente active observée.
- **Pastilles** : état partagé `showLoadNudge`, visibilité synchronisée, deux composants visuels distincts, même destination Historique → Calendrier, aucun intermédiaire.

## Limites restantes

- Aucune ambiguïté métier non résolue. La définition historique d’une preuve sportive exploitable reste une durée cumulée strictement positive ; le niveau calculé peut néanmoins être `L0`.
- Le chargement distant optionnel du client Supabase et les références de favicons absentes étaient déjà présents dans l’archive source. Ils ne bloquent pas l’exécution locale ; la QA a explicitement validé l’application avec le CDN bloqué. Ils n’ont pas été modifiés pour éviter un élargissement de périmètre.
- Le test navigateur est fourni mais Playwright reste un outil de QA externe, non une dépendance d’exécution de l’application.

## Différentiel de la consolidation initiale

**12 fichiers concernés : 7 modifiés, 5 ajoutés, 0 supprimé ; 1 210 lignes ajoutées, 450 supprimées, solde +760 lignes.** La majorité des ajouts correspond au socle de tests (626 lignes), au calcul/registre central (208 lignes) et au présent rapport (193 lignes). Le code legacy existant est globalement réduit dans `legacy-app-init.js` et `legacy-shell-observers.js`.

## Passe Historique — Dépense et aide contextuelle

La version refactorisée sert de référence à cette passe. La tuile `Dépense *` et sa variante mobile consomment l’entrée unique `history:spend`, toujours disponible, vers `today` → `#todayReadingPanel`. L’info-dot est permanente : elle distingue première utilisation et retours sans introduire de nouvel état de persistance.

Différentiel de cette passe : **6 fichiers modifiés, 0 ajouté, 0 supprimé ; 120 lignes ajoutées, 10 supprimées, solde +110 lignes**.
