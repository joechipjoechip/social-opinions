/**
 * Script d'arrière-plan pour l'extension Reddit Opinions
 * Gère les événements d'installation, les mises à jour et les messages entre composants
 */

// Événement d'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Initialisation des paramètres par défaut
    chrome.storage.local.set({
      apiKey: '',
      maxComments: 150,
      cacheEnabled: true,
      cacheExpiration: 24, // heures
      theme: 'auto',
      savedAnalyses: []
    });
    
    // Ouvrir la page d'options après l'installation
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    // Logique de mise à jour si nécessaire
    console.log('Extension mise à jour vers la version', chrome.runtime.getManifest().version);
  }
});

// Écouteur pour les messages provenant du popup ou des scripts de contenu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Gestion des différents types de messages
  if (request.action === 'getApiKey') {
    chrome.storage.local.get('apiKey', (data) => {
      sendResponse({ apiKey: data.apiKey || '' });
    });
    return true; // Indique que la réponse sera envoyée de manière asynchrone
  }
  
  if (request.action === 'clearCache') {
    clearAnalysisCache()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'checkRedditPage') {
    const isRedditPage = sender.tab?.url?.includes('reddit.com');
    sendResponse({ isRedditPage });
  }
});

/**
 * Efface le cache des analyses
 * @returns {Promise} Promesse résolue lorsque le cache est effacé
 */
async function clearAnalysisCache() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get('analysisCache', (data) => {
        const cache = data.analysisCache || {};
        
        // Conserver uniquement les métadonnées des analyses
        const cleanedCache = {};
        for (const key in cache) {
          if (cache[key].metadata) {
            cleanedCache[key] = { 
              metadata: cache[key].metadata,
              timestamp: cache[key].timestamp
            };
          }
        }
        
        chrome.storage.local.set({ analysisCache: cleanedCache }, () => {
          resolve();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

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
