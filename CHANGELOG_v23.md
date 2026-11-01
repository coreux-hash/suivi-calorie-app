# v23 — Encodage quotidien simple avec décompte (2026-11-01)

Base : v22 (`SuiviCalorieApp_mobile_quotidien_v22_reglages_accordeon_20260819`). Audit de référence : `claude/audit-2026-11-01-accessibilite-v22.md`. Décisions validées par M. Colin le 2026-11-01 : D1-a, D2-a, D3 (levée A11), D4.

## Modifications réalisées

1. **Modales affichables sur mobile** (P0-1) — `css/screens/mobile-daily.css` : `.container > :not(.mobileDaily):not(.modal)`. Les 6 modales enfants directs de `.container` (CGU, « ? », Aide, Sauvegarde/sync, Tuto, Compréhension) s'affichent désormais à ≤ 860 px. Un nouvel utilisateur mobile peut accepter les conditions d'accès.
2. **Activité honnête** (P0-2, D1, D4) — `js/phase6/phase6-mobile-daily.js` :
   - `hasActivity()` ne compte qu'une séance réellement saisie (`sportSessions`, `sport.minutes`, `sport.kcal`) au lieu de la mission playful (qui valait aussi pour une simple dépense montre).
   - `ungateMobileCards()` / `regateMobileCards()` : pendant la surface mobile, `#sportCard` et `#sleepCard` perdent leur `data-um="sport"` (via `setMobileUseMode`, déjà existant) et les panneaux `.phase2JournalPanel--activity/--sleep` sont maintenus disponibles par un `MutationObserver` qui annule le `.hidden`/`aria-hidden` posé par `phase6SyncShellPanels`. Au retour desktop : attribut restauré, observateur coupé, `phase6SyncShellAvailability()` rejoué. Le registre de navigation legacy n'est pas modifié.
3. **Dépense confirmable en 1 tap** (P0-3, D2) — bouton `#mobileDailySpendConfirm` « Confirmer cette dépense » créé dans `#mobileDailySpendSlot` à l'activation mobile, retiré à la désactivation. Il rejoue l'événement `change` sur `#todaySpendEdit` → chemin `commit()` existant (`legacy-app-init.js` `initTodaySpendEditor`) → `energyExplicit:true`, valeur inchangée. Masqué une fois la dépense confirmée (CSS).
4. **Décompte du jour** — `<p id="mobileDailyRemaining">` dans `#mobileDailyState` (`index.html`), alimenté par `syncRemaining()` qui lit `#rK` (reste à consommer) et `#eK` (déjà consommé) calculés par le moteur legacy ; `#rK`/`#eK` ajoutés aux cibles du `MutationObserver` de synchronisation. Aucun calcul dans la surface mobile.
5. **Garde A11 levée** (D3) — `index.html` : 6 attributs `data-um="expert"` retirés du panneau `#mealPanelQuick` ; `legacy-app-init.js` `mealUI_setMode()` : panneau Rapide affiché dès que l'onglet est actif, aperçu verrouillé `#mealPanelQuickLocked` toujours masqué ; `css/screens/flowviz.css` : règle `body:not([data-usemode="expert"]) #mealPanelQuick{display:none !important}` remplacée par un commentaire. L'onglet par défaut reste « Manuel ». Effet desktop assumé : Rapide /100 g accessible en Simple et Sportif.
6. **Premier lancement** (P2-6) — `mobile-daily.css` : `#settingsProfileSlot` en colonne flex, `.settingsCardUsers` en `order:10` → « Mes informations » avant « Utilisateurs », sans toucher au DOM.
7. **Cosmétique** (P2-7) — `index.html` l.315 : « kcal » retiré du template de `#p1TodaySpend` (le JS injecte déjà l'unité, `legacy-shell-observers.js` l.88) ; `mobile-daily.css` : marqueur natif `<summary>` neutralisé (`list-style:none`, `::marker`) sur mobile → plus de double chevron.
8. **Nouvelle suite** — `tests/mobile-daily-surface.cjs` (Playwright) : CGU acceptable à 390 px ; ordre des cartes Réglages ; menu → Aide visible ; Activité utilisable en Simple ; 1 repas = 1/3 et décompte décrémenté ; Rapide /100 g utilisable en Simple (100 kcal/100 g × 200 g = 200 kcal) ; Dépense confirmée sans changement de valeur, `energyExplicit:true` ; séance réelle = 3/3 ; cycle mobile → desktop → mobile (attribut, panneaux, bouton) ; CGU desktop inchangée.

## Fichiers touchés
`index.html`, `css/screens/mobile-daily.css`, `css/screens/flowviz.css`, `js/phase6/phase6-mobile-daily.js`, `js/legacy/legacy-app-init.js`, `tests/mobile-daily-surface.cjs` (nouveau), `CHANGELOG_v23.md` (nouveau). Diff `-rq` v22 → v23 : exactement ces fichiers.

## Comportements préservés
- Aucune clé `localStorage`, aucun format persisté, aucun calcul modifié. `energyExplicit` reste posé uniquement par le chemin `commit()` existant.
- Aucune création de journée sans geste explicite (le bouton Confirmer est un geste explicite ; retaper la même valeur sans confirmer ne crée toujours rien).
- Destination initiale, accordéon Réglages v22, Historique mobile, registre de navigation, `hidePanelWhenUnavailable` (intact ; seulement neutralisé sur mobile pour deux panneaux, et rejoué au retour desktop).
- Desktop : mode Simple masque toujours Activité/Sommeil (vérifié : panneau `.hidden` + `aria-hidden` après retour desktop). Seul changement desktop assumé : Rapide /100 g accessible hors Expert (D3).

## Contrôles exécutés
- `node --check` sur tous les `.js` : OK. Identifiants dupliqués : 0. CSS équilibré (`mobile-daily.css` 241/241, `flowviz.css` 1477/1477).
- `app-state-navigation` 11/11 · `mobile-daily-structure` 12/12 · `structure` 8/8 · `browser-non-regression.cjs` exit 0 · `mobile-daily-surface.cjs` 9/9 groupes.
- Débordement horizontal : 0 px à 320, 360, 390, 480, 768 (Aujourd'hui, Repas/Rapide, Activité, Autres repères) et au premier lancement 320/390.
- Captures viewport 390 px (Aujourd'hui + décompte + bouton Confirmer, Rapide /100 g, Activité en Simple, CGU au premier lancement, Réglages premier lancement) et 320 px (Rapide), desktop 1280 (Pilotage).
- Intégrité ZIP (`unzip -t`) et réexécution d'un test depuis l'archive extraite.

## Limites restantes
- Mesures en Chromium headless ; non testé sur téléphone physique (clavier virtuel, Safari iOS).
- « Autres repères » affiche désormais Sommeil en mode Simple sur mobile (cohérent avec son libellé « Sommeil, poids, santé ») — conséquence de D1 ; si non souhaité, retirer `sleepCard` de `MOBILE_UNGATED_CARDS`.
- Les textes « Disponible en mode expert… depuis Pilotage » subsistent sur d'autres teasers (`index.html` l.~1900, ~2244, hors Repas) : non modifiés, hors lot.
- Onglet Repas par défaut = Manuel. Passer Rapide par défaut serait un changement desktop ; à décider séparément.
- Quatre fichiers JS orphelins (non chargés) toujours présents dans l'archive : `legacy-inline-main.js`, `legacy-engine-compute.js`, `legacy-mobile-steppers.js`, `legacy-mobile-stepper-goals.js`. Non supprimés (hors lot, aucun effet runtime).
