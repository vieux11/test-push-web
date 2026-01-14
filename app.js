// Configuration API
const API_BASE_URL = 'http://localhost:3200/api/nzo-notification';

// Éléments DOM
const enableBtn = document.getElementById('enableBtn');
const registerBtn = document.getElementById('registerBtn');
const deviceForm = document.getElementById('deviceForm');
const notificationForm = document.getElementById('notificationForm');
const statusDiv = document.getElementById('status');
const tokenDisplay = document.getElementById('tokenDisplay');
const deviceStatus = document.getElementById('deviceStatus');
const notificationStatus = document.getElementById('notificationStatus');
const resetBtn = document.getElementById('resetBtn');
const diagnosticDiv = document.getElementById('diagnostic');

let fcmToken = null;
let deviceId = null;
let serviceWorkerRegistration = null;

// Fonction de log de diagnostic
function logDiagnostic(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, data || '');
  
  if (diagnosticDiv) {
    const logEntry = document.createElement('div');
    logEntry.className = 'diagnostic-log';
    logEntry.innerHTML = `<strong>${logMessage}</strong>${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}`;
    diagnosticDiv.appendChild(logEntry);
    diagnosticDiv.scrollTop = diagnosticDiv.scrollHeight;
  }
}

// Fonction pour afficher les informations du token
function displayTokenInfo(token) {
  if (!token) return;
  
  logDiagnostic('Token FCM obtenu', {
    token: token.substring(0, 50) + '...',
    length: token.length,
    timestamp: new Date().toISOString()
  });
  
  // Vérifier le format du token
  if (!token.startsWith('http') && token.length > 100) {
    logDiagnostic('Format du token: Valide (FCM token)');
  } else {
    logDiagnostic('Format du token: ⚠️ Suspect', { token });
  }
}

