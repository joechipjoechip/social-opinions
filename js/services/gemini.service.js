class GeminiService {
    constructor() {
        // URL de l'API Gemini corrigée avec un modèle disponible
        this.API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';
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
            return {
                overview: {
                    totalComments: this._safeNumber(data.overview?.totalComments),
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
     * Génère un résumé des commentaires avec gestion de cache et retries
     * @param {Object} pageContent - Contenu de la page
     * @returns {Promise<Object>} - Données d'analyse
     */
    async generateSummary(pageContent) {
        // S'assurer que le cache est initialisé
        await this.initialize();
        
        // Génération d'une clé de cache basée sur le contenu
        const cacheKey = this._generateCacheKey(pageContent);
        
        // Vérification du cache
        if (this.cache.has(cacheKey)) {
            console.log('Utilisation des données en cache');
            const cachedData = this.cache.get(cacheKey);
            // Ajouter une propriété indiquant que les données proviennent du cache
            return { ...cachedData, _fromCache: true };
        }

        let retries = 0;
        let lastError = null;
        let quotaExceeded = false;

        while (retries < this.MAX_RETRIES && !quotaExceeded) {
            try {
                // Récupérer la méthode d'authentification configurée
                const authSettings = await new Promise(resolve => {
                    chrome.storage.local.get(['authMethod', 'apiKey'], (data) => {
                        resolve({
                            method: data.authMethod || 'apiKey',
                            apiKey: data.apiKey || ''
                        });
                    });
                });
                
                // Préparer les en-têtes d'authentification
                let authHeader = {};
                let apiUrl = this.API_URL;
                
                if (authSettings.method === 'oauth2') {
                    try {
                        const token = await this.getAccessToken();
                        if (token) {
                            authHeader = {
                                'Authorization': `Bearer ${token}`
                            };
                            console.log('Utilisation de l\'authentification OAuth2');
                        } else {
                            throw new Error('Token OAuth2 non disponible');
                        }
                    } catch (authError) {
                        console.warn('Échec de l\'authentification OAuth2:', authError);
                        
                        // Si l'OAuth2 échoue et qu'une clé API est disponible, on l'utilise
                        if (authSettings.apiKey) {
                            console.log('Utilisation de la clé API comme fallback');
                            apiUrl = `${this.API_URL}?key=${authSettings.apiKey}`;
                        } else {
                            throw new Error('Authentification OAuth2 échouée. Veuillez réessayer ou configurer une clé API Gemini dans les paramètres de l\'extension comme solution de secours.');
                        }
                    }
                } else {
                    // Méthode API Key
                    if (!authSettings.apiKey) {
                        throw new Error('Clé API non configurée. Veuillez configurer une clé API Gemini dans les paramètres de l\'extension.');
                    }
                    
                    apiUrl = `${this.API_URL}?key=${authSettings.apiKey}`;
                    console.log('Utilisation de l\'authentification par clé API');
                }
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeader
                    },
                    body: JSON.stringify({
                        "contents": [{
                            "parts": [{
                                "text": `Analyse les commentaires Reddit suivants en te concentrant sur l'identification des opinions principales, leur popularité basée sur les votes, et les points de consensus/friction. 
IMPORTANT: Ta réponse doit être un objet JSON valide, sans aucun texte avant ou après. Utilise uniquement des guillemets doubles pour les chaînes.

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
      "topic": "<sujet>",
      "opinion1": {
        "stance": "<position>",
        "votes": <nombre>,
        "keyArguments": ["<argument 1>", "<argument 2>"]
      },
      "opinion2": {
        "stance": "<position opposée>",
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
                            "temperature": 0.7,
                            "topK": 40,
                            "topP": 0.95,
                            "maxOutputTokens": 2048
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.log('Erreur API Gemini:', errorData);
                    
                    // Amélioration de la détection des erreurs de quota
                    if (
                        errorData.error?.code === 429 || 
                        errorData.error?.message?.includes('quota') ||
                        errorData.error?.message?.includes('limit') ||
                        errorData.error?.message?.includes('rate')
                    ) {
                        console.warn('Erreur de quota détectée:', errorData.error?.message);
                        quotaExceeded = true;
                        throw new Error('Erreur de quota: vous avez dépassé la limite d\'appels à l\'API Gemini. Veuillez réessayer plus tard ou utiliser une autre clé API.');
                    } else {
                        throw new Error(`Erreur API: ${errorData.error?.message || response.statusText}`);
                    }
                }

                const data = await response.json();
                
                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('Aucune réponse générée par l\'API');
                }
                
                const text = data.candidates[0].content.parts[0].text;
                const result = this.parseGeminiResponse(text);
                
                // Mise en cache du résultat
                this.cache.set(cacheKey, result);
                
                // Sauvegarder le cache dans le stockage local
                await this._saveCacheToStorage();
                
                return result;
            } catch (error) {
                console.error(`Tentative ${retries + 1}/${this.MAX_RETRIES} échouée:`, error);
                lastError = error;
                
                // Si l'erreur est liée au quota, ne pas réessayer
                if (quotaExceeded) {
                    break;
                }
                
                retries++;
                
                if (retries < this.MAX_RETRIES) {
                    // Attendre avant de réessayer (backoff exponentiel)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
                }
            }
        }
        
        // Si l'erreur est liée au quota, essayer de retourner une analyse basique
        if (quotaExceeded) {
            // Créer une analyse basique basée sur les commentaires
            const basicAnalysis = this._createBasicAnalysis(pageContent);
            
            // Mettre en cache cette analyse basique
            this.cache.set(cacheKey, basicAnalysis);
            await this._saveCacheToStorage();
            
            return basicAnalysis;
        }
        
        throw new Error(`Échec après ${this.MAX_RETRIES} tentatives: ${lastError.message}`);
    }
    
    /**
     * Crée une analyse basique basée uniquement sur les commentaires
     * @param {Object} pageContent - Contenu de la page
     * @returns {Object} - Analyse basique
     * @private
     */
    _createBasicAnalysis(pageContent) {
        const comments = pageContent.comments || [];
        const totalComments = comments.length;
        
        // Trouver le commentaire avec le score le plus élevé
        let topComment = { text: "Pas de commentaire", score: 0 };
        let totalScore = 0;
        
        for (const comment of comments) {
            totalScore += comment.score || 0;
            if ((comment.score || 0) > (topComment.score || 0)) {
                topComment = comment;
            }
        }
        
        // Créer une analyse basique
        return {
            overview: {
                totalComments: totalComments,
                mainOpinion: topComment.text.substring(0, 100) + "...",
                consensusLevel: 0.5
            },
            opinionClusters: [
                {
                    opinion: "Analyse limitée - quota API dépassé",
                    totalVotes: totalScore,
                    commentCount: totalComments,
                    avgScore: totalComments > 0 ? Math.round(totalScore / totalComments) : 0,
                    representativeComment: topComment.text,
                    relatedOpinions: ["Analyse complète non disponible - quota API dépassé"]
                }
            ],
            consensusPoints: [
                {
                    topic: "Analyse limitée",
                    agreementLevel: 0.5,
                    totalVotes: totalScore,
                    keyEvidence: ["Quota API dépassé - analyse complète non disponible"]
                }
            ],
            frictionPoints: [],
            voteDistribution: [
                {
                    opinionGroup: "Tous les commentaires",
                    totalVotes: totalScore,
                    percentageOfTotal: 100,
                    topComments: comments.slice(0, 3).map(c => c.text)
                }
            ],
            _quotaExceeded: true
        };
    }

    /**
     * Génère une clé de cache basée sur l'URL de la page
     * @param {Object} pageContent - Contenu de la page
     * @returns {string} - Clé de cache
     */
    _generateCacheKey(pageContent) {
        // Utiliser principalement l'URL pour la clé de cache
        // Cela permettra de conserver le cache même après un rechargement de la page
        if (pageContent.url) {
            // Extraire l'identifiant unique du post Reddit de l'URL
            const urlParts = pageContent.url.split('/');
            const postId = urlParts.find(part => part.startsWith('comments'));
            
            if (postId) {
                // Ajouter le titre pour plus de spécificité mais sans les commentaires
                // qui peuvent changer lors d'un rechargement
                return `${postId}|${pageContent.postTitle}`;
            }
        }
        
        // Fallback: utiliser l'ancienne méthode si l'URL n'est pas disponible
        const commentSample = pageContent.comments
            .slice(0, Math.min(5, pageContent.comments.length))
            .map(c => `${c.score}:${c.text.substring(0, 50)}`)
            .join('|');
        
        return `${pageContent.postTitle}|${commentSample}`;
    }

    /**
     * Récupère le contenu de la page Reddit avec une extraction améliorée des commentaires
     * @returns {Promise<Object>} - Contenu de la page
     */
    async getPageContent() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
                try {
                    const tab = tabs[0];
                    
                    // Vérification que l'URL est bien une page Reddit
                    if (!tab.url.includes('reddit.com')) {
                        throw new Error('Cette extension fonctionne uniquement sur Reddit');
                    }
                    
                    // Utiliser chrome.scripting.executeScript pour exécuter le code directement
                    const results = await chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        func: () => {
                            try {
                                console.log('Début de l\'extraction du contenu Reddit');
                                const comments = [];
                                
                                // Extraction des commentaires
                                console.log('Extraction des commentaires...');
                                
                                // Approche 1: Rechercher les éléments shreddit-comment
                                const shredditComments = document.querySelectorAll('shreddit-comment');
                                console.log(`Nombre d'éléments shreddit-comment trouvés: ${shredditComments.length}`);
                                
                                if (shredditComments.length > 0) {
                                    // Extraire les informations des attributs
                                    shredditComments.forEach(comment => {
                                        try {
                                            const author = comment.getAttribute('author') || 'Anonyme';
                                            const score = parseInt(comment.getAttribute('score') || '0');
                                            const id = comment.getAttribute('thingid') || '';
                                            const depth = parseInt(comment.getAttribute('depth') || '0');
                                            
                                            // Essayer de trouver le contenu du commentaire
                                            let commentText = '';
                                            
                                            // Chercher dans les enfants directs
                                            const contentElements = comment.querySelectorAll('p, div, span');
                                            if (contentElements.length > 0) {
                                                // Concaténer le texte de tous les éléments de contenu
                                                contentElements.forEach(el => {
                                                    const text = el.textContent.trim();
                                                    if (text) commentText += text + ' ';
                                                });
                                                commentText = commentText.trim();
                                            }
                                            
                                            // Si aucun texte n'a été trouvé, utiliser un texte générique
                                            if (!commentText) {
                                                commentText = '[Contenu non disponible]';
                                            }
                                            
                                            comments.push({
                                                text: commentText,
                                                score: score,
                                                author: author,
                                                id: id,
                                                depth: depth,
                                                truncatedText: commentText.length > 100 ? commentText.substring(0, 100) + '...' : commentText
                                            });
                                        } catch (commentError) {
                                            console.warn('Erreur lors de l\'extraction d\'un commentaire:', commentError);
                                            // Continuer avec le commentaire suivant
                                        }
                                    });
                                    
                                    console.log(`Commentaires extraits avec succès: ${comments.length}`);
                                } else {
                                    // Approche 2: Rechercher les éléments avec slot="comment-content"
                                    console.log('Tentative d\'extraction via slot="comment-content"');
                                    const commentSlots = document.querySelectorAll('[slot="comment-content"]');
                                    console.log(`Nombre d'éléments slot="comment-content" trouvés: ${commentSlots.length}`);
                                    
                                    if (commentSlots.length > 0) {
                                        commentSlots.forEach(slot => {
                                            try {
                                                // Trouver le parent shreddit-comment pour obtenir les métadonnées
                                                const commentElement = slot.closest('shreddit-comment');
                                                
                                                const author = commentElement ? (commentElement.getAttribute('author') || 'Anonyme') : 'Anonyme';
                                                const score = commentElement ? parseInt(commentElement.getAttribute('score') || '0') : 0;
                                                
                                                const commentText = slot.textContent.trim();
                                                
                                                if (commentText && commentText.length > 5) {
                                                    comments.push({
                                                        text: commentText,
                                                        score: score,
                                                        author: author,
                                                        truncatedText: commentText.length > 100 ? commentText.substring(0, 100) + '...' : commentText
                                                    });
                                                }
                                            } catch (slotError) {
                                                console.warn('Erreur lors de l\'extraction d\'un slot de commentaire:', slotError);
                                                // Continuer avec le slot suivant
                                            }
                                        });
                                        
                                        console.log(`Commentaires extraits via slots: ${comments.length}`);
                                    } else {
                                        // Approche 3: Rechercher les éléments avec la classe .Comment
                                        console.log('Tentative d\'extraction via .Comment');
                                        const oldComments = document.querySelectorAll('.Comment');
                                        console.log(`Nombre d'éléments .Comment trouvés: ${oldComments.length}`);
                                        
                                        if (oldComments.length > 0) {
                                            oldComments.forEach(comment => {
                                                try {
                                                    // Extraction du contenu
                                                    const contentElem = comment.querySelector('.RichTextJSON-root, .md');
                                                    if (!contentElem) return;
                                                    
                                                    const commentText = contentElem.textContent.trim();
                                                    if (!commentText || commentText.length <= 5) return;
                                                    
                                                    // Extraction du score
                                                    const scoreElem = comment.querySelector('.score, [id^="vote-arrows-"]');
                                                    const score = scoreElem ? parseInt(scoreElem.textContent) || 0 : 0;
                                                    
                                                    // Extraction de l'auteur
                                                    const authorElem = comment.querySelector('.author');
                                                    const author = authorElem ? authorElem.textContent.trim() : 'Anonyme';
                                                    
                                                    comments.push({
                                                        text: commentText,
                                                        score: score,
                                                        author: author,
                                                        truncatedText: commentText.length > 100 ? commentText.substring(0, 100) + '...' : commentText
                                                    });
                                                } catch (oldCommentError) {
                                                    console.warn('Erreur lors de l\'extraction d\'un ancien commentaire:', oldCommentError);
                                                    // Continuer avec le commentaire suivant
                                                }
                                            });
                                            
                                            console.log(`Commentaires extraits via .Comment: ${comments.length}`);
                                        } else {
                                            // Approche 4: Recherche générique de texte
                                            console.log('Tentative d\'extraction générique de texte');
                                            const paragraphs = document.querySelectorAll('p');
                                            console.log(`Nombre de paragraphes trouvés: ${paragraphs.length}`);
                                            
                                            if (paragraphs.length > 0) {
                                                // Filtrer pour ne garder que les paragraphes qui ressemblent à des commentaires
                                                paragraphs.forEach((p, index) => {
                                                    try {
                                                        const text = p.textContent.trim();
                                                        if (text && text.length > 20 && text.length < 2000) {
                                                            comments.push({
                                                                text: text,
                                                                score: 0, // Score inconnu
                                                                author: 'Utilisateur ' + index,
                                                                truncatedText: text.length > 100 ? text.substring(0, 100) + '...' : text
                                                            });
                                                        }
                                                    } catch (paragraphError) {
                                                        console.warn('Erreur lors de l\'extraction d\'un paragraphe:', paragraphError);
                                                        // Continuer avec le paragraphe suivant
                                                    }
                                                });
                                                
                                                console.log(`Textes extraits de manière générique: ${comments.length}`);
                                            }
                                        }
                                    }
                                }
                                
                                // Vérifier si des commentaires ont été trouvés
                                if (comments.length === 0) {
                                    console.warn('Aucun commentaire trouvé sur la page');
                                    // Ajouter un commentaire fictif pour éviter les erreurs
                                    comments.push({
                                        text: "Aucun commentaire n'a été trouvé sur cette page. Assurez-vous d'être sur une page de discussion Reddit avec des commentaires visibles.",
                                        score: 0,
                                        author: 'Système',
                                        truncatedText: "Aucun commentaire n'a été trouvé sur cette page."
                                    });
                                }
                                
                                // Tri des commentaires par score décroissant
                                comments.sort((a, b) => b.score - a.score);
                                
                                // Extraction du titre et du contenu du post
                                const postTitle = document.querySelector('h1, [data-testid="post-title"]')?.textContent || 'Titre non disponible';
                                const postContent = document.querySelector('[data-testid="post-content"], .Post__content')?.textContent || '';
                                
                                console.log(`Extraction terminée: ${comments.length} commentaires, titre: "${postTitle.substring(0, 30)}${postTitle.length > 30 ? '...' : ''}"`);
                                
                                return {
                                    postTitle: postTitle,
                                    postContent: postContent,
                                    comments: comments,
                                    url: window.location.href,
                                    commentCount: comments.length
                                };
                            } catch (error) {
                                console.error('Erreur lors de l\'extraction du contenu:', error);
                                // Retourner un objet avec une erreur mais toujours utilisable
                                return {
                                    error: error.message,
                                    postTitle: document.title || 'Titre non disponible',
                                    postContent: '',
                                    comments: [{
                                        text: "Erreur lors de l'extraction des commentaires: " + error.message,
                                        score: 0,
                                        author: 'Système',
                                        truncatedText: "Erreur lors de l'extraction des commentaires: " + error.message
                                    }],
                                    url: window.location.href,
                                    commentCount: 1
                                };
                            }
                        }
                    });
                    
                    if (results && results[0]?.result) {
                        const content = results[0].result;
                        
                        // Limiter le nombre de commentaires pour éviter les problèmes de performance
                        content.comments = content.comments.slice(0, this.MAX_COMMENTS);
                        
                        // Ajouter des métadonnées
                        content.extractedAt = new Date().toISOString();
                        content.commentCount = content.comments.length;
                        
                        resolve(content);
                    } else {
                        reject(new Error('Impossible de récupérer le contenu de la page'));
                    }
                } catch (error) {
                    console.error('Erreur lors de l\'extraction du contenu:', error);
                    reject(error);
                }
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
}

// Rendre la classe disponible à la fois pour les modules ES6 et les Service Workers
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS/Node.js
    module.exports = GeminiService;
} else if (typeof exports !== 'undefined') {
    // CommonJS
    exports.GeminiService = GeminiService;
} else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], function() { return GeminiService; });
} else if (typeof self !== 'undefined') {
    // Service Worker / Window global
    self.GeminiService = GeminiService;
}

// Pour les modules ES6
export default GeminiService;
