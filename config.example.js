// Fichier de configuration d'exemple
// Copiez ce fichier vers config.js et remplissez avec vos vraies valeurs
// config.js est dans .gitignore et ne sera PAS commité

window.APP_CONFIG = {
  // Configuration Firebase
  firebase: {
    apiKey: "VOTRE_API_KEY_FIREBASE",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet",
    storageBucket: "votre-projet.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
  },
  
  // Clé VAPID pour les notifications push
  vapidKey: "VOTRE_CLE_VAPID_ICI",
  
  // URL de l'API backend
  apiBaseUrl: "http://localhost:3000/api/backend"
};
