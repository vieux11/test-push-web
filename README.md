# Test Web Push Notifications

Projet simple pour tester les notifications push Firebase avec ton backend NestJS.

## Configuration requise

### 🔐 Configuration des secrets (IMPORTANT - SÉCURITÉ)

**⚠️ Les fichiers de configuration avec vos secrets ne sont PAS commités sur GitHub.**

Pour démarrer le projet, vous devez créer les fichiers de configuration :

1. **Copiez `config.example.js` vers `config.js`** :
   ```bash
   cp config.example.js config.js
   ```

2. **Copiez `firebase-config-sw.example.js` vers `firebase-config-sw.js`** :
   ```bash
   cp firebase-config-sw.example.js firebase-config-sw.js
   ```

3. **Remplissez `config.js` avec vos vraies valeurs** :
   - Configuration Firebase (depuis Firebase Console)
   - Clé VAPID (voir ci-dessous)
   - URL de l'API backend

4. **Remplissez `firebase-config-sw.js` avec la même configuration Firebase**

### 🔑 Récupérer la clé VAPID (OBLIGATOIRE)

Pour que les notifications push fonctionnent, tu dois récupérer ta **clé VAPID** :

1. Va sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionne ton projet Firebase
3. **Paramètres** (⚙️) → **Cloud Messaging**
4. Dans la section **"Clés de serveur Web Push"** :
   - Si tu vois déjà une clé → **Copie-la** (commence souvent par `B...`)
   - Si tu ne vois rien → Clique sur **"Générer une nouvelle paire de clés"** → Copie la clé générée

5. **Colle la clé dans `config.js`** dans le champ `vapidKey`

### 📝 Modifier l'URL de l'API (si nécessaire)

Dans `config.js`, modifie `apiBaseUrl` si ton backend NestJS n'est pas sur `http://localhost:3200`.

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

**"Configuration non trouvée" ou "config.js manquant"**
→ Assure-toi d'avoir créé `config.js` et `firebase-config-sw.js` à partir des fichiers `.example.js`

**"Firebase n'est pas initialisé"**
→ Vérifie que `config.js` contient bien `APP_CONFIG.firebase` avec toutes les valeurs

**"Impossible d'obtenir le token FCM"**
→ Vérifie que `config.js` contient bien `vapidKey` avec votre clé VAPID

**"Erreur CORS"**
→ Vérifie que ton backend NestJS a `enableCors()` activé (déjà fait dans `main.ts`)

**"Service Worker non trouvé"**
→ Assure-toi que `firebase-messaging-sw.js` est bien à la racine du projet

**"firebase-config-sw.js non trouvé"**
→ Assure-toi d'avoir créé `firebase-config-sw.js` à partir de `firebase-config-sw.example.js`

## 🔒 Sécurité

- Les fichiers `config.js` et `firebase-config-sw.js` sont dans `.gitignore` et ne seront **jamais** commités
- Ne partagez jamais ces fichiers contenant vos secrets
- Si vous avez accidentellement commité des secrets :
  1. Révoquez immédiatement les clés exposées dans Firebase Console
  2. Générez de nouvelles clés
  3. Mettez à jour vos fichiers de configuration locaux
