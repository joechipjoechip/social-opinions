import GeminiService from './js/services/gemini.service.js';
import { Visualizations } from './js/visualizations.js';
import { RedditAnalysis } from './js/models/reddit-analysis.model.js';
import { formatNumber, truncateText, debounce } from './js/utils/helpers.js';

// Initialisation des composants
const geminiService = new GeminiService();
const visualizations = new Visualizations();
let currentAnalysis = null;

/**
 * Affiche la vue d'ensemble de l'analyse
 * @param {RedditAnalysis} data - Données d'analyse
 */
function displayOverview(data) {
    const overviewContent = document.getElementById('overviewContent');
    
    if (!data || !data.overview) {
        overviewContent.innerHTML = '<p class="error">Données non disponibles</p>';
        return;
    }
    
    overviewContent.innerHTML = `
        <div class="stat-value">${formatNumber(data.overview.totalComments)}</div>
        <p>commentaires analysés</p>
        <p><strong>Opinion dominante :</strong> ${data.overview.mainOpinion}</p>
        <p><strong>Niveau de consensus :</strong> ${Math.round(data.overview.consensusLevel * 100)}%</p>
        <p><strong>Subreddit :</strong> ${data.metadata?.postTitle ? data.metadata.postTitle.substring(0, 30) + '...' : 'N/A'}</p>
    `;
}

/**
 * Affiche les commentaires les plus populaires
 * @param {RedditAnalysis} data - Données d'analyse
 */
function displayTopComments(data) {
    const topCommentsContent = document.getElementById('topCommentsContent');
    
    if (!data || !data.opinionClusters || data.opinionClusters.length === 0) {
        topCommentsContent.innerHTML = '<p class="error">Aucun commentaire disponible</p>';
        return;
    }
    
    const topOpinions = data.opinionClusters
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 3);

    topCommentsContent.innerHTML = topOpinions.map(opinion => `
        <div class="stat-card">
            <p><strong>${opinion.opinion}</strong></p>
            <p>${truncateText(opinion.representativeComment, 120)}</p>
            <div class="comment-stats">
                <span>Votes: <strong>${formatNumber(opinion.totalVotes)}</strong></span>
                <span>Commentaires: <strong>${formatNumber(opinion.commentCount)}</strong></span>
            </div>
        </div>
    `).join('');
}

/**
 * Affiche les points de controverse
 * @param {RedditAnalysis} data - Données d'analyse
 */
