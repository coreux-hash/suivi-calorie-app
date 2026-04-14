# Passe D — procédure de test cloud

## Pré-requis communs
1. Ouvrir Supabase Dashboard.
2. Dans **Auth > URL Configuration** :
   - renseigner la **Site URL** principale
   - ajouter les **Redirect URLs** que tu vas réellement utiliser pour tester
3. Exécuter le script `PASS_D_SUPABASE_cloud_profiles.sql` dans le SQL Editor.
4. Vérifier que l'application n'est plus ouverte en `file://` pour les tests cloud.

## URLs de test recommandées

### Cas 1 — desktop local simple
- serveur local : `http://localhost:8080/index.html`
- à déclarer dans Redirect URLs

### Cas 2 — mobile / tablette sur le même réseau Wi-Fi
- lancer le serveur sur le desktop
- récupérer l'IP LAN du desktop, par exemple `http://192.168.1.25:8080/index.html`
- ajouter cette URL exacte dans Redirect URLs
- ouvrir cette URL depuis mobile et tablette

### Cas 3 — URL HTTPS partagée
- héberger l'app sur une URL HTTPS unique
- ajouter cette URL dans Redirect URLs
- utiliser cette même URL sur desktop, mobile, tablette

## Test A — desktop
1. Lancer l'app via `http://localhost:PORT/...`
2. Ouvrir le modal **Sauvegarde / synchronisation**
3. Saisir l'email
4. Cliquer **Recevoir un lien**
5. Vérifier dans `#cloudStatus` : lien envoyé + redirect URL
6. Ouvrir l'email sur le desktop et cliquer le lien
7. Vérifier au retour dans l'app : statut `connecté : ...`
8. Cliquer **Sauvegarder vers le cloud**
9. Vérifier : `Push OK`
10. Modifier une donnée locale visible
11. Cliquer **Synchroniser automatiquement**
12. Vérifier : `Sync OK`

## Test B — mobile
1. Ouvrir la même app via une URL accessible depuis le téléphone (pas `localhost` du desktop)
2. Demander un lien avec le même email
3. Ouvrir l'email sur le téléphone
4. Vérifier le statut connecté
5. Cliquer **Récupérer depuis le cloud**
6. Contrôler que les données desktop réapparaissent sur mobile

## Test C — tablette
1. Même protocole que mobile
2. Tester ensuite une modification sur tablette
3. Cliquer **Sauvegarder vers le cloud** ou **Synchroniser automatiquement**
4. Revenir sur desktop
5. Faire **Récupérer depuis le cloud**
6. Vérifier que la fusion a bien été propagée

## Contrôles à faire dans la console navigateur
- aucune erreur `file://` pendant le login
- aucune erreur `Failed to fetch`
- aucune erreur Supabase 401 / 403 / RLS
- aucune erreur SQL `relation "cloud_profiles" does not exist`

## Résultats attendus
- login email possible uniquement en HTTP/HTTPS
- session persistante sur l'appareil connecté
- Push : local → cloud
- Pull : cloud → local
- Sync : merge puis écriture cloud
- chaque appareil retrouve les données après connexion puis pull/sync