// Générer un deviceId unique
function generateDeviceId() {
  if (!deviceId) {
    deviceId = 'web-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// Récupérer le deviceId sauvegardé
if (localStorage.getItem('deviceId')) {
  deviceId = localStorage.getItem('deviceId');
}

// Fonction pour obtenir/régénérer le token FCM
async function getFCMToken(forceRefresh = false) {
  try {
    logDiagnostic('Début de la récupération du token FCM', { forceRefresh });

    if (!('Notification' in window)) {
      throw new Error('Ce navigateur ne supporte pas les notifications');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('Ce navigateur ne supporte pas les Service Workers');
    }

    // Vérifier les permissions
    let permission = Notification.permission;
    logDiagnostic('État de la permission', { permission });

    if (permission === 'default') {
      logDiagnostic('Demande de permission...');
      permission = await Notification.requestPermission();
      logDiagnostic('Résultat de la permission', { permission });
    }
    
    if (permission !== 'granted') {
      throw new Error('Permission refusée. Veuillez autoriser les notifications dans les paramètres du navigateur.');
    }

    // Enregistrer le Service Worker
    logDiagnostic('Enregistrement du Service Worker...');
    const registration = await navigator.serviceWorker.register('firebase-messaging-sw.js', {
      updateViaCache: 'none'
    });
    
    logDiagnostic('Service Worker enregistré', {
      scope: registration.scope,
      active: registration.active ? 'Oui' : 'Non',
      installing: registration.installing ? 'Oui' : 'Non',
      waiting: registration.waiting ? 'Oui' : 'Non'
    });
    
    // Attendre que le service worker soit prêt
    await navigator.serviceWorker.ready;
    logDiagnostic('Service Worker prêt');
    
    serviceWorkerRegistration = registration;

    // Vérifier Firebase
    if (!window.firebaseMessaging) {
      throw new Error('Firebase n\'est pas initialisé. Vérifie la config dans index.html');
    }

    // Supprimer l'ancien token si on force le refresh
    if (forceRefresh && fcmToken) {
      try {
        logDiagnostic('Suppression de l\'ancien token...');
        await window.firebaseMessaging.deleteToken();
        logDiagnostic('Ancien token supprimé');
        fcmToken = null;
      } catch (deleteError) {
        logDiagnostic('Erreur lors de la suppression (peut être normal)', deleteError);
      }
    }

    // Obtenir le token
    logDiagnostic('Récupération du token FCM...');
    const vapidKey = 'BM4IXOo9pDUDL_czsLikVuks1kSYsJ2J6waeyhxwtosI4WutNo08o7Vef3jQBUymM0quCWrh6FUYaAzjlqb0NUE';
    
    const token = await window.getToken(window.firebaseMessaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      throw new Error('Impossible d\'obtenir le token FCM. Vérifiez la clé VAPID dans Firebase Console.');
    }

    fcmToken = token;
    displayTokenInfo(token);
    
    return { token, registration };

  } catch (error) {
    logDiagnostic('Erreur lors de la récupération du token', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

// 1. Demander permission et obtenir le token FCM
enableBtn.addEventListener('click', async () => {
  try {
    statusDiv.textContent = 'Demande de permission...';
    statusDiv.className = 'status info';

    const { token, registration } = await getFCMToken();

    tokenDisplay.innerHTML = `
      <strong>Token FCM:</strong>
      <code>${token}</code>
      <button onclick="navigator.clipboard.writeText('${token}')" class="btn-copy">Copier</button>
      <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
        <strong>Longueur:</strong> ${token.length} caractères<br>
        <strong>Généré le:</strong> ${new Date().toLocaleString()}
      </div>
    `;
    statusDiv.textContent = '✅ Token obtenu avec succès!';
    statusDiv.className = 'status success';
    registerBtn.disabled = false;
    enableBtn.disabled = true;

    // Écouter les messages en foreground (quand l'onglet est actif)
    window.onMessage(window.firebaseMessaging, (payload) => {
      logDiagnostic('Message reçu en foreground', payload);
      
      // Pour les data messages, les infos sont dans payload.data
      const title = payload.data?.title || payload.notification?.title || 'Notification';
      const body = payload.data?.body || payload.notification?.body || '';
      
      // Afficher une notification système même au premier plan
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/icon-192x192.png',
          tag: 'foreground-notification',
        });
        logDiagnostic('Notification affichée en foreground', { title, body });
      }
    });

  } catch (error) {
    console.error('Erreur:', error);
    const errorMessage = error.message || 'Erreur inconnue';
    statusDiv.textContent = `❌ Erreur: ${errorMessage}`;
    statusDiv.className = 'status error';
    logDiagnostic('Erreur finale', error);
  }
});

// 2. Enregistrer l'appareil
deviceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!fcmToken) {
    deviceStatus.textContent = '❌ Tu dois d\'abord obtenir le token FCM';
    deviceStatus.className = 'status error';
    logDiagnostic('Tentative d\'enregistrement sans token');
    return;
  }

  const userId = document.getElementById('userId').value.trim();
  
  if (!userId) {
    deviceStatus.textContent = '❌ User ID requis';
    deviceStatus.className = 'status error';
    return;
  }

  try {
    deviceStatus.textContent = 'Enregistrement en cours...';
    deviceStatus.className = 'status info';

    const deviceData = {
      userId: userId,
      deviceId: generateDeviceId(),
      fcmToken: fcmToken,
      platform: 'web',
      appVersion: '1.0.0'
    };

    logDiagnostic('Envoi de la requête d\'enregistrement', {
      userId: deviceData.userId,
      deviceId: deviceData.deviceId,
      tokenLength: deviceData.fcmToken.length,
      apiUrl: `${API_BASE_URL}/user-device`
    });

    const response = await fetch(`${API_BASE_URL}/user-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deviceData)
    });

    logDiagnostic('Réponse reçue', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const error = await response.json();
      logDiagnostic('Erreur de l\'API', error);
      throw new Error(error.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    logDiagnostic('Appareil enregistré avec succès', result);
    deviceStatus.textContent = '✅ Appareil enregistré avec succès!';
    deviceStatus.className = 'status success';
    console.log('Appareil enregistré:', result);

  } catch (error) {
    console.error('Erreur:', error);
    const errorMessage = error.message || 'Erreur lors de l\'enregistrement';
    deviceStatus.textContent = `❌ Erreur: ${errorMessage}`;
    deviceStatus.className = 'status error';
    logDiagnostic('Erreur lors de l\'enregistrement', {
      message: errorMessage,
      type: error.name,
      stack: error.stack
    });
  }
});

// 3. Envoyer une notification test
notificationForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = document.getElementById('notifUserId').value.trim();
  const title = document.getElementById('title').value.trim();
  const body = document.getElementById('body').value.trim();

  if (!userId || !title || !body) {
    notificationStatus.textContent = '❌ Tous les champs sont requis';
    notificationStatus.className = 'status error';
    return;
  }

  try {
    notificationStatus.textContent = 'Envoi de la notification...';
    notificationStatus.className = 'status info';

    const notificationData = {
      userId: userId,
      title: title,
      body: body
    };

    logDiagnostic('Envoi de la notification', {
      userId: userId,
      title: title,
      apiUrl: `${API_BASE_URL}/notification`
    });

    const response = await fetch(`${API_BASE_URL}/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    });

    logDiagnostic('Réponse de l\'API de notification', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const result = await response.json();
    logDiagnostic('Résultat complet', result);

    if (!response.ok) {
      const errorMessage = result.message || 'Erreur lors de l\'envoi';
      
      // Détecter l'erreur spécifique "Requested entity was not found"
      if (result.errors && Array.isArray(result.errors)) {
        const hasEntityNotFound = result.errors.some(err => 
          typeof err === 'string' && err.includes('Requested entity was not found')
        );
        
        if (hasEntityNotFound) {
          logDiagnostic('⚠️ ERREUR: Token FCM invalide détecté', {
            error: 'Requested entity was not found',
            devicesFound: result.devicesFound,
            sentCount: result.sentCount,
            suggestion: 'Le token FCM stocké dans la base de données est invalide ou expiré. Régénérez le token et réenregistrez l\'appareil.'
          });
          
          notificationStatus.innerHTML = `
            ❌ <strong>Token FCM invalide!</strong><br>
            Le token stocké dans la base de données n'est plus valide.<br>
            <strong>Solution:</strong> Cliquez sur "Reset complet" puis réenregistrez l'appareil avec un nouveau token.
          `;
          notificationStatus.className = 'status error';
          return;
        }
      }
      
      throw new Error(errorMessage);
    }

    if (result.success === false) {
      // Vérifier les erreurs dans le résultat
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        const errorMessages = result.errors.join(', ');
        logDiagnostic('Erreurs dans le résultat', {
          errors: result.errors,
          devicesFound: result.devicesFound,
          sentCount: result.sentCount
        });
        
        if (errorMessages.includes('Requested entity was not found')) {
          notificationStatus.innerHTML = `
            ❌ <strong>Token FCM invalide!</strong><br>
            Le token stocké dans la base de données n'est plus valide.<br>
            <strong>Solution:</strong> Cliquez sur "Reset complet" puis réenregistrez l'appareil avec un nouveau token.
          `;
          notificationStatus.className = 'status error';
          return;
        }
        
        throw new Error(`Échec: ${errorMessages}`);
      }
    }

    notificationStatus.textContent = `✅ Notification envoyée! (${result.sentCount || 0} appareil(s) notifié(s))`;
    notificationStatus.className = 'status success';
    console.log('Notification envoyée:', result);

    // Réinitialiser le formulaire
    notificationForm.reset();

  } catch (error) {
    console.error('Erreur:', error);
    const errorMessage = error.message || 'Erreur lors de l\'envoi';
    notificationStatus.textContent = `❌ Erreur: ${errorMessage}`;
    notificationStatus.className = 'status error';
    logDiagnostic('Erreur lors de l\'envoi de notification', {
      message: errorMessage,
      type: error.name,
      stack: error.stack
    });
  }
});

