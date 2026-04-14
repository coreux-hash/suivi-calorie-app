# Passe D — stabilisation cloud

## Audit exact des fichiers concernés

### 1) Fichier de logique cloud principal
- `js/legacy/legacy-cloud-sync.js`
- Rôle : login email magique, callback Supabase, pull / push / sync, statut cloud.
- Cause racine actuelle : le login email est volontairement bloqué si l'application tourne en `file://`.

### 2) Fichier d'initialisation du client Supabase
- `js/legacy/legacy-diabetes.js`
- Rôle : déclare `ENABLE_CLOUD_SYNC`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, puis crée `supa`.
- Risque : si URL / clé sont absentes ou fausses, toute la couche cloud reste inactive.
- Modification appliquée dans cette passe : aucune, pour rester sur un patch minimal.

### 3) Boot applicatif phase 6
- `js/phase6/phase6-flows.js`
- Rôle : appelle le callback magic link au démarrage, puis rafraîchit l'état utilisateur.
- Modification appliquée : remplacement du statut brut par l'orchestrateur cloud stabilisé.

### 4) UI cloud source
- `index.html`
- Rôle : contient le mini-tuto Cloud, le formulaire email, les boutons login / pull / push / sync, le `#cloudStatus`.
- Modification appliquée dans cette passe : aucune, pour garder un patch JS minimal.

## Diagnostic technique

### Auth / login
Le flux actuel repose sur Supabase Email Magic Link :
1. `btnCloudLogin` → `cloudLoginWithEmail(email)`
2. `signInWithOtp()` envoie le lien
3. l'utilisateur clique le lien
4. l'app revient sur l'URL de redirection autorisée
5. `handleMagicLinkCallback()` valide le `token_hash`
6. la session Supabase est utilisée pour `pull/push/sync`

### Cause immédiate de l'erreur observée
Le code bloquait explicitement le login si l'app est ouverte en `file://`.
Conséquence : aucun email magique n'est envoyé tant que l'application n'est pas servie via `http://` ou `https://`.

### Cause probable n°2 à valider côté Supabase
Même avec un bon runtime HTTP, la synchro échouera si :
- l'URL de redirection n'est pas enregistrée dans Supabase Auth
- la table `public.cloud_profiles` n'existe pas
- la table existe mais les policies RLS ne permettent pas au propriétaire de lire/écrire ses lignes

## Patch JS minimal appliqué

### `js/legacy/legacy-cloud-sync.js`
Ajouts :
- résolution robuste de l'environnement (`file://`, `http://`, `https://`)
- résolution robuste de l'URL de redirection cloud
- statuts plus explicites et plus actionnables
- mémorisation locale du dernier login envoyé / dernier pull / dernier push / dernière sync
- nettoyage de l'URL après validation du magic link
- observateur d'état Auth Supabase pour remettre à jour le statut automatiquement

### `js/phase6/phase6-flows.js`
Ajout :
- au boot, le statut cloud passe maintenant par `cloudMarkReadyState()` et `cloudRefreshAuthStatus()`
- cela évite un statut trop pauvre ou contradictoire selon le contexte d'ouverture

## Décision d'architecture maintenue
- pas de refonte du moteur snapshot / merge
- pas de refonte de l'UX globale
- pas de déplacement de sections HTML
- pas de modification de la structure produit
- correction ciblée de la couche cloud existante
