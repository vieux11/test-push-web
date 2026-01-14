// Configuration Firebase Web (identique à index.html)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCcIS0KkJFqJhGnKMlOEQAf4lB7F68qfG8",
  authDomain: "nzo-notification.firebaseapp.com",
  projectId: "nzo-notification",
  storageBucket: "nzo-notification.firebasestorage.app",
  messagingSenderId: "987155403508",
  appId: "1:987155403508:web:2a2d619395614042f684a1"
};

// Initialiser Firebase dans le Service Worker
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance messaging
const messaging = firebase.messaging();

// Écouter les messages (data messages)
messaging.onBackgroundMessage((payload) => {
  const timestamp = new Date().toISOString();
  console.log(`[firebase-messaging-sw.js] [${timestamp}] Message reçu:`, payload);

  // Pour les data messages, les infos sont dans payload.data
  const title = payload.data?.title || payload.notification?.title || 'Notification';
  const body = payload.data?.body || payload.notification?.body || '';

  console.log(`[firebase-messaging-sw.js] [${timestamp}] Extraction des données:`, {
    title,
    body,
    hasData: !!payload.data,
    hasNotification: !!payload.notification,
    dataKeys: payload.data ? Object.keys(payload.data) : [],
    notificationKeys: payload.notification ? Object.keys(payload.notification) : []
  });

  const notificationOptions = {
    body: body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'notification-' + Date.now(),
    requireInteraction: true, // La notification reste jusqu'au clic
    vibrate: [200, 100, 200],
    data: payload.data || {} // Conserver les données pour le clic
  };

  console.log(`[firebase-messaging-sw.js] [${timestamp}] Options de notification:`, notificationOptions);
  
  try {
    const notificationPromise = self.registration.showNotification(title, notificationOptions);
    console.log(`[firebase-messaging-sw.js] [${timestamp}] Notification affichée avec succès`);
    return notificationPromise;
  } catch (error) {
    console.error(`[firebase-messaging-sw.js] [${timestamp}] Erreur lors de l'affichage:`, error);
    throw error;
  }
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[firebase-messaging-sw.js] [${timestamp}] Notification cliquée:`, {
    notification: {
      title: event.notification.title,
      body: event.notification.body,
      tag: event.notification.tag,
      data: event.notification.data
    },
    action: event.action
  });
  
  event.notification.close();
  
  // Optionnel: ouvrir une URL quand on clique
  // event.waitUntil(clients.openWindow('https://ton-site.com'));
});

// Gérer les erreurs du Service Worker
self.addEventListener('error', (event) => {
  const timestamp = new Date().toISOString();
  console.error(`[firebase-messaging-sw.js] [${timestamp}] Erreur du Service Worker:`, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Log au démarrage du Service Worker
self.addEventListener('install', (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[firebase-messaging-sw.js] [${timestamp}] Service Worker installé`);
  self.skipWaiting(); // Activer immédiatement
});

self.addEventListener('activate', (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[firebase-messaging-sw.js] [${timestamp}] Service Worker activé`);
  event.waitUntil(self.clients.claim()); // Prendre le contrôle immédiatement
});