// Fonction de reset complet
async function performFullReset() {
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser complètement ? Cela supprimera le token FCM, le Service Worker et réinitialisera les permissions.')) {
    return;
  }

  try {
    logDiagnostic('=== DÉBUT DU RESET COMPLET ===');
    
    // 1. Supprimer le token FCM si disponible
    if (fcmToken && window.firebaseMessaging) {
      try {
        logDiagnostic('Suppression du token FCM...');
        await window.firebaseMessaging.deleteToken();
        logDiagnostic('Token FCM supprimé');
      } catch (error) {
        logDiagnostic('Erreur lors de la suppression du token (peut être normal)', error);
      }
    }

    // 2. Désenregistrer tous les Service Workers
    if ('serviceWorker' in navigator) {
      try {
        logDiagnostic('Désenregistrement des Service Workers...');
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => {
          logDiagnostic('Désenregistrement du SW', { scope: reg.scope });
          return reg.unregister();
        }));
        logDiagnostic('Tous les Service Workers désenregistrés');
      } catch (error) {
        logDiagnostic('Erreur lors du désenregistrement des SW', error);
      }
    }

    // 3. Effacer le cache
    if ('caches' in window) {
      try {
        logDiagnostic('Suppression du cache...');
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => {
          logDiagnostic('Suppression du cache', { name });
          return caches.delete(name);
        }));
        logDiagnostic('Cache supprimé');
      } catch (error) {
        logDiagnostic('Erreur lors de la suppression du cache', error);
      }
    }

    // 4. Effacer localStorage
    try {
      logDiagnostic('Suppression du localStorage...');
      localStorage.removeItem('deviceId');
      logDiagnostic('localStorage nettoyé');
    } catch (error) {
      logDiagnostic('Erreur lors de la suppression du localStorage', error);
    }

    // 5. Réinitialiser les variables
    fcmToken = null;
    deviceId = null;
    serviceWorkerRegistration = null;

    // 6. Réinitialiser l'interface
    tokenDisplay.innerHTML = '';
    statusDiv.textContent = 'Reset effectué. Cliquez sur "Autoriser les notifications" pour recommencer.';
    statusDiv.className = 'status info';
    registerBtn.disabled = true;
    enableBtn.disabled = false;
    deviceStatus.textContent = '';
    notificationStatus.textContent = '';

    logDiagnostic('=== RESET COMPLET TERMINÉ ===');
    
    alert('Reset effectué avec succès! Vous pouvez maintenant recommencer le processus.');

  } catch (error) {
    console.error('Erreur lors du reset:', error);
    logDiagnostic('Erreur lors du reset', error);
    alert(`Erreur lors du reset: ${error.message}`);
  }
}

// Bouton de reset
if (resetBtn) {
  resetBtn.addEventListener('click', performFullReset);
}
