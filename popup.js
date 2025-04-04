// Importation des services et des utilitaires
// Note: GeminiService est également disponible globalement pour les Service Workers
import GeminiService from './js/services/gemini.service.js';
import { Visualizations } from './js/visualizations.js';
import { RedditAnalysis } from './js/models/reddit-analysis.model.js';
import { formatNumber, truncateText, debounce } from './js/utils/helpers.js';
import { CollapsibleSections, CommentHierarchy, BubbleOpinions } from './js/ui/index.js';

// Initialisation des composants
const geminiService = new GeminiService();
const visualizations = new Visualizations();
let currentAnalysis = null;
let collapsibleSections = null;
let commentHierarchy = null;

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
    
    // Calculer le niveau de consensus si non défini
    const consensusLevel = data.overview.consensusLevel || 
                          (data.controversyScore ? (100 - data.controversyScore) / 100 : 0.5);
    
    // Afficher le nombre de commentaires extraits directement
    overviewContent.innerHTML = `
        <div class="stat-value">${formatNumber(data.extractedCommentsCount || data.overview.totalComments)}</div>
        <p>commentaires extraits</p>
        <p><strong>Opinion dominante :</strong> ${data.overview.mainOpinion}</p>
        <p><strong>Niveau de consensus :</strong> ${Math.round(consensusLevel * 100)}%</p>
        ${data.metadata?.postTitle ? 
            `<p><strong>Subreddit :</strong> ${truncateText(data.metadata.postTitle, 30)}</p>` : ''}
    `;
}

/**
 * Affiche les commentaires les plus populaires
 * @param {RedditAnalysis} data - Données d'analyse
 */
