# Passation — correction v23.4 : chaîne des kcal lisible, cible en en-tête, préremplissage par nom (2026-11-01)

## État du dossier
Dossier = **v23.4** (v23.3 + cette correction, écrite en place). Précédente passation : `PASSATION_v23.3_2026-11-01.md`. À repousser sur GitHub Pages.

## Décisions prises (déléguées par M. Colin, « en vue du moteur et des objectifs »)
| Point | Décision | Motif |
|---|---|---|
| Préremplissage par nom | Oui | complète « Récents », n'ajoute rien, n'écrase rien |
| (a) chaîne Dépense lisible | Oui | correction locale, lève la confusion 4000 / 3200 |
| (b) cible dans l'en-tête | Oui | « Reste » n'a de sens qu'avec la cible |
| (c) neutraliser la prudence pour la marque « Personnalisé » | **Non** | changerait silencieusement cible et charge D des profils existants (invariant migration prudente) ; la chaîne (a) rend le réglage visible et renvoie à Réglages › Montre, où l'utilisateur met 0 % s'il le veut |
| libellé Historique « vs cible » | Non | composant partagé desktop (`legacy-history.js` l.280), hors lot |

## Constat legacy découvert en route (non corrigé, documenté)
`#p1TodaySpend` (« Ajustée : … ») affiche la **valeur brute** tant que la journée n'est pas enregistrée (`legacy-shell-observers.js` l.81 : `d?.montreAdjusted ?? d?.montreRaw ?? #montre`), alors que le moteur calcule déjà la cible sur la valeur ajustée. Sur une journée vide avec prudence 20 % : « Ajustée : 4000 » et cible 2944 (= 92 % de 3200). Composant desktop partagé ; sur mobile cette ligne est désormais masquée et remplacée par la chaîne ci-dessous, lue depuis `#flow_spendKcal` (dépense ajustée écrite par le moteur à chaque recalcul, journée sauvegardée ou non).

## Modifications
- `js/phase6/phase6-mobile-daily.js`
  - `syncSpendChain()` + élément `#mobileDailySpendChain` (créé/retiré avec le bouton Confirmer) : « Montre 4000 → retenue 3200 kcal (prudence −20 %, réglable dans Réglages › Montre) », ou « Retenue par le moteur : N kcal » quand brut = retenue. Signe selon `#errMode` (conservative −, optimistic +). Lecture seule.
  - `syncRemaining()` : en-tête « Reste N kcal · M consommées · cible T » (`#rK`, `#eK`, `#tK`).
  - `prefillMealFromName()` : sur `input`/`change` de `#mealName`, si le nom (casse ignorée, hors « Repas ») correspond à un repas récent et que `#mealK/#mealP/#mealC/#mealF` sont vides ou à 0 → préremplissage ; sinon rien. Mobile uniquement (`media.matches`).
  - `#tK` et `#flow_spendKcal` ajoutés aux cibles observées pour la synchronisation.
- `css/screens/mobile-daily.css` : `#mobileDailySpendSlot .phase1PulseMeta{display:none}` (ligne legacy masquée sur mobile) ; style `.mobileDailySpendChain`.
- `tests/mobile-daily-surface.cjs` : groupe « Dépense : chaîne lisible ; en-tête avec cible ; préremplissage par nom » (profil prudence 20 % : chaîne 4000 → 3200, cible 2944 ; préremplissage « petit DÉJ » → 420/21/52/13 sans ajout ; valeur saisie 999 conservée ; profil sans prudence : chaîne courte).

Aucun calcul, aucune clé, aucun format nouveau. Moteur intact. Desktop intact.

## Contrôles exécutés
`node --check` OK ; CSS équilibré (258/258) ; 11/11 · 12/12 · 8/8 ; `browser-non-regression.cjs` exit 0 ; `mobile-daily-surface.cjs` **12/12** ; débordement 0 px à 320/390 ; capture 390 contrôlée ; relecture octet pour octet après écriture.

## Limites
- Le préremplissage lit la liste « Récents » (8 derniers repas nommés) : un repas plus ancien que ces 8 ne préremplit pas.
- Si la journée a déjà été sauvegardée avec une autre valeur de montre, `#flow_spendKcal` reflète le dernier recalcul — cohérent avec la cible affichée, par construction.