function displayControversialPoints(data) {
    const controversialContent = document.getElementById('controversialContent');
    
    if (!data || !data.frictionPoints || data.frictionPoints.length === 0) {
        controversialContent.innerHTML = '<p class="error">Aucun point de désaccord identifié</p>';
        return;
    }
    
    controversialContent.innerHTML = data.frictionPoints.map(point => `
        <div class="controversy-item">
            <div class="controversy-header">
                <strong>${point.topic}</strong>
                <span class="intensity">Intensité: ${Math.round(point.intensityScore * 10)}/10</span>
            </div>
            <div class="controversy-positions">
                <div class="position position-1">
                    <strong>Position 1 (${formatNumber(point.opinion1.votes)} votes):</strong>
                    <p>${point.opinion1.stance}</p>
                </div>
                <div class="position position-2">
                    <strong>Position 2 (${formatNumber(point.opinion2.votes)} votes):</strong>
                    <p>${point.opinion2.stance}</p>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Affiche un message d'erreur dans l'interface
 * @param {string} title - Titre de l'erreur
 * @param {string} message - Message d'erreur (peut contenir du HTML)
 */
function displayError(title, message) {
    showError(message);
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Masquer après 5 secondes
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Affiche un message de succès
 * @param {string} message - Message de succès
 */
function showSuccess(message) {
    // Créer un élément de succès s'il n'existe pas
    let successDiv = document.getElementById('success');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'success';
        successDiv.className = 'success';
        document.body.appendChild(successDiv);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Masquer après 3 secondes
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

/**
 * Sauvegarde l'analyse actuelle dans le stockage local
 * @param {RedditAnalysis} analysis - Données d'analyse
 */
async function saveAnalysisToStorage(analysis) {
    try {
        // Limiter le nombre d'analyses sauvegardées à 10
        const savedAnalyses = await chrome.storage.local.get('savedAnalyses');
        const analyses = savedAnalyses.savedAnalyses || [];
        
        // Ajouter la nouvelle analyse
        analyses.unshift({
            url: analysis.metadata.postUrl,
            title: analysis.metadata.postTitle,
            date: analysis.metadata.createdAt,
            data: analysis
        });
        
        // Limiter à 10 analyses
        const limitedAnalyses = analyses.slice(0, 10);
        
        await chrome.storage.local.set({ 'savedAnalyses': limitedAnalyses });
        console.log('Analyse sauvegardée');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'analyse:', error);
    }
}

/**
 * Vérifie la configuration de l'authentification
 */
async function checkAuthentication() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authMethod', 'apiKey'], (data) => {
      const authMethod = data.authMethod || 'apiKey';
      
      if (authMethod === 'oauth2') {
        // Vérifier l'authentification OAuth2
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (chrome.runtime.lastError || !token) {
            resolve({
              isConfigured: false,
              message: "L'authentification OAuth2 n'est pas configurée. Cliquez pour vous connecter ou utiliser une clé API.",
              authMethod: 'oauth2'
            });
          } else {
            resolve({ isConfigured: true, authMethod: 'oauth2' });
          }
        });
      } else {
        // Vérifier la clé API
        const apiKey = data.apiKey;
        if (!apiKey) {
          resolve({
            isConfigured: false,
            message: "Clé API Gemini non configurée. Veuillez la définir dans les paramètres.",
            authMethod: 'apiKey'
          });
        } else {
          resolve({ isConfigured: true, authMethod: 'apiKey' });
        }
      }
    });
  });
}

/**
 * Initialise l'authentification OAuth2 si nécessaire
 */
function initAuthentication() {
  const configureAuthBtn = document.getElementById('configureAuth');
  
  // Vérifier que l'élément existe
  if (!configureAuthBtn) {
    console.error("Élément 'configureAuth' introuvable dans le DOM");
    return;
  }
  
  chrome.storage.local.get(['authMethod'], (data) => {
    const authMethod = data.authMethod || 'apiKey';
    
    if (authMethod === 'oauth2') {
      configureAuthBtn.addEventListener('click', () => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            showError(`Erreur d'authentification: ${errorMsg}`);
            
            // Si l'erreur est liée à l'ID client, proposer de basculer vers la clé API
            if (errorMsg.includes('bad client id') || errorMsg.includes('OAuth2')) {
              if (confirm("Problème avec l'authentification OAuth2. Voulez-vous basculer vers l'authentification par clé API?")) {
                chrome.storage.local.set({ authMethod: 'apiKey' }, () => {
                  chrome.runtime.openOptionsPage();
                });
              }
            }
          } else if (token) {
            document.getElementById('authWarning').style.display = 'none';
            showSuccess('Authentification réussie');
          }
        });
      });
    } else {
      configureAuthBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }
  });
}

/**
 * Initialise l'interface utilisateur
 */
