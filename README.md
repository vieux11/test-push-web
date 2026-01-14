# Test Web Push Notifications

Projet simple pour tester les notifications push Firebase avec ton backend NestJS.

## Configuration requise

### ✅ Configuration Firebase déjà faite !

La configuration Firebase Web est déjà intégrée dans `index.html` et `firebase-messaging-sw.js`.

### 🔑 Récupérer la clé VAPID (OBLIGATOIRE)

Pour que les notifications push fonctionnent, tu dois récupérer ta **clé VAPID** :

1. Va sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionne ton projet **nzo-notification**
3. **Paramètres** (⚙️) → **Cloud Messaging**
4. Dans la section **"Clés de serveur Web Push"** :
   - Si tu vois déjà une clé → **Copie-la** (commence souvent par `B...`)
   - Si tu ne vois rien → Clique sur **"Générer une nouvelle paire de clés"** → Copie la clé générée

5. **Mets à jour `app.js` ligne 53** :
   ```javascript
   vapidKey: 'COLLE_TA_CLE_VAPID_ICI'
   ```

### 📝 Modifier l'URL de l'API (si nécessaire)

Dans `app.js` ligne 2, modifie `API_BASE_URL` si ton backend NestJS n'est pas sur `http://localhost:3200`.

### 3. Modifier l'URL de l'API (si nécessaire)

Dans `app.js` ligne 2, modifie `API_BASE_URL` si ton backend NestJS n'est pas sur `http://localhost:3200`.

## Utilisation

### 1. Lancer le backend NestJS

```bash
cd ton-projet-nestjs
npm run start:dev
```

### 2. Servir les fichiers web

Tu dois servir les fichiers via HTTP (pas `file://`). Plusieurs options :

**Option A : Live Server (VS Code)**
- Installe l'extension "Live Server"
- Clic droit sur `index.html` → "Open with Live Server"

**Option B : Serve npm**
```bash
npx serve .
```

**Option C : Python**
```bash
python -m http.server 8080
```

### 3. Tester

1. Ouvre `http://localhost:8080` (ou le port de ton serveur)
2. Clique sur **"Autoriser les notifications"**
3. Remplis le formulaire **"Enregistrer l'appareil"** avec un User ID (UUID)
4. Remplis le formulaire **"Envoyer une notification test"**
5. Tu devrais recevoir la notification ! 🔔

## Notes importantes

- Les notifications push nécessitent HTTPS en production (mais fonctionnent en localhost)
- Le Service Worker (`firebase-messaging-sw.js`) doit être à la racine du projet
- Si tu changes le port de ton backend, modifie `API_BASE_URL` dans `app.js`

## Dépannage

**"Firebase n'est pas initialisé"**
→ Vérifie que tu as bien remplacé la config dans `index.html`

**"Impossible d'obtenir le token FCM"**
→ Vérifie que tu as bien remplacé `TON_VAPID_KEY` dans `app.js`

**"Erreur CORS"**
→ Vérifie que ton backend NestJS a `enableCors()` activé (déjà fait dans `main.ts`)

**"Service Worker non trouvé"**
→ Assure-toi que `firebase-messaging-sw.js` est bien à la racine du projet

