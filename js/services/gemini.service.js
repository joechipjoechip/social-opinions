class GeminiService {
    constructor() {
        // URL de l'API Gemini corrigée avec un modèle disponible
        this.API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
        this.MAX_COMMENTS = 150;
        this.cache = new Map();
        this.MAX_RETRIES = 3;
        // Clé API par défaut (pour le développement)
        this.API_KEY = 'REMOVED_API_KEY';
        
        // Indique si le cache a été initialisé
        this.cacheInitialized = false;
        
        // Charger le cache depuis le stockage local
        this._loadCacheFromStorage();
        
        // Paramètre de troncature de texte (valeur par défaut)
        this.truncateTextToOptimizePerformances = false;
        
        // Charger le paramètre de troncature depuis le stockage local
        this._loadTruncateTextSetting();
        
        // Seed fixe pour les générations Gemini
        this.FIXED_SEED = 42;
        
        // Méthode de tri pour les commentaires
        this.SORT_METHOD = 'score'; // 'score' ou 'date'
    }

    setMaxComments(limit) {
        this.MAX_COMMENTS = limit;
    }

    /**
     * Initialise le service et charge le cache
     * @returns {Promise<void>}
     */
    async initialize() {
        if (!this.cacheInitialized) {
            await this._loadCacheFromStorage();
            this.cacheInitialized = true;
        }
    }

    /**
     * Récupère la clé API depuis le stockage local ou utilise la clé par défaut
     * @returns {Promise<string>} - Clé API
     */
    async getApiKey() {
        // Récupérer depuis le stockage local
        return new Promise((resolve) => {
            chrome.storage.local.get('apiKey', (data) => {
                // Utiliser la clé API configurée par l'utilisateur en priorité
                if (data.apiKey) {
                    console.log('Utilisation de la clé API configurée dans les options');
                    resolve(data.apiKey);
                } else if (this.API_KEY) {
                    // Utiliser la clé par défaut uniquement si aucune clé n'est configurée
                    console.log('Utilisation de la clé API par défaut (développement)');
                    resolve(this.API_KEY);
                } else {
                    // Aucune clé disponible
                    resolve('');
                }
            });
        });
    }

    /**
     * Charge le paramètre de troncature depuis le stockage local
     * @private
     */
    _loadTruncateTextSetting() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get('truncateTextToOptimizePerformances', (data) => {
                if (data && typeof data.truncateTextToOptimizePerformances === 'boolean') {
                    this.truncateTextToOptimizePerformances = data.truncateTextToOptimizePerformances;
                    console.log('Paramètre de troncature chargé:', this.truncateTextToOptimizePerformances);
                }
            });
        }
    }

    /**
     * Parse la réponse JSON de l'API Gemini avec une gestion d'erreurs améliorée
     * @param {string} text - Réponse textuelle de l'API
     * @returns {Object} - Données structurées
     */
    parseGeminiResponse(text) {
        try {
            // Extraction du JSON de la réponse
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Format de réponse invalide: aucun JSON trouvé');
            }

            const jsonStr = jsonMatch[0];
            const data = JSON.parse(jsonStr);
            
            // Validation des données
            if (!data || typeof data !== 'object') {
                throw new Error('Format de réponse invalide: objet JSON attendu');
            }

            // Création d'une structure de données propre avec des valeurs par défaut
            // Récupérer le nombre de commentaires extraits s'il est disponible dans les données
            const extractedCommentsCount = data.extractedCommentsCount || 0;
            
            return {
                overview: {
                    totalComments: this._safeNumber(data.overview && data.overview.totalComments),
                    mainOpinion: this._safeString(data.overview && data.overview.mainOpinion),
                    consensusLevel: this._safeNumber(data.overview && data.overview.consensusLevel, 0, 1)
                },
                extractedCommentsCount: extractedCommentsCount,
                opinionClusters: this._safeArray(data.opinionClusters).map(cluster => ({
                    opinion: this._safeString(cluster.opinion),
                    totalVotes: this._safeNumber(cluster.totalVotes),
                    commentCount: this._safeNumber(cluster.commentCount),
                    avgScore: this._safeNumber(cluster.avgScore),
                    representativeComment: this._safeString(cluster.representativeComment),
                    relatedOpinions: this._safeStringArray(cluster.relatedOpinions)
                })),
                consensusPoints: this._safeArray(data.consensusPoints).map(point => ({
                    topic: this._safeString(point.topic),
                    agreementLevel: this._safeNumber(point.agreementLevel, 0, 1),
                    totalVotes: this._safeNumber(point.totalVotes),
                    keyEvidence: this._safeStringArray(point.keyEvidence)
                })),
                frictionPoints: this._safeArray(data.frictionPoints).map(point => ({
                    topic: this._safeString(point.topic),
                    opinion1: {
                        stance: this._safeString(point.opinion1 && point.opinion1.stance),
                        votes: this._safeNumber(point.opinion1 && point.opinion1.votes),
                        keyArguments: this._safeStringArray(point.opinion1 && point.opinion1.keyArguments)
                    },
                    opinion2: {
                        stance: this._safeString(point.opinion2 && point.opinion2.stance),
                        votes: this._safeNumber(point.opinion2 && point.opinion2.votes),
                        keyArguments: this._safeStringArray(point.opinion2 && point.opinion2.keyArguments)
                    },
                    intensityScore: this._safeNumber(point.intensityScore, 0, 1)
                })),
                voteDistribution: this._safeArray(data.voteDistribution).map(dist => ({
                    opinionGroup: this._safeString(dist.opinionGroup),
                    totalVotes: this._safeNumber(dist.totalVotes),
                    percentageOfTotal: this._safeNumber(dist.percentageOfTotal, 0, 100),
                    topComments: this._safeStringArray(dist.topComments)
                }))
            };
        } catch (error) {
            console.error('Erreur lors du parsing de la réponse:', error);
            throw new Error(`Erreur de format: ${error.message}`);
        }
    }

    /**
     * Méthodes utilitaires pour la validation des données
     */
    _safeString(value, defaultValue = '') {
        return typeof value === 'string' ? value : defaultValue;
    }

    _safeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = Number(value);
        return !isNaN(num) ? Math.min(Math.max(num, min), max) : min;
    }

    _safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    _safeStringArray(value) {
        return Array.isArray(value) ? value.map(item => this._safeString(item)) : [];
    }

    /**
     * Charge le cache depuis le stockage local
     * @private
     */
    async _loadCacheFromStorage() {
        try {
            const data = await new Promise(resolve => {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.get('analysisCache', data => {
                        resolve(data.analysisCache || {});
                    });
                } else {
                    resolve({});
                }
            });
            
            // Convertir l'objet en Map
            this.cache = new Map(Object.entries(data));
            console.log(`Cache chargé: ${this.cache.size} entrées`);
            this.cacheInitialized = true;
        } catch (error) {
            console.error('Erreur lors du chargement du cache:', error);
            this.cache = new Map();
        }
    }
    
    /**
     * Sauvegarde le cache dans le stockage local
     * @private
     */
    async _saveCacheToStorage() {
        try {
            // Convertir la Map en objet pour le stockage
            const cacheObj = Object.fromEntries(this.cache);
            
            await new Promise(resolve => {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({ analysisCache: cacheObj }, resolve);
                } else {
                    resolve();
                }
            });
            
            console.log(`Cache sauvegardé: ${this.cache.size} entrées`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du cache:', error);
        }
    }

    /**
     * Récupère le contenu de la page Reddit avec une extraction améliorée des commentaires
     * @param {boolean} forceRefresh - Force le rafraîchissement du contenu
     * @returns {Promise<Object>} - Contenu de la page
     */
    async getPageContent(forceRefresh = false) {
        try {
            // Communiquer avec le content script pour récupérer le contenu de la page
            return new Promise((resolve, reject) => {
                chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                    if (!tabs || tabs.length === 0) {
                        console.error('Aucun onglet actif trouvé');
                        reject(new Error('Aucun onglet actif trouvé'));
                        return;
                    }
                    
                    const activeTab = tabs[0];
                    
                    // Vérifier si nous sommes sur Reddit ou Twitter/X
                    if (!activeTab.url || !(activeTab.url.includes('reddit.com') || activeTab.url.includes('twitter.com') || activeTab.url.includes('x.com'))) {
                        reject(new Error('Cette extension fonctionne uniquement sur Reddit et Twitter/X'));
                        return;
                    }
                    
                    // Essayer d'injecter le content script si nécessaire
                    try {
                        // Vérifier si le content script est déjà injecté en envoyant un ping
                        const pingResponse = await new Promise((pingResolve) => {
                            chrome.tabs.sendMessage(
                                activeTab.id, 
                                { action: 'ping' }, 
                                (response) => {
                                    if (chrome.runtime.lastError) {
                                        console.log('Content script non détecté, injection nécessaire');
                                        pingResolve(false);
                                    } else {
                                        console.log('Content script déjà injecté');
                                        pingResolve(true);
                                    }
                                }
                            );
                            
                            // Timeout pour éviter de bloquer si aucune réponse
                            setTimeout(() => pingResolve(false), 500);
                        });
                        
                        // Si le content script n'est pas injecté, l'injecter maintenant
                        if (!pingResponse) {
                            console.log('Injection du content script...');
                            await chrome.scripting.executeScript({
                                target: { tabId: activeTab.id },
                                files: ['content.js']
                            });
                            console.log('Content script injecté avec succès');
                            
                            // Attendre que le script soit complètement initialisé
                            await new Promise(r => setTimeout(r, 500));
                        }
                    } catch (injectionError) {
                        console.error('Erreur lors de l\'injection du content script:', injectionError);
                        // Continuer malgré l'erreur, au cas où le script serait déjà injecté
                    }
                    
                    // Maintenant, essayer d'obtenir le contenu
                    chrome.tabs.sendMessage(
                        activeTab.id,
                        { action: 'getPageContent', forceRefresh },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('Erreur de communication:', chrome.runtime.lastError);
                                reject(new Error(`Erreur de communication avec la page: ${chrome.runtime.lastError.message}`));
                                return;
                            }
                            
                            if (!response) {
                                reject(new Error('Aucune réponse du content script. Assurez-vous que la page est complètement chargée et essayez de recharger l\'onglet.'));
                                return;
                            }
                            
                            if (response.error) {
                                reject(new Error(response.error));
                                return;
                            }
                            
                            resolve(response);
                        }
                    );
                });
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du contenu:', error);
            throw new Error(`Erreur lors de la récupération du contenu: ${error.message}`);
        }
    }

    /**
     * Normalise et échantillonne les commentaires de manière déterministe
     * @param {Array} comments - Commentaires bruts extraits
     * @returns {Array} - Commentaires normalisés et échantillonnés
     */
    _normalizeAndSampleComments(comments) {
        if (!Array.isArray(comments) || comments.length === 0) {
            return [];
        }
        
        // Étape 1: Filtrer les commentaires invalides, vides ou trop courts et nettoyer le texte
        const validComments = comments.filter(comment => 
            comment && 
            typeof comment.text === 'string' && 
            comment.text.trim().length > 5
        ).map(comment => ({
            ...comment,
            // Nettoyage complet du texte :
            // 1. trim() pour supprimer les espaces au début et à la fin
            // 2. replace() avec regex pour remplacer les espaces multiples par un seul espace
            // 3. replace() pour supprimer les sauts de ligne et tabulations
            text: comment.text.trim()
                .replace(/\s+/g, ' ')                  // Remplacer tous les espaces multiples par un seul espace
                .replace(/[\r\n\t]+/g, ' ')            // Remplacer les sauts de ligne et tabulations par un espace
                .replace(/\s+([.,;:!?])/g, '$1')       // Supprimer les espaces avant la ponctuation
                .replace(/\s{2,}/g, ' ')               // S'assurer qu'il n'y a pas d'espaces doubles (redondant mais sécuritaire)
        }));
        
        // Étape 2: Trier les commentaires de manière déterministe
        const sortedComments = [...validComments].sort((a, b) => {
            if (this.SORT_METHOD === 'score') {
                // Tri primaire par score (décroissant)
                const scoreDiff = (b.score || 0) - (a.score || 0);
                if (scoreDiff !== 0) return scoreDiff;
            }
            
            // Tri secondaire par longueur de texte (décroissant) pour stabilité
            const lengthDiff = (b.text?.length || 0) - (a.text?.length || 0);
            if (lengthDiff !== 0) return lengthDiff;
            
            // Tri tertiaire alphabétique pour une stabilité totale
            return (a.text || '').localeCompare(b.text || '');
        });
        
        // Étape 3: Limiter au nombre maximum de commentaires
        return sortedComments.slice(0, this.MAX_COMMENTS);
    }

    /**
     * Génère un résumé des commentaires avec gestion de cache et retries
     * @param {Object} pageContent - Contenu de la page
     * @param {boolean} forceRefresh - Force le rafraîchissement du résumé
     * @returns {Promise<Object>} - Données d'analyse
     */
    async generateSummary(pageContent, forceRefresh = false) {
        // S'assurer que le cache est initialisé
        await this.initialize();
        
        // Normaliser et échantillonner les commentaires pour un traitement cohérent
        pageContent.comments = this._normalizeAndSampleComments(pageContent.comments);
        
        // Génération d'une clé de cache améliorée basée sur l'URL
        const cacheKey = this._generateCacheKey(pageContent);
        
        // Vérification du cache (sauf si forceRefresh est true)
        if (!forceRefresh && this.cache.has(cacheKey)) {
            console.log('Utilisation des données en cache');
            const cachedData = this.cache.get(cacheKey);
            // Ajouter une propriété indiquant que les données proviennent du cache
            return { ...cachedData, _fromCache: true };
        }

        // Préparer les en-têtes d'authentification
        let authHeader = {};
        let apiUrl = this.API_URL;
        
        // Récupérer la clé API depuis le stockage local
        const apiKey = await this.getApiKey();
        if (apiKey) {
            apiUrl = `${this.API_URL}?key=${encodeURIComponent(apiKey)}`;
            console.log('Utilisation de la clé API configurée par l\'utilisateur');
        } else {
            console.error('Erreur d\'authentification: Aucune clé API configurée');
            throw new Error('Aucune clé API configurée. Veuillez configurer une clé API dans les options.');
        }

        // Afficher tous les commentaires envoyés à Gemini de manière détaillée
        console.log("======== COMMENTAIRES ENVOYÉS À GEMINI ========");
        console.log(`Nombre total de commentaires: ${pageContent.comments.length}`);
        
        // Stocker le nombre de commentaires extraits (utiliser commentCount s'il est disponible)
        const extractedCommentsCount = pageContent.commentCount || pageContent.comments.length;
        console.log(`Nombre total de commentaires extraits: ${extractedCommentsCount}`);
        
        let totalChars = 0;
        pageContent.comments.forEach((comment, index) => {
            console.log(`Commentaire #${index + 1} [Score: ${comment.score}]:`);
            console.log(comment.text);
            totalChars += comment.text.length;
            console.log("-------------------------------------------");
        });
        console.log(`Total caractères: ${totalChars} (après optimisation)`);
        console.log("================ FIN DES COMMENTAIRES ================");
        
        console.log("- - - - - - - le pageContent envoyé à gémini : ", pageContent.comments.map(c => `[Score: ${c.score}] ${c.text}`).join('\n'));
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{
                        "text": `Analyse les commentaires suivants en te concentrant sur la diversité des opinions et leurs popularités respectives en te basant sur le nombre de votes pour chaque opinion. Propose une analyse sensible et sémantiquement valide. Regroupe les opinions similaires dans les points de consensus. Mets en évidence les opinions opposées dans les points de frictions. Fais en sorte que les points de consensus et points de frictions apportent une contribution significative à l'analyse.

                        IMPORTANT:
- Pour les frictionPoints, assure-toi que chaque sujet contient EXACTEMENT deux opinions clairement opposées
- Les stances doivent être des phrases courtes (max 10 mots) et clairement opposées (pour/contre)
- Les votes doivent toujours être des nombres positifs (ne pas utiliser de valeurs négatives)
- Identifie les sujets de désaccord les plus importants et les plus polarisants
- Chaque sujet doit être spécifique et concret, pas vague ou général

IMPORTANT ET CRUCIAL: Ta réponse doit absolument être un objet JSON valide, sans aucun texte avant ou après. C'est très important ! Je veux un JSON Valide absolument. Utilise uniquement des guillemets doubles pour les chaînes. Voici un modèle pour ta réponse, tu dois absolument respecter ce modèle :

Titre: ${pageContent.postTitle}

Commentaires (triés par score):
${pageContent.comments.map(c => `[Score: ${c.score}] ${c.text}`).join('\n')}

Format de sortie attendu:
{
  "overview": {
    "totalComments": <nombre>,
    "mainOpinion": "<opinion principale>",
    "consensusLevel": <0-1>
  },
  "opinionClusters": [
    {
      "opinion": "<résumé de l'opinion>",
      "totalVotes": <nombre>,
      "commentCount": <nombre>,
      "avgScore": <nombre>,
      "representativeComment": "<commentaire représentatif>",
      "relatedOpinions": ["<opinion liée 1>", "<opinion liée 2>"]
    }
  ],
  "consensusPoints": [
    {
      "topic": "<sujet>",
      "agreementLevel": <0-1>,
      "totalVotes": <nombre>,
      "keyEvidence": ["<preuve 1>", "<preuve 2>"]
    }
  ],
  "frictionPoints": [
    {
      "topic": "<sujet de désaccord précis>",
      "opinion1": {
        "stance": "<position favorable ou pour - phrase courte et claire>",
        "votes": <nombre positif>,
        "keyArguments": ["<argument 1>", "<argument 2>"]
      },
      "opinion2": {
        "stance": "<position opposée ou contre - phrase courte et claire>",
        "votes": <nombre positif>,
        "keyArguments": ["<argument 1>", "<argument 2>"]
      },
      "intensityScore": <0-1>
    }
  ],
  "voteDistribution": [
    {
      "opinionGroup": "<groupe d'opinion>",
      "totalVotes": <nombre>,
      "percentageOfTotal": <0-100>,
      "topComments": ["<commentaire 1>", "<commentaire 2>"]
    }
  ]
}
`
                    }]
                }],
                "generationConfig": {
                    "temperature": 0,
                    "topK": 1,
                    "topP": 0.1,
                    "maxOutputTokens": 4096,
                    "seed": this.FIXED_SEED
                }
            })
        });

        // ... (code existant)
    }

    /**
     * Génère une clé de cache basée sur l'URL de la page
     * @param {Object} pageContent - Contenu de la page
     * @returns {string} - Clé de cache
     */
    _generateCacheKey(pageContent) {
        // Méthode principale: extraire l'identifiant unique du post Reddit de l'URL
        if (pageContent.url) {
            try {
                // Créer une URL pour une analyse fiable
                const url = new URL(pageContent.url);
                const pathSegments = url.pathname.split('/').filter(Boolean);
                
                // L'URL Reddit suit généralement le format /r/subreddit/comments/post_id/...
                const subreddit = pathSegments[1] === 'r' ? pathSegments[2] : null;
                const postId = pathSegments.includes('comments') ? 
                    pathSegments[pathSegments.indexOf('comments') + 1] : null;
                
                if (postId) {
                    // Clé très spécifique avec l'ID du post et le subreddit
                    return `reddit-${subreddit || 'unknown'}-${postId}`;
                }
            } catch (error) {
                console.warn('Erreur lors du parsing de l\'URL pour la clé de cache:', error);
                // Continuer avec la méthode de fallback
            }
        }
        
        // Méthode de fallback améliorée: utiliser un hash basé sur le titre et les commentaires
        const title = pageContent.postTitle || '';
        const commentHash = this._generateCommentHash(pageContent.comments);
        
        return `reddit-post-${this._hashString(title)}-${commentHash}`;
    }
    
    /**
     * Génère un hash à partir d'une chaîne de caractères
     * @param {string} str - Chaîne à hasher
     * @returns {string} - Hash de la chaîne
     */
    _hashString(str) {
        if (typeof str !== 'string') return '0';
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Conversion en entier 32 bits
        }
        // Convertir en base36 pour obtenir un hash compact
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Génère un hash basé sur tous les commentaires
     * @param {Array} comments - Commentaires à hasher
     * @returns {string} - Hash des commentaires
     */
    _generateCommentHash(comments) {
        if (!Array.isArray(comments) || comments.length === 0) {
            return '0';
        }
        
        // Utiliser les scores et un échantillon de texte de tous les commentaires pour le hash
        const commentStr = comments
            .slice(0, Math.min(50, comments.length)) // Utiliser jusqu'à 50 commentaires
            .map(c => `${c.score || 0}:${(c.text || '').substring(0, 20)}`) // Échantillon plus large
            .join('|');
        
        return this._hashString(commentStr);
    }

    // ... (autres méthodes)
}

// Rendre la classe disponible à la fois pour les modules ES6 et les Service Workers
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS/Node.js
    module.exports = GeminiService;
} else if (typeof self !== 'undefined') {
    // Service Worker
    self.GeminiService = GeminiService;
}

// Ajouter l'export par défaut pour les imports ES6
export default GeminiService;