document.addEventListener('DOMContentLoaded', async function() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const exportBtn = document.getElementById('exportBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // Sélectionner le premier conteneur de visualisation pour le masquer initialement
    const visualizationContainers = document.querySelectorAll('.visualization-container');
    if (visualizationContainers.length > 0) {
        visualizationContainers.forEach(container => {
            container.style.display = 'none';
        });
    }
    
    // Vérifier la configuration de l'authentification
    const authStatus = await checkAuthentication();
    
    if (!authStatus.isConfigured) {
        const authWarning = document.getElementById('authWarning');
        if (authWarning) {
            authWarning.style.display = 'block';
            authWarning.innerHTML = `<p>${authStatus.message}</p>
            <button id="configureAuth" class="primary-button">Configurer</button>`;
            
            initAuthentication();
        }
    }
    
    // Fonction d'analyse debouncée pour éviter les clics multiples
    const debouncedAnalyze = debounce(async () => {
        try {
            // Réinitialiser l'UI
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            visualizationContainers.forEach(container => {
                container.style.display = 'none';
            });
            summarizeBtn.disabled = true;
            
            // Vérifier l'authentification
            const authStatus = await checkAuthentication();
            
            if (!authStatus.isConfigured) {
                loadingDiv.style.display = 'none';
                summarizeBtn.disabled = false;
                
                const authWarning = document.getElementById('authWarning');
                if (authWarning) {
                    authWarning.style.display = 'block';
                    let message = `<p>${authStatus.message}</p>`;
                    
                    // Afficher un message différent selon la méthode d'authentification
                    if (authStatus.authMethod === 'oauth2') {
                        message += `<p>Vous pouvez également utiliser une clé API Gemini.</p>`;
                    }
                    
                    message += `<button id="configureAuth" class="primary-button">Configurer</button>`;
                    authWarning.innerHTML = message;
                    
                    initAuthentication();
                }
                return;
            }
            
            // Récupérer et analyser les données
            const content = await geminiService.getPageContent();
            
            // Vérifier si le contenu a été récupéré correctement
            if (!content || content.error) {
                throw new Error(content.error || 'Impossible de récupérer le contenu de la page');
            }
            
            // Vérifier si nous sommes sur Reddit
            if (!content.url.includes('reddit.com')) {
                throw new Error('Cette extension fonctionne uniquement sur Reddit');
            }
            
            // Vérifier s'il y a des commentaires
            if (!content.comments || content.comments.length === 0) {
                throw new Error('Aucun commentaire trouvé sur cette page. Assurez-vous d\'être sur une page de discussion Reddit avec des commentaires visibles.');
            }
            
            // Générer l'analyse
            const analysisData = await geminiService.generateSummary(content);
            
            // Créer une instance du modèle RedditAnalysis
            currentAnalysis = new RedditAnalysis(analysisData);
            
            // Ajouter les métadonnées
            currentAnalysis.metadata = {
                createdAt: new Date().toISOString(),
                postUrl: content.url,
                postTitle: content.postTitle,
                commentCount: content.commentCount,
                analysisVersion: '1.0',
                quotaExceeded: analysisData._quotaExceeded || false
            };
            
            // Afficher un avertissement si l'analyse est limitée en raison du quota dépassé
            if (currentAnalysis.metadata.quotaExceeded) {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'warning-message';
                warningDiv.innerHTML = `
                    <p><strong>⚠️ Analyse limitée</strong> - Le quota d'API Gemini a été dépassé.</p>
                    <p>L'analyse affichée est basique et ne reflète pas toute la richesse des commentaires.</p>
                    <p>Veuillez réessayer plus tard ou configurer une autre clé API dans les paramètres.</p>
                `;
                
                // Trouver un parent approprié pour insérer l'avertissement
                const contentContainer = document.getElementById('content-container');
                if (contentContainer) {
                    // Insérer au début du conteneur de contenu
                    contentContainer.insertBefore(warningDiv, contentContainer.firstChild);
                } else {
                    // Fallback: ajouter à la fin du body
                    document.body.appendChild(warningDiv);
                }
            }
            
            // Créer les visualisations
            visualizations.createOpinionClusterChart(currentAnalysis);
            visualizations.createScoresChart(currentAnalysis);
            visualizations.createConsensusChart(currentAnalysis);
            
            // Afficher les données textuelles
            displayOverview(currentAnalysis);
            displayTopComments(currentAnalysis);
            displayControversialPoints(currentAnalysis);
            
            // Sauvegarder l'analyse
            await saveAnalysisToStorage(currentAnalysis);
            
            // Afficher les résultats
            visualizationContainers.forEach(container => {
                container.style.display = 'block';
            });
            
        } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            
            // Afficher l'erreur à l'utilisateur
            const errorDiv = document.getElementById('error');
            
            // Vérifier si l'erreur est liée au quota
            if (error.message.includes('quota') || error.message.includes('limit') || error.message.includes('rate')) {
                errorDiv.innerHTML = `
                    <h3>Erreur de quota API</h3>
                    <p>${error.message}</p>
                    <p>Suggestions :</p>
                    <ul>
                        <li>Attendez quelques minutes et réessayez</li>
                        <li>Utilisez une autre clé API dans les paramètres</li>
                        <li>Réduisez le nombre de commentaires analysés dans les paramètres</li>
                    </ul>
                    <button id="goToSettings" class="primary-button">Configurer l'API</button>
                `;
                
                // Ajouter un gestionnaire d'événements pour le bouton de configuration
                document.getElementById('goToSettings').addEventListener('click', () => {
                    chrome.runtime.openOptionsPage();
                });
            } 
            // Vérifier si l'erreur est liée à l'authentification
            else if (error.message.includes('authentification') || 
                     error.message.includes('API key') || 
                     error.message.includes('clé API') ||
                     error.message.includes('OAuth') ||
                     error.message.includes('client id')) {
                
                // Afficher l'avertissement d'authentification
                const authWarning = document.getElementById('authWarning');
                if (authWarning) {
                    authWarning.style.display = 'block';
                    
                    let message = `<p>Erreur d'authentification: ${error.message}</p>`;
                    
                    // Si l'erreur est liée à OAuth2, proposer de basculer vers la clé API
                    if (error.message.includes('OAuth') || error.message.includes('client id')) {
                        message += `<p>L'authentification OAuth2 a échoué. Vous pouvez basculer vers l'authentification par clé API.</p>`;
                        message += `<button id="switchToApiKey" class="secondary-button">Utiliser la clé API</button> `;
                    }
                    
                    message += `<button id="configureAuth" class="primary-button">Configurer</button>`;
                    authWarning.innerHTML = message;
                    
                    // Initialiser le bouton de configuration
                    initAuthentication();
                    
                    // Ajouter un écouteur pour le bouton de basculement vers la clé API
                    const switchBtn = document.getElementById('switchToApiKey');
                    if (switchBtn) {
                        switchBtn.addEventListener('click', () => {
                            chrome.storage.local.set({ authMethod: 'apiKey' }, () => {
                                showSuccess('Basculé vers l\'authentification par clé API');
                                chrome.runtime.openOptionsPage();
                            });
                        });
                    }
                }
                
                // Masquer l'indicateur de chargement
                document.getElementById('loading').style.display = 'none';
            }
            else if (error.message.includes('Node') || error.message.includes('DOM')) {
                // Erreur DOM - essayer de récupérer
                errorDiv.innerHTML = `
                    <h3>Erreur d'affichage</h3>
                    <p>Une erreur s'est produite lors de l'affichage des résultats.</p>
                    <button id="retryButton" class="primary-button">Réessayer</button>
                `;
                
                // Ajouter un gestionnaire d'événements pour le bouton de réessai
                document.getElementById('retryButton').addEventListener('click', () => {
                    location.reload();
                });
                
                errorDiv.style.display = 'block';
                document.getElementById('loading').style.display = 'none';
            } else {
                // Erreur générique
                errorDiv.innerHTML = `
                    <h3>Erreur</h3>
                    <p>${error.message}</p>
                    <button id="retryButton" class="primary-button">Réessayer</button>
                `;
                
                // Ajouter un gestionnaire d'événements pour le bouton de réessai
                document.getElementById('retryButton').addEventListener('click', () => {
                    location.reload();
                });
                
                errorDiv.style.display = 'block';
                document.getElementById('loading').style.display = 'none';
            }
        } finally {
            loadingDiv.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    }, 500);
    
    // Attacher les écouteurs d'événements
    summarizeBtn.addEventListener('click', debouncedAnalyze);
    
    // Bouton de configuration
    settingsBtn?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
    
    // Fonction d'exportation des données
    exportBtn?.addEventListener('click', () => {
        if (!currentAnalysis) {
            displayError('Aucune analyse à exporter');
            return;
        }
        
        try {
            const jsonData = JSON.stringify(currentAnalysis, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Créer un lien de téléchargement
            const a = document.createElement('a');
            a.href = url;
            a.download = `reddit-analysis-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            
            // Nettoyer
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Erreur lors de l\'exportation:', error);
            displayError('Erreur lors de l\'exportation des données', error.message);
        }
    });
});
