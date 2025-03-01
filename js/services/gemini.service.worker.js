/**
 * Version du service Gemini adaptée pour les Service Workers
 * Cette version n'utilise pas les instructions d'exportation ES6
 */

// Définition de la classe GeminiService pour les Service Workers
self.GeminiService = class GeminiService {
    constructor() {
        // URL de l'API Gemini avec un modèle disponible gratuitement
        this.API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
        // URL de secours si le modèle principal n'est pas disponible
        this.FALLBACK_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-flash:generateContent';
        this.MAX_COMMENTS = 150;
        this.cache = new Map();
        this.MAX_RETRIES = 3;
        // Clé API par défaut (pour le développement)
        this.API_KEY = 'AIzaSyDXsazw-xOdNCmP6CwXo_Rhi4yGohcrmvs';
        
        // Indique si le cache a été initialisé
        this.cacheInitialized = false;
        
        // Charger le cache depuis le stockage local
        this._loadCacheFromStorage();
    }

    /**
     * Définit la limite maximale de commentaires
     * @param {number} limit - Nouvelle limite
     */
    setMaxComments(limit) {
        if (typeof limit === 'number' && limit > 0) {
            this.MAX_COMMENTS = limit;
            console.log(`Limite de commentaires définie à ${limit}`);
        }
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
        // En mode développement, utiliser la clé du fichier .env
        if (this.API_KEY) {
            return this.API_KEY;
        }
        
        // Sinon, récupérer depuis le stockage local
        return new Promise((resolve) => {
            chrome.storage.local.get('apiKey', (data) => {
                resolve(data.apiKey || '');
            });
        });
    }

    /**
     * Charge le cache depuis le stockage local
     * @returns {Promise<void>}
     */
    async _loadCacheFromStorage() {
        try {
            const data = await new Promise((resolve) => {
                chrome.storage.local.get('analysisCache', (result) => {
                    resolve(result.analysisCache || {});
                });
            });
            
            // Convertir l'objet en Map
            this.cache = new Map();
            Object.keys(data).forEach(key => {
                // Assurez-vous que le nombre de commentaires est correct
                if (data[key] && data[key].overview) {
                    // Stocker le nombre de commentaires original
                    const originalCommentCount = data[key].overview.totalComments;
                    
                    // Mettre à jour avec la limite actuelle
                    chrome.storage.local.get(['maxComments'], (settings) => {
                        const maxComments = parseInt(settings.maxComments || this.MAX_COMMENTS);
                        if (originalCommentCount > maxComments) {
                            data[key].overview.totalComments = maxComments;
                            console.log(`Ajustement du nombre de commentaires en cache de ${originalCommentCount} à ${maxComments}`);
                        }
                    });
                }
                
                this.cache.set(key, data[key]);
            });
            
            console.log(`Cache chargé: ${this.cache.size} entrées`);
        } catch (error) {
            console.error('Erreur lors du chargement du cache:', error);
            this.cache = new Map();
        }
    }
    
    /**
     * Sauvegarde le cache dans le stockage local
     * @returns {Promise<void>}
     */
    async _saveCacheToStorage() {
        try {
            // Convertir la Map en objet pour le stockage
            const cacheObject = Object.fromEntries(this.cache.entries());
            
            await new Promise((resolve) => {
                chrome.storage.local.set({ analysisCache: cacheObject }, () => {
                    resolve();
                });
            });
            
            console.log(`Cache sauvegardé: ${this.cache.size} entrées`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du cache:', error);
        }
    }

    /**
     * Efface le cache d'analyses
     * @returns {Promise<void>}
     */
    async clearCache() {
        this.cache.clear();
        await this._saveCacheToStorage();
        console.log('Cache effacé');
    }

    /**
     * Parse la réponse JSON de l'API Gemini avec une gestion d'erreurs améliorée
     * @param {string} text - Réponse textuelle de l'API
     * @param {Object} pageContent - Contenu de la page
     * @returns {Object} - Données structurées
     */
    parseGeminiResponse(text, pageContent) {
        try {
            console.log('Texte reçu de l\'API:', text.substring(0, 100) + '...');
            
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
            return {
                overview: {
                    totalComments: pageContent.comments.length, // Utiliser le nombre réel de commentaires analysés
                    mainOpinion: this._safeString(data.overview?.mainOpinion),
                    consensusLevel: this._safeNumber(data.overview?.consensusLevel, 0, 1)
                },
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
                        stance: this._safeString(point.opinion1?.stance),
                        votes: this._safeNumber(point.opinion1?.votes),
                        keyArguments: this._safeStringArray(point.opinion1?.keyArguments)
                    },
                    opinion2: {
                        stance: this._safeString(point.opinion2?.stance),
                        votes: this._safeNumber(point.opinion2?.votes),
                        keyArguments: this._safeStringArray(point.opinion2?.keyArguments)
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
     * Génère un résumé des commentaires Reddit en utilisant l'API Gemini
     * @param {Object} pageContent - Contenu de la page Reddit
     * @returns {Promise<Object>} - Résumé généré
     */
    async generateSummary(pageContent) {
        // Vérifier si les commentaires sont vides
        if (!pageContent.comments || pageContent.comments.length === 0) {
            throw new Error('Aucun commentaire à analyser');
        }
        
        // Récupérer la limite de commentaires depuis les paramètres
        let commentLimit = this.MAX_COMMENTS;
        try {
            const settings = await new Promise(resolve => {
                chrome.storage.local.get(['maxComments'], (data) => {
                    resolve(data);
                });
            });
            
            if (settings && settings.maxComments) {
                commentLimit = parseInt(settings.maxComments);
                console.log(`Limite de commentaires définie dans les paramètres: ${commentLimit}`);
            }
        } catch (error) {
            console.warn('Erreur lors de la récupération des paramètres:', error);
            // Continuer avec la valeur par défaut
        }
        
        // Limiter le nombre de commentaires pour éviter les problèmes de taille
        if (pageContent.comments.length > commentLimit) {
            console.log(`Limitation du nombre de commentaires à ${commentLimit}`);
            pageContent.comments = pageContent.comments.slice(0, commentLimit);
        }
        
        // Générer une clé de cache basée sur le contenu
        const cacheKey = this._generateCacheKey(pageContent);
        
        // Vérifier si le résultat est déjà en cache
        if (this.cache.has(cacheKey)) {
            console.log('Résultat trouvé en cache');
            return this.cache.get(cacheKey);
        }
        
        let retries = 0;
        let lastError = null;
        let useFallbackModel = false;
        
        while (retries <= this.MAX_RETRIES) {
            let quotaExceeded = false;
            
            try {
                console.log(`Tentative ${retries + 1}/${this.MAX_RETRIES + 1} de génération de résumé${useFallbackModel ? ' (modèle de secours)' : ''}`);
                
                // Préparer l'URL et les en-têtes pour l'API
                let apiUrl = useFallbackModel ? this.FALLBACK_API_URL : this.API_URL;
                let authHeader = {};
                
                // Utiliser la clé API directement dans l'URL
                apiUrl = `${this.API_URL}?key=${encodeURIComponent(this.API_KEY)}`;
                
                // Appel à l'API Gemini
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeader
                    },
                    body: JSON.stringify({
                        // Format pour l'API Gemini (identique pour les deux modèles)
                        "contents": [{
                            "role": "user",
                            "parts": [{
                                "text": `Analyse les commentaires Reddit suivants en te concentrant sur l'identification des opinions principales, leur popularité basée sur les votes, et les points de consensus/friction.
                                
                                IMPORTANT: Ta réponse doit être un objet JSON valide, sans aucun texte avant ou après. Utilise uniquement des guillemets doubles pour les chaînes.
                                
                                Titre: ${pageContent.postTitle}
                                
                                Commentaires (triés par score):
                                ${pageContent.comments.map(c => `[Score: ${c.score || 0}] ${c.text}`).join('\n')}
                                
                                Format de sortie attendu:
                                {
                                  "overview": {
                                    "totalComments": <nombre de commentaires analysés>,
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
                                      "topic": "<sujet de consensus>",
                                      "agreementLevel": <0-1>,
                                      "totalVotes": <nombre>,
                                      "keyEvidence": ["<preuve 1>", "<preuve 2>"]
                                    }
                                  ],
                                  "frictionPoints": [
                                    {
                                      "topic": "<sujet de désaccord>",
                                      "opinion1": {
                                        "stance": "<position 1>",
                                        "votes": <nombre>,
                                        "keyArguments": ["<argument 1>", "<argument 2>"]
                                      },
                                      "opinion2": {
                                        "stance": "<position 2>",
                                        "votes": <nombre>,
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
                                }`
                            }]
                        }],
                        "generationConfig": {
                            "temperature": 0.4,
                            "topP": 1.0,
                            "maxOutputTokens": 4096
                        },
                        "safetySettings": [
                            {
                                "category": "HARM_CATEGORY_HARASSMENT",
                                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                "category": "HARM_CATEGORY_HATE_SPEECH",
                                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                            },
                            {
                                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                            }
                        ]
                    })
                });

                // Vérifier si la réponse est OK
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
                    
                    console.error('Erreur API détaillée:', JSON.stringify(errorData));
                    console.error('URL API utilisée:', apiUrl);
                    
                    // Vérifier si l'erreur est liée au quota
                    quotaExceeded = errorMessage.includes('quota') || 
                                    errorMessage.includes('rate limit') || 
                                    response.status === 429;
                    
                    throw new Error(`Erreur API: ${errorMessage}`);
                }

                // Extraire le texte de la réponse
                const responseData = await response.json();
                console.log('Structure de la réponse API:', JSON.stringify(responseData, null, 2));
                
                // Format de réponse pour l'API Gemini (identique pour les deux modèles)
                const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                if (!text) {
                    throw new Error('Réponse vide de l\'API');
                }

                // Parser la réponse JSON
                const result = this.parseGeminiResponse(text, pageContent);
                
                // Mise en cache du résultat
                this.cache.set(cacheKey, result);
                
                // Sauvegarder le cache dans le stockage local
                await this._saveCacheToStorage();
                
                return result;
            } catch (error) {
                console.error(`Tentative ${retries + 1}/${this.MAX_RETRIES + 1} échouée:`, error);
                lastError = error;
                
                // Si l'erreur est liée au quota, ne pas réessayer
                if (quotaExceeded) {
                    break;
                }
                
                retries++;
                
                if (retries < this.MAX_RETRIES) {
                    // Attendre avant de réessayer (backoff exponentiel)
                    const waitTime = Math.pow(2, retries) * 1000;
                    console.log(`Nouvelle tentative dans ${waitTime / 1000} secondes...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        // Si toutes les tentatives ont échoué
        throw lastError || new Error('Échec de la génération du résumé après plusieurs tentatives');
    }

    /**
     * Crée une clé de cache basée sur le contenu de la page
     * @param {Object} pageContent - Contenu de la page
     * @returns {string} - Clé de cache
     * @private
     */
    _generateCacheKey(pageContent) {
        // Utiliser le titre et un hash des commentaires comme clé
        const title = pageContent.postTitle;
        const commentsHash = this._hashString(
            pageContent.comments
                .slice(0, 10) // Utiliser seulement les 10 premiers commentaires pour le hash
                .map(c => `${c.score}:${c.text.substring(0, 50)}`) // Limiter la longueur du texte
                .join('|')
        );
        
        return `${title.substring(0, 50)}_${commentsHash}`;
    }
    
    /**
     * Crée un hash simple d'une chaîne
     * @param {string} str - Chaîne à hasher
     * @returns {string} - Hash de la chaîne
     * @private
     */
    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Conversion en entier 32 bits
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Liste les modèles disponibles pour l'API Gemini
     * @returns {Promise<Array>} - Liste des modèles disponibles
     */
    async listAvailableModels() {
        try {
            // Appel à l'API pour lister les modèles
            const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `Erreur HTTP ${response.status}`;
                console.error('Erreur lors de la liste des modèles:', errorMessage);
                throw new Error(`Erreur lors de la liste des modèles: ${errorMessage}`);
            }
            
            const data = await response.json();
            console.log('Modèles disponibles:', JSON.stringify(data, null, 2));
            return data.models || [];
        } catch (error) {
            console.error('Erreur lors de la liste des modèles:', error);
            throw error;
        }
    }
};

console.log('Service Gemini pour Service Worker chargé');
