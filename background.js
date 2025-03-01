/**
 * Script d'arrière-plan pour l'extension Reddit Opinions
 * Gère les événements d'installation, les mises à jour et les messages entre composants
 */

// Charger les polyfills pour Service Worker
self.importScripts('./js/utils/service-worker-polyfill.js');

// Utiliser la version Service Worker du service Gemini
self.importScripts('./js/services/gemini.service.worker.js');

// Initialisation du service Gemini
let geminiService = null;
try {
  geminiService = new self.GeminiService();
  
  // Initialiser le service Gemini
  geminiService.initialize().catch(error => {
    console.error('Erreur lors de l\'initialisation du service Gemini:', error);
  });
} catch (error) {
  console.error('Erreur lors de la création du service Gemini:', error);
}

// Écouter les messages des autres parties de l'extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message reçu dans le background:', request.action);
  
  // S'assurer que le service Gemini est initialisé
  if (!geminiService) {
    sendResponse({ success: false, message: 'Service Gemini non initialisé' });
    return false;
  }
  
  // Traiter les différentes actions
  switch (request.action) {
    case 'clearCache':
      geminiService.clearCache()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('Erreur lors du nettoyage du cache:', error);
          sendResponse({ success: false, message: error.message });
        });
      return true; // Indique que la réponse sera envoyée de manière asynchrone
      
    case 'testOAuth':
      geminiService.getAccessToken()
        .then(token => {
          sendResponse({ 
            success: true, 
            message: 'Authentification OAuth2 réussie',
            token: token.substring(0, 10) + '...' // Ne pas envoyer le token complet pour des raisons de sécurité
          });
        })
        .catch(error => {
          console.error('Erreur lors du test OAuth:', error);
          sendResponse({ 
            success: false, 
            message: `Erreur d'authentification: ${error.message}` 
          });
        });
      return true; // Indique que la réponse sera envoyée de manière asynchrone
      
    case 'generateSummary':
      console.log('Demande de génération de résumé reçue');
      if (!request.pageContent) {
        sendResponse({ success: false, message: 'Données de page manquantes' });
        return false;
      }
      
      geminiService.generateSummary(request.pageContent, request.forceRefresh)
        .then(result => {
          console.log('Résumé généré avec succès');
          sendResponse({ success: true, data: result });
        })
        .catch(error => {
          console.error('Erreur lors de la génération du résumé:', error);
          sendResponse({ 
            success: false, 
            message: `Erreur: ${error.message}` 
          });
        });
      return true; // Indique que la réponse sera envoyée de manière asynchrone
      
    case 'getApiKey':
      chrome.storage.local.get('apiKey', (data) => {
        sendResponse({ apiKey: data.apiKey || '' });
      });
      return true; // Indique que la réponse sera envoyée de manière asynchrone
      
    case 'checkRedditPage':
      const isRedditPage = sender.tab?.url?.includes('reddit.com');
      sendResponse({ isRedditPage });
      return false;
      
    default:
      sendResponse({ success: false, message: 'Action non reconnue' });
      return false;
  }
});

// Écouter les changements dans les paramètres
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.maxComments) {
    console.log(`Limite de commentaires modifiée: ${changes.maxComments.oldValue} -> ${changes.maxComments.newValue}`);
    
    // Mettre à jour la limite dans le service Gemini
    if (geminiService) {
      geminiService.setMaxComments(parseInt(changes.maxComments.newValue));
      console.log(`MAX_COMMENTS mis à jour dans le service: ${geminiService.MAX_COMMENTS}`);
    }
  }
});

// Événement d'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installée ou mise à jour:', details.reason);
  
  // Initialiser les paramètres par défaut si c'est une nouvelle installation
  if (details.reason === 'install') {
    chrome.storage.local.set({
      apiKey: '',
      authMethod: 'apiKey', // API Key par défaut
      maxComments: 150,
      cacheEnabled: true,
      cacheExpiration: 24, // heures
      theme: 'auto',
      savedAnalyses: []
    }, () => {
      console.log('Paramètres par défaut initialisés');
    });
  } else if (details.reason === 'update') {
    // Logique de mise à jour si nécessaire
    console.log('Extension mise à jour vers la version', chrome.runtime.getManifest().version);
  }
});

// Fonction pour nettoyer périodiquement le cache expiré
function cleanupExpiredCache() {
  chrome.storage.local.get(['analysisCache', 'cacheExpiration'], (data) => {
    const cache = data.analysisCache || {};
    const expirationHours = data.cacheExpiration || 24;
    const expirationMs = expirationHours * 60 * 60 * 1000;
    const now = Date.now();
    
    const updatedCache = {};
    let entriesRemoved = 0;
    
    for (const key in cache) {
      const entry = cache[key];
      if (entry.timestamp && (now - entry.timestamp) < expirationMs) {
        updatedCache[key] = entry;
      } else {
        entriesRemoved++;
      }
    }
    
    if (entriesRemoved > 0) {
      chrome.storage.local.set({ analysisCache: updatedCache });
      console.log(`${entriesRemoved} entrées de cache expirées ont été supprimées`);
    }
  });
}

// Nettoyer le cache toutes les 12 heures
setInterval(cleanupExpiredCache, 12 * 60 * 60 * 1000);

// Nettoyer le cache au démarrage
cleanupExpiredCache();

console.log('Service Worker de l\'extension Reddit Opinions initialisé');
