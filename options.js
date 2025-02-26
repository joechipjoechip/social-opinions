/**
 * Script de gestion des options de l'extension Reddit Opinions
 */

// Éléments du DOM
const apiKeyInput = document.getElementById('apiKey');
const maxCommentsInput = document.getElementById('maxComments');
const cacheEnabledSelect = document.getElementById('cacheEnabled');
const cacheExpirationSelect = document.getElementById('cacheExpiration');
const themeSelect = document.getElementById('theme');
const saveButton = document.getElementById('saveBtn');
const resetButton = document.getElementById('resetBtn');
const clearCacheButton = document.getElementById('clearCacheBtn');
const statusMessage = document.getElementById('statusMessage');
const analysisHistoryContainer = document.getElementById('analysisHistory');
const authMethodSelect = document.getElementById('authMethod');
const apiKeyRow = document.getElementById('apiKeyRow');
const oauth2Row = document.getElementById('oauth2Row');

// Valeurs par défaut
const defaultSettings = {
  apiKey: '',
  maxComments: 150,
  cacheEnabled: 'true',
  cacheExpiration: '24',
  theme: 'auto',
  authMethod: 'apiKey',
  savedAnalyses: []
};

// Chargement des paramètres
document.addEventListener('DOMContentLoaded', loadSettings);

// Écouteurs d'événements
saveButton.addEventListener('click', saveSettings);
resetButton.addEventListener('click', resetSettings);
clearCacheButton.addEventListener('click', clearCache);
authMethodSelect.addEventListener('change', toggleAuthMethod);

/**
 * Charge les paramètres depuis le stockage local
 */
function loadSettings() {
  chrome.storage.local.get(defaultSettings, (settings) => {
    apiKeyInput.value = settings.apiKey || '';
    maxCommentsInput.value = settings.maxComments || 150;
    cacheEnabledSelect.value = settings.cacheEnabled || 'true';
    cacheExpirationSelect.value = settings.cacheExpiration || '24';
    themeSelect.value = settings.theme || 'auto';
    authMethodSelect.value = settings.authMethod || 'apiKey';
    
    // Afficher/masquer les options d'authentification en fonction de la méthode choisie
    toggleAuthMethod();
    
    // Charger l'historique des analyses
    loadAnalysisHistory(settings.savedAnalyses);
    
    // Appliquer le thème
    applyTheme(settings.theme);
  });
}

/**
 * Affiche ou masque les options d'authentification en fonction de la méthode choisie
 */
function toggleAuthMethod() {
  const authMethod = authMethodSelect.value;
  
  if (authMethod === 'oauth2') {
    apiKeyRow.style.display = 'none';
    oauth2Row.style.display = 'flex';
  } else {
    apiKeyRow.style.display = 'flex';
    oauth2Row.style.display = 'none';
  }
}

/**
 * Enregistre les paramètres dans le stockage local
 */
function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  const maxComments = parseInt(maxCommentsInput.value, 10);
  const cacheEnabled = cacheEnabledSelect.value === 'true';
  const cacheExpiration = parseInt(cacheExpirationSelect.value, 10);
  const theme = themeSelect.value;
  const authMethod = authMethodSelect.value;
  
  // Validation des entrées
  if (maxComments < 10 || maxComments > 500) {
    showStatus('Le nombre de commentaires doit être entre 10 et 500', 'error');
    return;
  }
  
  chrome.storage.local.set({
    apiKey,
    maxComments,
    cacheEnabled,
    cacheExpiration,
    theme,
    authMethod
  }, () => {
    showStatus('Paramètres enregistrés avec succès', 'success');
    
    // Appliquer le nouveau thème
    applyTheme(theme);
  });
}

/**
 * Réinitialise les options aux valeurs par défaut
 */
function resetSettings() {
  if (confirm('Voulez-vous vraiment réinitialiser tous les paramètres aux valeurs par défaut ?')) {
    const defaultOptions = {
      apiKey: '',
      maxComments: 150,
      cacheEnabled: true,
      cacheExpiration: 24,
      theme: 'auto',
      authMethod: 'apiKey'
    };
    
    // Mettre à jour l'interface
    apiKeyInput.value = defaultOptions.apiKey;
    maxCommentsInput.value = defaultOptions.maxComments;
    cacheEnabledSelect.value = defaultOptions.cacheEnabled.toString();
    cacheExpirationSelect.value = defaultOptions.cacheExpiration.toString();
    themeSelect.value = defaultOptions.theme;
    authMethodSelect.value = defaultOptions.authMethod;
    
    // Sauvegarder les valeurs par défaut
    chrome.storage.local.set(defaultOptions, () => {
      showStatus('Paramètres réinitialisés aux valeurs par défaut', 'success');
      
      // Appliquer le thème par défaut
      applyTheme(defaultOptions.theme);
    });
  }
}

