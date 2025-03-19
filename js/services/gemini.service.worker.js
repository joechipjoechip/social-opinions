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
        
        // Seed fixe pour les générations Gemini
        this.FIXED_SEED = 42;
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
     * Récupère le token d'accès OAuth2
     * @returns {Promise<string>} - Token d'accès
     */
    async getAccessToken() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError;
                    console.error('Erreur OAuth2:', error.message);
                    
                    // Si l'erreur est liée à l'ID client, suggérer de basculer vers la clé API
                    if (error.message.includes('bad client id')) {
                        console.warn('ID client OAuth2 invalide. Vérifiez la configuration dans le manifest.json.');
                    } else if (error.message.includes('Authorization page could not be loaded')) {
                        console.warn('Page d\'autorisation non chargée. Vérifiez votre connexion internet.');
                    } else if (error.message.includes('The user did not approve access')) {
                        console.warn('L\'utilisateur a refusé l\'accès.');
                    }
                    
                    reject(error);
                    return;
                }
                
                if (!token) {
                    reject(new Error('Token OAuth2 non obtenu'));
                    return;
                }
                
                console.log('Token OAuth2 obtenu avec succès');
                resolve(token);
            });
        });
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
     * @private
     */
    async _loadCacheFromStorage() {
        try {
            const data = await new Promise(resolve => {
                chrome.storage.local.get('analysisCache', data => {
                    resolve(data.analysisCache || {});
                });
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
            const cacheObject = Object.fromEntries(this.cache.entries());
            
            await new Promise(resolve => {
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
     * @returns {Object} - Données structurées
     */
    parseGeminiResponse(text) {
        try {
            console.log('Texte reçu de l\'API:', text ? (text.substring(0, 100) + '...') : 'VIDE');
            
            // Vérification si le texte est vide ou null
            if (!text || text.trim() === '') {
                console.error('Réponse API vide, génération d\'une réponse par défaut');
                return this._generateDefaultResponse();
            }
            
            // Extraction du JSON de la réponse
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('Format de réponse invalide: aucun JSON trouvé, génération d\'une réponse par défaut');
                return this._generateDefaultResponse();
            }

            const jsonStr = jsonMatch[0];
            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (jsonError) {
                console.error('Erreur lors du parsing JSON:', jsonError);
                return this._generateDefaultResponse();
            }
            
            // Validation des données
            if (!data || typeof data !== 'object') {
                console.error('Format de réponse invalide: objet JSON attendu, génération d\'une réponse par défaut');
                return this._generateDefaultResponse();
            }

            // Création d'une structure de données propre avec des valeurs par défaut
            // Stocker le nombre de commentaires envoyés dans le résultat
            const extractedCommentsCount = this._currentExtractedCommentsCount || 0;
            console.log(`parseGeminiResponse: Utilisation de ${extractedCommentsCount} commentaires extraits`);
            
            // Vérifier si les clusters d'opinion sont vides ou invalides
            const opinionClusters = this._safeArray(data.opinionClusters);
            if (opinionClusters.length === 0) {
                console.warn('Aucun cluster d\'opinion trouvé dans la réponse, génération de clusters par défaut');
                // Si aucun cluster n'est présent, créer un cluster par défaut
                data.opinionClusters = [{
                    opinion: "Opinion générale",
                    totalVotes: extractedCommentsCount,
                    commentCount: extractedCommentsCount,
                    avgScore: 1,
                    representativeComment: "Commentaire représentatif",
                    relatedOpinions: ["Opinion connexe"]
                }];
            }
            
            // Vérifier si les points de consensus sont vides ou invalides
            if (!data.consensusPoints || !Array.isArray(data.consensusPoints) || data.consensusPoints.length === 0) {
                console.warn('Aucun point de consensus trouvé dans la réponse, génération de points par défaut');
                data.consensusPoints = [{
                    topic: "Point de consensus général",
                    agreementLevel: 0.7,
                    totalVotes: extractedCommentsCount,
                    keyEvidence: ["Preuve de consensus"]
                }];
            }
            
            // Vérifier si les points de friction sont vides ou invalides
            if (!data.frictionPoints || !Array.isArray(data.frictionPoints) || data.frictionPoints.length === 0) {
                console.warn('Aucun point de friction trouvé dans la réponse, génération de points par défaut');
                data.frictionPoints = [{
                    topic: "Point de désaccord principal",
                    opinion1: {
                        stance: "Position favorable",
                        votes: Math.ceil(extractedCommentsCount / 2),
                        keyArguments: ["Argument pour"]
                    },
                    opinion2: {
                        stance: "Position opposée",
                        votes: Math.floor(extractedCommentsCount / 2),
                        keyArguments: ["Argument contre"]
                    },
                    intensityScore: 0.5
                }];
            }
            
            // S'assurer que extractedCommentsCount est toujours défini et valide
            const finalExtractedCommentsCount = extractedCommentsCount > 0 ? extractedCommentsCount : this._currentExtractedCommentsCount || 10;
            console.log(`Nombre final de commentaires extraits: ${finalExtractedCommentsCount}`);
            
            return {
                overview: {
                    // Utiliser toujours extractedCommentsCount pour le nombre de commentaires
                    totalComments: finalExtractedCommentsCount,
                    mainOpinion: this._safeString(data.overview && data.overview.mainOpinion) || "Opinion principale",
                    consensusLevel: this._safeNumber(data.overview && data.overview.consensusLevel, 0, 1) || 0.5
                },
                extractedCommentsCount: finalExtractedCommentsCount,
                opinionClusters: this._safeArray(data.opinionClusters).map(cluster => ({
                    opinion: this._safeString(cluster.opinion) || "Opinion non spécifiée",
                    totalVotes: this._safeNumber(cluster.totalVotes) || 1,
                    commentCount: this._safeNumber(cluster.commentCount) || 1,
                    avgScore: this._safeNumber(cluster.avgScore) || 1,
                    representativeComment: this._safeString(cluster.representativeComment) || "Commentaire représentatif",
                    relatedOpinions: this._safeStringArray(cluster.relatedOpinions) || ["Opinion connexe"]
                })),
                consensusPoints: this._safeArray(data.consensusPoints).map(point => ({
                    topic: this._safeString(point.topic) || "Point de consensus",
                    agreementLevel: this._safeNumber(point.agreementLevel, 0, 1) || 0.7,
                    totalVotes: this._safeNumber(point.totalVotes) || extractedCommentsCount,
                    keyEvidence: this._safeStringArray(point.keyEvidence) || ["Preuve de consensus"]
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
            console.warn('Génération d\'une réponse par défaut suite à une erreur');
            return this._generateDefaultResponse();
        }
    }
    
    /**
     * Génère une réponse par défaut en cas d'erreur ou de réponse vide de l'API
     * @returns {Object} - Réponse par défaut
     * @private
     */
    _generateDefaultResponse() {
        // S'assurer que le nombre de commentaires extraits est toujours disponible et valide
        const extractedCommentsCount = (typeof this._currentExtractedCommentsCount === 'number' && this._currentExtractedCommentsCount > 0) 
            ? this._currentExtractedCommentsCount 
            : 10;
        console.log(`Génération d'une réponse par défaut avec ${extractedCommentsCount} commentaires extraits (valeur originale: ${this._currentExtractedCommentsCount})`);
        
        return {
            overview: {
                totalComments: extractedCommentsCount,
                mainOpinion: "Opinions diverses (analyse automatique)",
                consensusLevel: 0.5
            },
            extractedCommentsCount: extractedCommentsCount,
            opinionClusters: [
                {
                    opinion: "Opinion principale (générée automatiquement)",
                    totalVotes: Math.ceil(extractedCommentsCount * 0.6),
                    commentCount: Math.ceil(extractedCommentsCount * 0.6),
                    avgScore: 5,
                    representativeComment: "Commentaire représentatif (généré automatiquement)",
                    relatedOpinions: ["Opinion connexe 1", "Opinion connexe 2"]
                },
                {
                    opinion: "Opinion secondaire (générée automatiquement)",
                    totalVotes: Math.floor(extractedCommentsCount * 0.4),
                    commentCount: Math.floor(extractedCommentsCount * 0.4),
                    avgScore: 3,
                    representativeComment: "Commentaire représentatif secondaire (généré automatiquement)",
                    relatedOpinions: ["Opinion connexe 3"]
                }
            ],
            consensusPoints: [
                {
                    topic: "Point de consensus principal (généré automatiquement)",
                    agreementLevel: 0.8,
                    totalVotes: extractedCommentsCount,
                    keyEvidence: ["Preuve de consensus 1", "Preuve de consensus 2"]
                }
            ],
            frictionPoints: [
                {
                    topic: "Point de désaccord principal (généré automatiquement)",
                    opinion1: {
                        stance: "Position favorable",
                        votes: Math.ceil(extractedCommentsCount / 2),
                        keyArguments: ["Argument pour 1", "Argument pour 2"]
                    },
                    opinion2: {
                        stance: "Position opposée",
                        votes: Math.floor(extractedCommentsCount / 2),
                        keyArguments: ["Argument contre 1", "Argument contre 2"]
                    },
                    intensityScore: 0.7
                }
            ],
            voteDistribution: [
                {
                    opinionGroup: "Groupe d'opinion principal (généré automatiquement)",
                    totalVotes: extractedCommentsCount,
                    percentageOfTotal: 100,
                    topComments: ["Commentaire populaire 1", "Commentaire populaire 2"]
                }
            ]
        };
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
     * Convertit une valeur en nombre sûr
     * @param {*} value - Valeur à convertir
     * @param {number} defaultValue - Valeur par défaut si la conversion échoue
     * @returns {number} - Nombre sûr
     * @private
     */
    _safeNumber(value, defaultValue = 0) {
        if (value === undefined || value === null) return defaultValue;
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }
    
    /**
     * Convertit une valeur en chaîne de caractères sûre
     * @param {*} value - Valeur à convertir
     * @param {string} defaultValue - Valeur par défaut si la conversion échoue
     * @returns {string} - Chaîne de caractères sûre
     * @private
     */
    _safeString(value, defaultValue = '') {
        if (value === undefined || value === null) return defaultValue;
        return String(value);
    }
    
    /**
     * Vérifie si un objet a toutes les propriétés requises
     * @param {Object} obj - Objet à vérifier
     * @param {Array} props - Liste des propriétés requises
     * @returns {boolean} - Vrai si l'objet a toutes les propriétés requises
     * @private
     */
    _hasRequiredProperties(obj, props) {
        if (!obj || typeof obj !== 'object') return false;
        return props.every(prop => 
            obj.hasOwnProperty(prop) && 
            obj[prop] !== undefined && 
            obj[prop] !== null
        );
    }
    
    /**
     * S'assure qu'un objet a toutes les propriétés requises avec des valeurs par défaut si nécessaire
     * @param {Object} obj - Objet à compléter
     * @param {Object} defaults - Valeurs par défaut pour les propriétés manquantes
     * @returns {Object} - Objet complété
     * @private
     */
    _ensureObjectProperties(obj, defaults) {
        if (!obj || typeof obj !== 'object') return { ...defaults };
        
        const result = { ...obj };
        
        // Ajouter les propriétés manquantes avec leurs valeurs par défaut
        Object.entries(defaults).forEach(([key, value]) => {
            if (result[key] === undefined || result[key] === null) {
                result[key] = value;
            }
        });
        
        return result;
    }

    /**
     * Normalise et échantillonne les commentaires de manière déterministe
     * @param {Array} comments - Commentaires bruts extraits
     * @returns {Array} - Commentaires normalisés et échantillonnés
     * @private
     */
    _normalizeAndSampleComments(comments) {
        if (!Array.isArray(comments) || comments.length === 0) {
            console.warn('Aucun commentaire valide à analyser');
            return [];
        }
        
        console.log(`Normalisation de ${comments.length} commentaires...`);
        
        // Définir les propriétés requises et les valeurs par défaut
        const requiredProps = ['text', 'author', 'score', 'id', 'permalink', 'created'];
        const defaultValues = {
            text: '',
            author: 'Anonyme',
            score: 0,
            upvotes: 0,
            downvotes: 0,
            awards: 0,
            isOP: false,
            id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            permalink: '',
            created: new Date().toISOString(),
            truncatedText: ''
        };
        
        // Étape 1: Filtrer les commentaires invalides, vides ou trop courts et nettoyer le texte
        const validComments = comments
            .filter(comment => {
                // Vérifier si le commentaire est un objet valide avec du texte
                const isValid = comment && 
                               typeof comment === 'object' && 
                               typeof comment.text === 'string' && 
                               comment.text.trim().length > 5;
                               
                if (!isValid) {
                    console.log('Commentaire ignoré car invalide ou trop court:', comment);
                }
                
                return isValid;
            })
            .map(comment => {
                // S'assurer que toutes les propriétés requises sont présentes
                const normalizedComment = this._ensureObjectProperties(comment, defaultValues);
                
                // Nettoyage complet du texte
                normalizedComment.text = normalizedComment.text.trim()
                    .replace(/\s+/g, ' ')                  // Remplacer tous les espaces multiples par un seul espace
                    .replace(/[\r\n\t]+/g, ' ')            // Remplacer les sauts de ligne et tabulations par un espace
                    .replace(/\s+([.,;:!?])/g, '$1')       // Supprimer les espaces avant la ponctuation
                    .replace(/\s{2,}/g, ' ');              // S'assurer qu'il n'y a pas d'espaces doubles
                
                // Mettre à jour le texte tronqué
                normalizedComment.truncatedText = this._safeString(normalizedComment.text).substring(0, 100) + 
                                                (normalizedComment.text.length > 100 ? '...' : '');
                
                // S'assurer que les valeurs numériques sont des nombres
                normalizedComment.score = this._safeNumber(normalizedComment.score);
                normalizedComment.upvotes = this._safeNumber(normalizedComment.upvotes || normalizedComment.score);
                normalizedComment.downvotes = this._safeNumber(normalizedComment.downvotes);
                normalizedComment.awards = this._safeNumber(normalizedComment.awards);
                
                // S'assurer que isOP est un booléen
                normalizedComment.isOP = !!normalizedComment.isOP;
                
                return normalizedComment;
            });
        
        console.log(`${validComments.length} commentaires valides après normalisation`);
        
        if (validComments.length > 0) {
            console.log('Exemple de commentaire normalisé:', JSON.stringify(validComments[0], null, 2));
        }
        
        // Étape 2: Trier les commentaires par score (décroissant)
        const sortedComments = [...validComments].sort((a, b) => {
            // Tri primaire par score (décroissant)
            const scoreDiff = (b.score || 0) - (a.score || 0);
            if (scoreDiff !== 0) return scoreDiff;
            
            // Tri secondaire par longueur de texte (décroissant) pour stabilité
            const lengthDiff = (b.text?.length || 0) - (a.text?.length || 0);
            if (lengthDiff !== 0) return lengthDiff;
            
            // Tri tertiaire alphabétique pour une stabilité totale
            return (a.text || '').localeCompare(b.text || '');
        });
        
        // Étape 3: Limiter au nombre maximum de commentaires
        const result = sortedComments.slice(0, this.MAX_COMMENTS);
        console.log(`Retour de ${result.length} commentaires après échantillonnage`);
        
        return result;
    }

    /**
     * Génère un résumé des commentaires Reddit en utilisant l'API Gemini
     * @param {Object} pageContent - Contenu de la page Reddit
     * @param {Object} authSettings - Paramètres d'authentification
     * @returns {Promise<Object>} - Résumé généré
     */
    async generateSummary(pageContent, authSettings = {}) {
        // Vérifier si les commentaires sont vides
        if (!pageContent.comments || pageContent.comments.length === 0) {
            throw new Error('Aucun commentaire à analyser');
        }
        
        // Normaliser et échantillonner les commentaires
        pageContent.comments = this._normalizeAndSampleComments(pageContent.comments);
        
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
                let useApiKey = false;
                
                // Essayer d'abord d'utiliser la clé API par défaut ou configurée
                const apiKey = authSettings.apiKey || this.API_KEY;
                if (apiKey) {
                    // Utiliser la clé API directement dans l'URL
                    apiUrl = `${this.API_URL}?key=${encodeURIComponent(apiKey)}`;
                    useApiKey = true;
                    // Log masqué de la clé API pour le débogage
                    const maskedKey = apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);
                    console.log(`Utilisation de l'authentification par clé API: ${maskedKey}`);
                    console.log(`URL complète: ${this.API_URL}?key=API_KEY_MASQUEE`);
                }
                // Si la méthode configurée est OAuth2 et qu'on n'a pas forcé l'utilisation de la clé API
                else if (authSettings.method === 'oauth2') {
                    try {
                        const token = await this.getAccessToken();
                        if (token) {
                            authHeader = {
                                'Authorization': `Bearer ${token}`
                            };
                            console.log('Utilisation d\'OAuth2 pour l\'authentification');
                        } else {
                            throw new Error('Token OAuth2 non disponible');
                        }
                    } catch (authError) {
                        console.warn('Échec de l\'authentification OAuth2:', authError);
                        throw new Error('Aucune méthode d\'authentification disponible');
                    }
                } else {
                    throw new Error('Aucune méthode d\'authentification disponible');
                }

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
                                "text": `Analyse les commentaires ${pageContent.platform || 'Reddit'} suivants en te concentrant sur l'identification des opinions principales, leur popularité basée sur les votes, et les points de consensus/friction.
                                
                                IMPORTANT: Ta réponse doit être un objet JSON valide, sans aucun texte avant ou après. Utilise uniquement des guillemets doubles pour les chaînes.
                                
                                Titre: ${pageContent.postTitle}
                                
                                Commentaires (triés par score):
                                ${pageContent.comments.map(c => `[Score: ${c.score || 0}] [Auteur: ${c.author || 'Anonyme'}] [OP: ${c.isOP ? 'Oui' : 'Non'}] ${c.text}`).join('\n')}
                                
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
                                      "topic": "<sujet de consensus>",
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
                                
                                IMPORTANT:
                                - Pour les frictionPoints, assure-toi que chaque sujet contient EXACTEMENT deux opinions clairement opposées
                                - Les stances doivent être des phrases courtes (max 10 mots) et clairement opposées (pour/contre)
                                - Les votes doivent toujours être des nombres positifs (ne pas utiliser de valeurs négatives)
                                - Identifie les sujets de désaccord les plus importants et les plus polarisants
                                - Chaque sujet doit être spécifique et concret, pas vague ou général
                                `
                            }]
                        }],
                        "generationConfig": {
                            "temperature": 0,
                            "topK": 1,
                            "topP": 0.1,
                            "maxOutputTokens": 4096,
                            "seed": this.FIXED_SEED
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

                // Afficher tous les commentaires envoyés à Gemini de manière détaillée
                console.log("======== COMMENTAIRES ENVOYÉS À GEMINI (SERVICE WORKER) ========");
                console.log(`Nombre total de commentaires: ${pageContent.comments.length}`);
                
                // Stocker le nombre de commentaires extraits pour l'utiliser dans parseGeminiResponse
                // Utiliser commentCount s'il est disponible, sinon utiliser la longueur du tableau comments
                this._currentExtractedCommentsCount = pageContent.commentCount || pageContent.comments.length;
                console.log(`Nombre de commentaires extraits stocké: ${this._currentExtractedCommentsCount}`);
                
                // Vérification supplémentaire pour s'assurer que cette valeur est un nombre valide
                if (typeof this._currentExtractedCommentsCount !== 'number' || isNaN(this._currentExtractedCommentsCount)) {
                    console.warn('Valeur invalide pour le nombre de commentaires extraits, utilisation de la valeur par défaut');
                    this._currentExtractedCommentsCount = pageContent.comments.length || 0;
                }
                
                let totalChars = 0;
                pageContent.comments.forEach((comment, index) => {
                    console.log(`Commentaire #${index + 1} [Score: ${comment.score}]:`);
                    console.log(comment.text);
                    totalChars += comment.text.length;
                    console.log("-------------------------------------------");
                });
                console.log(`Total caractères: ${totalChars} (après optimisation)`);
                console.log("================ FIN DES COMMENTAIRES ================");
                
                console.log('Commentaires envoyés à Gemini:', JSON.stringify(pageContent.comments, null, 2));
                
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
                    
                    // Vérifier si l'erreur est liée à l'authentification
                    if (errorMessage.includes('authentication') || 
                        errorMessage.includes('API key') || 
                        errorMessage.includes('auth') || 
                        response.status === 401 || 
                        response.status === 403) {
                        throw new Error(`Erreur d'authentification API: ${errorMessage}`);
                    }
                    
                    // Vérifier si l'erreur est liée au modèle
                    if (errorMessage.includes('model') || errorMessage.includes('not found')) {
                        console.error('Erreur de modèle détectée, tentative de liste des modèles disponibles...');
                        try {
                            await this.listAvailableModels(authSettings);
                        } catch (modelListError) {
                            console.error('Impossible de lister les modèles:', modelListError);
                        }
                        
                        if (!useFallbackModel) {
                            console.log('Passage au modèle de secours pour la prochaine tentative');
                            useFallbackModel = true;
                            // Ne pas incrémenter retries pour permettre une nouvelle tentative avec le modèle de secours
                            continue;
                        }
                        
                        throw new Error(`Erreur de modèle API: ${errorMessage}. Essayez de mettre à jour l'extension ou contactez le support.`);
                    }
                    
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
                const result = this.parseGeminiResponse(text);
                
                // Vérifier que le nombre de commentaires extraits est bien présent dans le résultat
                if (typeof result.extractedCommentsCount !== 'number' || isNaN(result.extractedCommentsCount) || result.extractedCommentsCount === 0) {
                    console.warn('Nombre de commentaires extraits invalide dans le résultat, correction...');
                    result.extractedCommentsCount = this._currentExtractedCommentsCount || pageContent.comments.length;
                    console.log(`Nombre de commentaires extraits corrigé à: ${result.extractedCommentsCount}`);
                } else {
                    console.log(`Nombre de commentaires extraits dans le résultat: ${result.extractedCommentsCount}`);
                }
                
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
     * @param {Object} authSettings - Paramètres d'authentification
     * @returns {Promise<Array>} - Liste des modèles disponibles
     */
    async listAvailableModels(authSettings = {}) {
        try {
            // Essayer d'abord d'utiliser la clé API par défaut ou configurée
            const apiKey = authSettings.apiKey || this.API_KEY;
            let apiUrl = 'https://generativelanguage.googleapis.com/v1/models';
            let authHeader = {};
            
            if (apiKey) {
                apiUrl = `${apiUrl}?key=${encodeURIComponent(apiKey)}`;
                console.log('Utilisation de la clé API pour lister les modèles');
            } else if (authSettings.method === 'oauth2') {
                try {
                    const token = await this.getAccessToken();
                    if (token) {
                        authHeader = {
                            'Authorization': `Bearer ${token}`
                        };
                        console.log('Utilisation d\'OAuth2 pour lister les modèles');
                    } else {
                        throw new Error('Token OAuth2 non disponible');
                    }
                } catch (authError) {
                    console.warn('Échec de l\'authentification OAuth2:', authError);
                    throw new Error('Aucune méthode d\'authentification disponible');
                }
            } else {
                throw new Error('Aucune méthode d\'authentification disponible');
            }
            
            // Appel à l'API pour lister les modèles
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
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