function displayTopComments(data) {
    const topCommentsContent = document.getElementById('topCommentsContent');
    
    if (!data) {
        topCommentsContent.innerHTML = '<p class="error">Aucune donnée disponible</p>';
        return;
    }
    
    // Utiliser les topComments s'ils existent, sinon utiliser les opinionClusters
    if (data.topComments && data.topComments.length > 0) {
        const comments = data.topComments.slice(0, 3);
        
        topCommentsContent.innerHTML = comments.map(comment => `
            <div class="comment-card">
                <p class="comment-text">${truncateText(comment.text, 120)}</p>
                <div class="comment-meta">
                    <span class="votes">${formatNumber(comment.votes)} votes</span>
                    <span class="sentiment ${comment.sentiment > 0 ? 'positive' : comment.sentiment < 0 ? 'negative' : 'neutral'}">
                        ${comment.sentiment > 0.3 ? '😊' : comment.sentiment < -0.3 ? '😠' : '😐'}
                    </span>
                </div>
            </div>
        `).join('');
    } else {
        const topOpinions = data.opinionClusters
            .sort((a, b) => b.totalVotes - a.totalVotes)
            .slice(0, 3);

        topCommentsContent.innerHTML = topOpinions.map(opinion => `
            <div class="comment-card">
                <p class="comment-text"><strong>${opinion.opinion}</strong></p>
                <p class="comment-text">${truncateText(opinion.representativeComment, 100)}</p>
                <div class="comment-meta">
                    <span class="votes">${formatNumber(opinion.totalVotes)} votes</span>
                </div>
            </div>
        `).join('');
    }
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
    
    // Trier par intensité et prendre les 3 premiers
    const topFrictionPoints = data.frictionPoints
        .sort((a, b) => b.intensityScore - a.intensityScore)
        .slice(0, 3);
    
    controversialContent.innerHTML = topFrictionPoints.map(point => {
        // Vérifier si le point a la structure attendue
        const hasOpinions = point.opinion1 && point.opinion2;
        
        if (hasOpinions) {
            return `
                <div class="friction-point">
                    <p class="friction-topic">${point.topic} <span class="intensity-badge">Intensité: ${point.intensityScore.toFixed(1)}/10</span></p>
                    <div class="friction-opinions">
                        <div class="opinion">
                            <span class="opinion-text">${point.opinion1.text || point.opinion1.stance}</span>
                            <span class="opinion-votes">${formatNumber(point.opinion1.votes)} votes</span>
                        </div>
                        <div class="opinion-divider">vs</div>
                        <div class="opinion">
                            <span class="opinion-text">${point.opinion2.text || point.opinion2.stance}</span>
                            <span class="opinion-votes">${formatNumber(point.opinion2.votes)} votes</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Format alternatif si la structure est différente
            return `
                <div class="friction-point">
                    <p class="friction-topic">${point.topic} <span class="intensity-badge">Intensité: ${point.intensityScore.toFixed(1)}/10</span></p>
                    <p class="friction-description">Point de désaccord majeur dans la discussion</p>
                </div>
            `;
        }
    }).join('');
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
 * Affiche la hiérarchie des commentaires
 * @param {RedditAnalysis} data - Données d'analyse
 */
function displayCommentHierarchy(data) {
    const hierarchyContainer = document.getElementById('commentHierarchyContent');
    
    if (!hierarchyContainer) {
        console.error("Conteneur de hiérarchie des commentaires non trouvé");
        return;
    }
    
    if (!data || (!data.hierarchicalComments && !data.content?.hierarchicalComments)) {
        hierarchyContainer.innerHTML = '<p class="error">Aucune donnée hiérarchique disponible</p>';
        return;
    }
    
    // Utiliser les données hiérarchiques directes ou celles du content
    const hierarchicalComments = data.hierarchicalComments || data.content?.hierarchicalComments || [];
    
    // Si aucune donnée hiérarchique n'est disponible
    if (!Array.isArray(hierarchicalComments) || hierarchicalComments.length === 0) {
        hierarchyContainer.innerHTML = '<p class="info-message">Aucun commentaire hiérarchique disponible</p>';
        return;
    }
    
    // S'assurer que l'instance de CommentHierarchy est initialisée
    if (!commentHierarchy) {
        commentHierarchy = new CommentHierarchy(hierarchyContainer);
    }
    
    // Préparer les données pour la hiérarchie et les opinions
    const hierarchyData = {
        hierarchicalComments: hierarchicalComments,
        mainOpinions: data.mainOpinions || [],
        opinionClusters: data.opinionClusters || []
    };
    
    // Rendre la hiérarchie avec les opinions intégrées
    commentHierarchy.render(hierarchyData);
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
    
    configureAuthBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
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
    const testDevUIBtn = document.getElementById('testDevUIBtn');
    const truncateTextBtn = document.getElementById('truncateTextBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    
    // Initialiser les sections rétractables
    collapsibleSections = new CollapsibleSections();
    
    // Initialiser la hiérarchie des commentaires
    const hierarchyContainer = document.getElementById('commentHierarchyContent');
    if (hierarchyContainer) {
        commentHierarchy = new CommentHierarchy(hierarchyContainer);
    }
    
    // Ajouter les écouteurs d'événements pour les boutons de contrôle des sections
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            collapsibleSections.expandAll();
        });
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            collapsibleSections.collapseAll();
        });
    }
    
    // Désactiver le bouton d'exportation jusqu'à ce qu'une analyse soit disponible
    if (exportBtn) {
        exportBtn.disabled = true;
    }
    
    // Masquer les sections de résumé au chargement initial
    const summarySection = document.getElementById('summary');
    if (summarySection) {
        summarySection.style.display = 'none';
    }
    
    // Masquer les visualisations au chargement initial
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
            loadingDiv.classList.remove('hidden');
            errorDiv.style.display = 'none';
            visualizationContainers.forEach(container => {
                container.style.display = 'none';
            });
            summarizeBtn.disabled = true;
            
            // Vérifier l'authentification
            const authStatus = await checkAuthentication();
            
            if (!authStatus.isConfigured) {
                loadingDiv.classList.add('hidden');
                summarizeBtn.disabled = false;
                
                const authWarning = document.getElementById('authWarning');
                if (authWarning) {
                    authWarning.style.display = 'block';
                    
                    let message = `<p>${authStatus.message}</p>`;
                    
                    message += `<button id="configureAuth" class="primary-button">Configurer</button>`;
                    authWarning.innerHTML = message;
                    
                    // Initialiser le bouton de configuration
                    initAuthentication();
                }
                return;
            }
            
            // Récupérer et analyser les données
            const content = await geminiService.getPageContent();
            
            // Vérifier si le contenu a été récupéré correctement
            if (!content) {
                throw new Error('Impossible de récupérer le contenu de la page');
            }
            
            if (content && content.error) {
                throw new Error(content.error);
            }
            
            // Vérifier si nous sommes sur Reddit ou Twitter
            if (!content.url || !(content.url.includes('reddit.com') || content.url.includes('twitter.com') || content.url.includes('x.com'))) {
                throw new Error('Cette extension fonctionne uniquement sur Reddit et Twitter/X');
            }
            
            // Vérifier s'il y a des commentaires
            if (!content.comments || content.comments.length === 0) {
                const platformName = content.url.includes('reddit.com') ? 'Reddit' : 'Twitter/X';
                throw new Error(`Aucun commentaire trouvé sur cette page. Assurez-vous d'être sur une page de discussion ${platformName} avec des commentaires visibles.`);
            }
            
            // Générer l'analyse
            let analysisData;
            try {
                // Utiliser le Service Worker pour générer l'analyse
                analysisData = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(
                        { 
                            action: 'generateSummary', 
                            pageContent: content,
                            forceRefresh: false
                        }, 
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('Erreur:', chrome.runtime.lastError);
                                reject(new Error(chrome.runtime.lastError.message));
                                return;
                            }
                            
                            if (response && response.success) {
                                resolve(response.data);
                            } else {
                                reject(new Error(response?.message || 'Échec de la génération du résumé'));
                            }
                        }
                    );
                });
            } catch (error) {
                console.error('Erreur lors de la génération du résumé:', error);
                throw new Error(`Erreur lors de l'analyse: ${error.message}`);
            }
            
            // Créer une instance du modèle RedditAnalysis
            if (!analysisData) {
                throw new Error("Données d'analyse manquantes ou invalides");
            }
            
            currentAnalysis = new RedditAnalysis(analysisData);
            
            // Ajouter les métadonnées avec vérification des valeurs undefined
            currentAnalysis.metadata = {
                createdAt: new Date().toISOString(),
                postUrl: content?.url || '',
                postTitle: content?.postTitle || '',
                commentCount: content?.commentCount || 0,
                analysisVersion: '1.0',
                quotaExceeded: analysisData._quotaExceeded || false,
                fromCache: analysisData._fromCache || false
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
            
            // Afficher une indication si les résultats proviennent du cache
            if (currentAnalysis.metadata.fromCache) {
                const cacheInfoDiv = document.createElement('div');
                cacheInfoDiv.className = 'info-message';
                cacheInfoDiv.innerHTML = `
                    <p><strong>ℹ️ Résultats en cache</strong> - Ces résultats proviennent du cache local.</p>
                    <p>Pour obtenir une nouvelle analyse, cliquez sur le bouton 🗑️ pour vider le cache, puis relancez l'analyse.</p>
                `;
                
                // Trouver un parent approprié pour insérer l'information
                const contentContainer = document.getElementById('content-container');
                if (contentContainer) {
                    // Insérer au début du conteneur de contenu
                    contentContainer.insertBefore(cacheInfoDiv, contentContainer.firstChild);
                } else {
                    // Fallback: ajouter à la fin du body
                    document.body.appendChild(cacheInfoDiv);
                }
            }
            
            // Créer les visualisations
            visualizations.createOpinionBubbleChart(currentAnalysis.opinionClusters || currentAnalysis.topComments || []);
            visualizations.createOpinionClusterChart(currentAnalysis);
            visualizations.createConsensusChart(currentAnalysis);
            visualizations.createControversyChart(currentAnalysis);
            visualizations.createOpinionGroupsChart(currentAnalysis);
            
            // Afficher les données textuelles
            displayOverview(currentAnalysis);
            displayTopComments(currentAnalysis);
            displayControversialPoints(currentAnalysis);
            
            // Afficher la hiérarchie des commentaires après les autres affichages
            displayCommentHierarchy(currentAnalysis);
            
            // Réinitialiser les sections rétractables après le chargement des données
            if (collapsibleSections) {
                // Réinitialiser les sections existantes
                collapsibleSections = new CollapsibleSections();
            }
            
            // Sauvegarder l'analyse
            await saveAnalysisToStorage(currentAnalysis);
            
            // Afficher les résultats
            visualizationContainers.forEach(container => {
                container.style.display = 'block';
            });
            
            // Afficher la section de résumé
            if (summarySection) {
                summarySection.style.display = 'grid';
            }
            
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
                    
                    message += `<button id="configureAuth" class="primary-button">Configurer</button>`;
                    authWarning.innerHTML = message;
                    
                    // Initialiser le bouton de configuration
                    initAuthentication();
                }
                
                // Masquer l'indicateur de chargement
                document.getElementById('loading').classList.add('hidden');
            }
            else if (error.message.includes('Node') || error.message.includes('DOM')) {
                // Erreur DOM - essayer de récupérer
                errorDiv.innerHTML = `
                    <h3>Erreur d'affichage</h3>
                    <p>Une erreur s'est produite lors de l'affichage des résultats.</p>
                    <button id="retryButton" class="primary-button">Réessayer</button>
                `;
                
                // Ajouter un gestionnaire d'événements pour le bouton de réessai
                const retryButton1 = document.getElementById('retryButton');
                if (retryButton1) {
                    retryButton1.addEventListener('click', () => {
                        location.reload();
                    });
                }
                
                errorDiv.style.display = 'block';
                const loadingElement1 = document.getElementById('loading');
                if (loadingElement1) {
                    loadingElement1.classList.add('hidden');
                }
            } else {
                // Erreur générique
                errorDiv.innerHTML = `
                    <h3>Erreur</h3>
                    <p>${error.message || 'Erreur inconnue'}</p>
                    <button id="retryButton" class="primary-button">Réessayer</button>
                `;
                
                // Ajouter un gestionnaire d'événements pour le bouton de réessai
                const retryButton2 = document.getElementById('retryButton');
                if (retryButton2) {
                    retryButton2.addEventListener('click', () => {
                        location.reload();
                    });
                }
                
                errorDiv.style.display = 'block';
                const loadingElement2 = document.getElementById('loading');
                if (loadingElement2) {
                    loadingElement2.classList.add('hidden');
                }
            }
        } finally {
            loadingDiv.classList.add('hidden');
            summarizeBtn.disabled = false;
        }
    }, 500);
    
    // Attacher les écouteurs d'événements
    summarizeBtn.addEventListener('click', debouncedAnalyze);
    
    // Gestion du bouton de troncature de texte
    if (truncateTextBtn) {
        // Récupérer l'état actuel de la troncature
        chrome.storage.local.get('truncateTextToOptimizePerformances', (data) => {
            const truncateText = data.truncateTextToOptimizePerformances !== undefined ? 
                data.truncateTextToOptimizePerformances : false;
            
            // Mettre à jour l'apparence du bouton selon l'état
            updateTruncateButtonAppearance(truncateTextBtn, truncateText);
            
            // Ajouter l'écouteur d'événement pour basculer l'état
            truncateTextBtn.addEventListener('click', () => {
                // Inverser l'état actuel
                const newTruncateState = !truncateText;
                
                // Sauvegarder le nouvel état
                chrome.storage.local.set({ truncateTextToOptimizePerformances: newTruncateState }, () => {
                    // Mettre à jour l'apparence du bouton
                    updateTruncateButtonAppearance(truncateTextBtn, newTruncateState);
                    
                    // Afficher un message de confirmation
                    showSuccess(`Troncature de texte ${newTruncateState ? 'activée' : 'désactivée'}`);
                    
                    // Recharger la page pour appliquer les changements
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                });
            });
        });
    }
    
    // Gestion du bouton "Test Dev UI"
    if (testDevUIBtn) {
        testDevUIBtn.addEventListener('click', () => {
            // Utiliser les données de test définies dans test-data.js
            if (typeof TEST_DATA !== 'undefined') {
                // Masquer le chargement et les erreurs
                loadingDiv.classList.add('hidden');
                errorDiv.style.display = 'none';
                
                // Créer une instance de RedditAnalysis avec les données de test
                const testAnalysis = new RedditAnalysis(TEST_DATA);
                currentAnalysis = testAnalysis;
                
                // Afficher les visualisations
                visualizationContainers.forEach(container => {
                    container.style.display = 'block';
                });
                if (summarySection) {
                    summarySection.style.display = 'grid';
                }
                
                // Afficher les données dans l'interface
                displayOverview(testAnalysis);
                displayTopComments(testAnalysis);
                displayControversialPoints(testAnalysis);
                displayCommentHierarchy(testAnalysis);
                
                // Créer les visualisations
                visualizations.createOpinionBubbleChart(testAnalysis.opinionClusters || testAnalysis.topComments || []);
                visualizations.createOpinionClusterChart(testAnalysis);
                visualizations.createConsensusChart(testAnalysis);
                visualizations.createControversyChart(testAnalysis);
                visualizations.createOpinionGroupsChart(testAnalysis);
                
                // Activer le bouton d'exportation
                exportBtn.disabled = false;
                
                console.log('Données de test chargées avec succès');
            } else {
                console.error('Données de test non disponibles');
                showError('Erreur: Les données de test ne sont pas disponibles.');
            }
        });
    }
    
    // Bouton de configuration
    settingsBtn?.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
    
    // Bouton de vidage du cache
    clearCacheBtn?.addEventListener('click', async () => {
        try {
            // Utiliser le Service Worker pour vider le cache
            await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'clearCache' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    if (response && response.success) {
                        resolve();
                    } else {
                        reject(new Error(response?.message || 'Échec du vidage du cache'));
                    }
                });
            });
            
            showSuccess('Le cache d\'analyses a été vidé avec succès');
        } catch (error) {
            console.error('Erreur lors du vidage du cache:', error);
            showError('Erreur lors du vidage du cache: ' + error.message);
        }
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

function updateTruncateButtonAppearance(button, truncateText) {
    if (truncateText) {
        button.textContent = 'Troncature de texte activée';
        button.classList.add('active');
    } else {
        button.textContent = 'Troncature de texte désactivée';
        button.classList.remove('active');
    }
}
