# Passation — v24.2 : vocabulaire, passe 3 (Relire, Ce que tu vises dynamique, badges) — 2026-11-02

## État du dossier
Dossier = **v24.2** (v24.1 + cette passe, écrite en place). Précédente passation : `PASSATION_v24.1_2026-11-02.md`. À déposer sur GitHub dans les sous-dossiers.

## Périmètre
- **Relire** (desktop + attributs) : « Tes jours passés », raccourcis (choisir un jour / sur 7 jours / **Poids et corps** / noter ce jour / mesures et courbe), « Ta semaine » (Jours notés · Protéines dans les clous · Proche de la cible · Jours avec du sport), badges (« Les badges récompensent le fait de noter, pas le fait de manger moins. »), « Calendrier » (« Choisis un jour : son résumé s'affiche à côté. »), guide des 7 jours réécrit (titre, liste, modale « La première fois / Ensuite »), « Tendances », « Poids et corps », mini-tutos de Relire sous le préfixe « Comment ça marche — … ».
- **Badges** (`legacy-playful-tracking.js`) : noms et descriptions (« Première séance · Tu as noté ta première séance. », « Ça bouge · 3 jours avec du sport. », « Dans la cible », « Semaine solide », « Bien lancé »…). Clés inchangées.
- **Ce que tu vises, textes dynamiques** (`legacy-compromise-ui.js`, `legacy-training-load-matrix.js`) : uniquement les **libellés de structure** — « Rien choisi pour l'instant », « Mon propre réglage » (ex-compromis personnalisé), « Ce que ton corps encaisse » (ex-Charge actuelle), niveaux « L0 · peu de sport … L4 · énormément / bloc perf », « D · ce que tu brûles sur 7 j », « D— · il manque des jours », verdicts (« Ça colle avec ce que ton corps encaisse. », « Possible, mais garde un œil. », « Pas le meilleur choix en ce moment. »), « Glucides conseillés », « Choisis ce que tu vises pour voir si ton corps peut suivre. », deux chaînes qui disaient encore « Historique ».
- **Non réécrit, volontairement** : le **catalogue** des choix (noms « Sèche progressive (référence amaigrissement) », descriptions « Bon choix si tu veux… », avantages/limites, plages de protéines, repères glucides) — ~90 chaînes de contenu métier déjà en français parlé, à relire avec M. Colin plutôt qu'à réécrire en aveugle. Le mot « compromis » y subsiste donc dans les fiches.

## Correction héritée de la passe 1
`legacy-training-load-matrix.js` l.154 cherchait le texte « Exemple : 1.0 » (supprimé en v24.0) pour masquer le bloc ratio en mode off/soft → aligné sur « 1.0 = autant ». Quatrième accroche texte trouvée ; les précédentes sont dans `PASSATION_v24.0`.

## Nuance protégée par un test
`browser-non-regression.cjs` exigeait « dépense énergétique totale » et interdisait « calories brûlées » dans le guide des 7 jours : la dépense du jour est le **total de la journée** (sport compris), pas les calories du sport. Le guide dit maintenant « ce que tu as brûlé sur toute la journée (sport compris) » et le test vérifie cette formule ; l'interdit « calories brûlées » reste.

## Liste avant → après
`RELECTURE_v24.2_avant_apres.md` (135 lignes).

## Fichiers touchés
`index.html` · `js/legacy/legacy-playful-tracking.js` · `js/legacy/legacy-compromise-ui.js` · `js/legacy/legacy-training-load-matrix.js` · `js/legacy/legacy-shell-observers.js` (détection des mini-tutos : mots-clés « Tendances », « corps encaisse » ajoutés ; trois titres) · `tests/browser-non-regression.cjs` (trois regex de wording) · `RELECTURE_v24.2_avant_apres.md` · cette passation.
Aucun `id`, `class`, `data-*`, `value`, clé (`secheapp.*.customCompromises.*` intacte) ni calcul modifié.

## Contrôles exécutés
`node --check` OK ; 0 id dupliqué ; 11/11 · 12/12 · 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` 13/13 ; débordement 0 px à 390 ; captures Relire mobile et Ce que tu vises contrôlées ; relecture octet pour octet après écriture.

## Suite
Passe 4 : shell desktop (« Bon à savoir », « Accès transverses », barre de statut, sous-titres des quatre tuiles), guides « Comment ça marche ? » et « Comprendre l'application », modale Aide et mots-clés, teasers, Glycémie. Puis pont NutriApp.
