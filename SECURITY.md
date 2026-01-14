# 🔒 Guide de Sécurité - Révoquer les clés exposées

## ⚠️ Si vous avez accidentellement commité des secrets sur GitHub

GitHub a détecté que vous avez exposé des secrets (clés API Firebase) dans votre dépôt. Voici comment résoudre le problème :

### 1. Révoquer immédiatement les clés exposées

#### Pour Firebase (Google API Key) :

1. **Allez sur [Firebase Console](https://console.firebase.google.com/)**
2. **Sélectionnez votre projet** (`nzo-notification`)
3. **Paramètres** (⚙️) → **Paramètres du projet**
4. **Onglet "Général"** → Section **"Vos applications"**
5. **Trouvez votre application Web** et cliquez sur **"Configurer"**
6. **Révoquez l'ancienne clé API** ou **Supprimez l'application** et créez-en une nouvelle

#### Pour la clé VAPID :

1. **Allez sur [Firebase Console](https://console.firebase.google.com/)**
2. **Paramètres** (⚙️) → **Cloud Messaging**
3. Dans **"Clés de serveur Web Push"**, supprimez l'ancienne clé
4. **Générez une nouvelle paire de clés**

### 2. Nettoyer l'historique Git (si nécessaire)

Si les secrets sont dans l'historique Git, vous devez les supprimer :

```bash
# Option 1 : Utiliser git-filter-repo (recommandé)
git filter-repo --path firebase-messaging-sw.js --invert-paths
git filter-repo --path index.html --invert-paths
git filter-repo --path app.js --invert-paths

# Option 2 : Utiliser BFG Repo-Cleaner
# Téléchargez BFG depuis https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files firebase-messaging-sw.js
java -jar bfg.jar --replace-text secrets.txt  # Créez un fichier avec vos secrets à remplacer

# Après nettoyage, forcez le push (ATTENTION : cela réécrit l'historique)
git push origin --force --all
```

**⚠️ ATTENTION** : Le force push réécrit l'historique Git. Informez tous les collaborateurs.

### 3. Mettre à jour vos fichiers locaux

1. **Créez `config.js`** à partir de `config.example.js`
2. **Créez `firebase-config-sw.js`** à partir de `firebase-config-sw.example.js`
3. **Remplissez avec vos NOUVELLES clés** (pas les anciennes exposées)
4. **Vérifiez que `.gitignore` contient bien** :
   ```
   config.js
   firebase-config-sw.js
   ```

### 4. Vérifier que les secrets ne sont plus exposés

```bash
# Vérifier que config.js n'est pas tracké
git ls-files | grep config.js

# Si rien ne s'affiche, c'est bon !
# Si config.js apparaît, supprimez-le du cache :
git rm --cached config.js
```

### 5. Prévention future

- ✅ **Toujours vérifier** `.gitignore` avant de commiter
- ✅ **Utiliser** `git status` pour voir ce qui sera commité
- ✅ **Ne jamais** commiter de fichiers contenant des secrets
- ✅ **Utiliser** les fichiers `.example.js` comme templates

## 📋 Checklist de sécurité

Avant chaque commit :

- [ ] Vérifier que `config.js` n'est pas dans `git status`
- [ ] Vérifier que `firebase-config-sw.js` n'est pas dans `git status`
- [ ] Vérifier que `.gitignore` contient bien ces fichiers
- [ ] Ne jamais hardcoder de secrets dans le code
- [ ] Utiliser uniquement les fichiers `.example.js` comme référence

## 🔗 Ressources

- [GitHub Docs - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Firebase Console](https://console.firebase.google.com/)
- [Git filter-repo](https://github.com/newren/git-filter-repo)