/**
 * Efface le cache des analyses
 */
function clearCache() {
  // Importer le service Gemini
  import('./js/services/gemini.service.js')
    .then(module => {
      const GeminiService = module.default;
      const geminiService = new GeminiService();
      
      // Effacer le cache
      geminiService.clearCache()
        .then(() => {
          showStatus('Cache effacé avec succès', 'success');
        })
        .catch(error => {
          console.error('Erreur lors du nettoyage du cache:', error);
          showStatus('Erreur lors du nettoyage du cache', 'error');
        });
    })
    .catch(error => {
      console.error('Erreur lors du chargement du service Gemini:', error);
      showStatus('Erreur lors du chargement du service', 'error');
    });
}

/**
 * Affiche un message de statut
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message ('success' ou 'error')
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
  statusMessage.style.display = 'block';
  
  // Masquer le message après 3 secondes
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

/**
 * Charge l'historique des analyses
 * @param {Array} analyses - Liste des analyses sauvegardées
 */
function loadAnalysisHistory(analyses) {
  if (!analyses || analyses.length === 0) {
    analysisHistoryContainer.innerHTML = '<p>Aucune analyse sauvegardée</p>';
    return;
  }
  
  let html = '';
  
  analyses.forEach((analysis, index) => {
    const date = new Date(analysis.date);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    html += `
      <div class="history-item" data-index="${index}">
        <div class="history-title">${analysis.title || 'Analyse sans titre'}</div>
        <div class="history-meta">
          <span>${formattedDate}</span>
          <a href="${analysis.url}" target="_blank">Voir sur Reddit</a>
        </div>
        <div class="history-actions">
          <button class="secondary-button view-analysis-btn" data-index="${index}">Voir</button>
          <button class="secondary-button export-analysis-btn" data-index="${index}">Exporter</button>
          <button class="secondary-button delete-analysis-btn" data-index="${index}">Supprimer</button>
        </div>
      </div>
    `;
  });
  
  analysisHistoryContainer.innerHTML = html;
  
  // Ajouter les écouteurs d'événements pour les boutons
  document.querySelectorAll('.view-analysis-btn').forEach(btn => {
    btn.addEventListener('click', (e) => viewAnalysis(parseInt(e.target.dataset.index, 10)));
  });
  
  document.querySelectorAll('.export-analysis-btn').forEach(btn => {
    btn.addEventListener('click', (e) => exportAnalysis(parseInt(e.target.dataset.index, 10)));
  });
  
  document.querySelectorAll('.delete-analysis-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteAnalysis(parseInt(e.target.dataset.index, 10)));
  });
}

/**
 * Affiche une analyse sauvegardée
 * @param {number} index - Index de l'analyse dans la liste
 */
function viewAnalysis(index) {
  chrome.storage.local.get('savedAnalyses', (items) => {
    const analyses = items.savedAnalyses || [];
    if (index >= 0 && index < analyses.length) {
      // Ouvrir un nouvel onglet avec les données de l'analyse
      const analysisData = JSON.stringify(analyses[index].data, null, 2);
      const blob = new Blob([analysisData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      chrome.tabs.create({ url: url });
    }
  });
}

/**
 * Exporte une analyse sauvegardée
 * @param {number} index - Index de l'analyse dans la liste
 */
function exportAnalysis(index) {
  chrome.storage.local.get('savedAnalyses', (items) => {
    const analyses = items.savedAnalyses || [];
    if (index >= 0 && index < analyses.length) {
      const analysis = analyses[index];
      const date = new Date(analysis.date).toISOString().slice(0, 10);
      const filename = `reddit-analysis-${date}.json`;
      
      // Créer un lien de téléchargement
      const analysisData = JSON.stringify(analysis.data, null, 2);
      const blob = new Blob([analysisData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  });
}

/**
 * Supprime une analyse sauvegardée
 * @param {number} index - Index de l'analyse dans la liste
 */
function deleteAnalysis(index) {
  if (confirm('Voulez-vous vraiment supprimer cette analyse ?')) {
    chrome.storage.local.get('savedAnalyses', (items) => {
      const analyses = items.savedAnalyses || [];
      if (index >= 0 && index < analyses.length) {
        analyses.splice(index, 1);
        
        chrome.storage.local.set({ savedAnalyses: analyses }, () => {
          loadAnalysisHistory(analyses);
          showStatus('Analyse supprimée avec succès', 'success');
        });
      }
    });
  }
}

/**
 * Applique le thème sélectionné
 * @param {string} theme - Thème à appliquer ('auto', 'light' ou 'dark')
 */
function applyTheme(theme) {
  if (theme === 'auto') {
    // Utiliser le thème du système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    // Écouter les changements de thème du système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (e.matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });
  } else if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}
