// Script d'extraction de contenu Reddit et Twitter optimisé

/**
 * Tronque un texte à la longueur spécifiée
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Extrait les commentaires en utilisant les éléments shreddit-comment
 * @returns {Array} Commentaires extraits
 */
function extractShredditComments() {
    const comments = [];
    const shredditComments = document.querySelectorAll('shreddit-comment');
    console.log(`Nombre d'éléments shreddit-comment trouvés: ${shredditComments.length}`);
    
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
                truncatedText: truncateText(commentText, 100)
            });
        } catch (commentError) {
            console.warn('Erreur lors de l\'extraction d\'un commentaire:', commentError);
            // Continuer avec le commentaire suivant
        }
    });
    
    return comments;
}

/**
 * Extrait les commentaires en utilisant les éléments avec slot="comment-content"
 * @returns {Array} Commentaires extraits
 */
function extractCommentSlots() {
    const comments = [];
    const commentSlots = document.querySelectorAll('[slot="comment-content"]');
    console.log(`Nombre d'éléments slot="comment-content" trouvés: ${commentSlots.length}`);
    
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
                    truncatedText: truncateText(commentText, 100)
                });
            }
        } catch (slotError) {
            console.warn('Erreur lors de l\'extraction d\'un slot de commentaire:', slotError);
            // Continuer avec le slot suivant
        }
    });
    
    return comments;
}

/**
 * Extrait les commentaires en utilisant les éléments avec la classe .Comment
 * @returns {Array} Commentaires extraits
 */
function extractOldComments() {
    const comments = [];
    const oldComments = document.querySelectorAll('.Comment');
    console.log(`Nombre d'éléments .Comment trouvés: ${oldComments.length}`);
    
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
                truncatedText: truncateText(commentText, 100)
            });
        } catch (oldCommentError) {
            console.warn('Erreur lors de l\'extraction d\'un ancien commentaire:', oldCommentError);
            // Continuer avec le commentaire suivant
        }
    });
    
    return comments;
}

/**
 * Extrait les commentaires en utilisant une recherche générique de texte
 * @returns {Array} Commentaires extraits
 */
function extractGenericText() {
    const comments = [];
    const paragraphs = document.querySelectorAll('p');
    console.log(`Nombre de paragraphes trouvés: ${paragraphs.length}`);
    
    paragraphs.forEach((p, index) => {
        try {
            const text = p.textContent.trim();
            if (text && text.length > 20 && text.length < 2000) {
                comments.push({
                    text: text,
                    score: 0, // Score inconnu
                    author: 'Utilisateur ' + index,
                    truncatedText: truncateText(text, 100)
                });
            }
        } catch (paragraphError) {
            console.warn('Erreur lors de l\'extraction d\'un paragraphe:', paragraphError);
            // Continuer avec le paragraphe suivant
        }
    });
    
    return comments;
}

/**
 * Extrait les métadonnées du post
 * @returns {Object} Métadonnées du post
 */
function extractPostMetadata() {
    try {
        const postTitle = document.querySelector('h1, [data-testid="post-title"]')?.textContent || 'Titre non disponible';
        const postContent = document.querySelector('[data-testid="post-content"], .Post__content')?.textContent || '';
        
        return {
            postTitle,
            postContent,
            url: window.location.href
        };
    } catch (error) {
        console.warn('Erreur lors de l\'extraction des métadonnées:', error);
        return {
            postTitle: document.title || 'Titre non disponible',
            postContent: '',
            url: window.location.href
        };
    }
}

/**
 * Extrait les commentaires Twitter avec défilement automatique pour charger plus de commentaires
 * @param {number} maxComments - Nombre maximum de commentaires à extraire
 * @returns {Promise<Array>} Commentaires extraits
 */
async function extractTwitterComments(maxComments = 150) {
    const comments = [];
    console.log('Début de l\'extraction des commentaires Twitter...');
    
    try {
        // 1. Cibler le conteneur principal des conversations Twitter avec plusieurs sélecteurs possibles
        // Priorité au conteneur spécifique de conversation
        console.log('Recherche du conteneur de conversation...');
        let conversationContainer = document.querySelector('div[aria-label="Timeline: Conversation"]');
        
        if (conversationContainer) {
            console.log('Conteneur principal trouvé: div[aria-label="Timeline: Conversation"]');
        } else {
            // Essayer d'autres sélecteurs si le premier n'est pas trouvé
            const alternativeSelectors = [
                'section[role="region"]',
                'div[data-testid="primaryColumn"]',
                'section[aria-labelledby^="accessible-list"]',
                'div[aria-label^="Timeline"]'
            ];
            
            for (const selector of alternativeSelectors) {
                const container = document.querySelector(selector);
                if (container && container.querySelectorAll('article').length > 0) {
                    conversationContainer = container;
                    console.log(`Conteneur alternatif trouvé: ${selector}`);
                    break;
                }
            }
            
            // Dernier recours: utiliser le body
            if (!conversationContainer) {
                console.warn('Aucun conteneur spécifique trouvé, utilisation du body comme fallback');
                conversationContainer = document.body;
            }
        }
        
        // 2. Identifier le tweet principal (original) et son auteur
        console.log('Recherche du tweet principal...');
        const tweetSelectors = [
            'article[data-testid="tweet"]',
            'article',
            'div[data-testid="tweetDetail"]'
        ];
        
        let mainTweet = null;
        for (const selector of tweetSelectors) {
            const tweets = document.querySelectorAll(selector);
            if (tweets.length > 0) {
                mainTweet = tweets[0];
                console.log(`Tweet principal trouvé avec le sélecteur: ${selector}`);
                break;
            }
        }
        
        if (!mainTweet) {
            console.error('Aucun tweet principal trouvé');
            return comments;
        }
        
        // Extraire l'auteur du tweet principal avec plusieurs sélecteurs possibles
        let mainTweetAuthor = 'Anonyme';
        const authorSelectors = [
            'div[data-testid="User-Name"] a',
            'a[role="link"] div[dir="ltr"] span',
            'a[role="link"] span[dir="ltr"]'
        ];
        
        for (const selector of authorSelectors) {
            const authorElement = mainTweet.querySelector(selector);
            if (authorElement) {
                mainTweetAuthor = authorElement.textContent.trim();
                console.log(`Auteur du tweet principal trouvé: ${mainTweetAuthor}`);
                break;
            }
        }
        
        // 3. Trouver tous les tweets (articles) dans la conversation avec défilement automatique amélioré
        console.log('Recherche de tous les tweets dans la conversation avec défilement automatique amélioré...');
        let tweetElements = [];
        let previousTweetCount = 0;
        let scrollAttempts = 0;
        let noNewTweetsCount = 0;
        const MAX_SCROLL_ATTEMPTS = 100; // Augmentation du nombre maximal de tentatives
        const MAX_NO_NEW_TWEETS = 5; // Nombre de tentatives consécutives sans nouveaux tweets avant d'arrêter
        
        // Fonction pour extraire les tweets actuellement visibles
        const extractVisibleTweets = () => {
            let allTweets = [];
            for (const selector of tweetSelectors) {
                const tweets = conversationContainer.querySelectorAll(selector);
                if (tweets.length > 0) {
                    allTweets = Array.from(tweets);
                    break;
                }
            }
            
            // Si aucun tweet n'est trouvé avec les sélecteurs spécifiques, essayer un sélecteur plus générique
            if (allTweets.length === 0) {
                const genericTweets = conversationContainer.querySelectorAll('article');
                if (genericTweets.length > 0) {
                    allTweets = Array.from(genericTweets);
                }
            }
            
            return allTweets;
        };
        
        // Fonction pour faire défiler la page de manière plus efficace
        const scrollDown = () => {
            // Méthode 1: Défilement progressif pour simuler un comportement plus naturel
            const currentPosition = window.scrollY;
            const targetPosition = currentPosition + window.innerHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Méthode 2: Défilement jusqu'au dernier tweet visible pour charger plus de contenu
            if (tweetElements.length > 0) {
                const lastTweet = tweetElements[tweetElements.length - 1];
                if (lastTweet && lastTweet.scrollIntoView) {
                    try {
                        lastTweet.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    } catch (e) {
                        console.warn('Erreur lors du défilement vers le dernier tweet:', e);
                    }
                }
            }
        };
        
        // Fonction pour détecter les boutons "Afficher plus de réponses" et cliquer dessus
        const clickShowMoreButtons = async () => {
            const showMoreSelectors = [
                'div[role="button"][tabindex="0"]:not([aria-haspopup="true"])',
                'div[role="button"]:not([aria-haspopup="true"])',
                'span[role="button"]'
            ];
            
            let clicked = false;
            for (const selector of showMoreSelectors) {
                const buttons = conversationContainer.querySelectorAll(selector);
                for (const button of buttons) {
                    const text = button.textContent.toLowerCase();
                    if (text.includes('plus') || text.includes('more') || text.includes('show') || 
                        text.includes('afficher') || text.includes('réponses')) {
                        try {
                            console.log('Clic sur bouton "Afficher plus":', text);
                            button.click();
                            clicked = true;
                            // Attendre un peu après le clic
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } catch (e) {
                            console.warn('Erreur lors du clic sur le bouton:', e);
                        }
                    }
                }
                if (clicked) break;
            }
            return clicked;
        };
        
        // Extraction initiale des tweets
        tweetElements = extractVisibleTweets();
        console.log(`Initialement ${tweetElements.length} tweets trouvés`);
        
        // Continuer à défiler tant qu'on trouve de nouveaux tweets et qu'on n'a pas atteint la limite
        while (tweetElements.length < maxComments && scrollAttempts < MAX_SCROLL_ATTEMPTS && noNewTweetsCount < MAX_NO_NEW_TWEETS) {
            previousTweetCount = tweetElements.length;
            
            // 1. Essayer de cliquer sur les boutons "Afficher plus"
            const clickedShowMore = await clickShowMoreButtons();
            if (clickedShowMore) {
                console.log('Bouton "Afficher plus" cliqué, attente du chargement...');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            // 2. Faire défiler vers le bas
            scrollDown();
            
            // 3. Attendre que le contenu se charge (temps d'attente plus long)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 4. Extraire les tweets après le défilement
            tweetElements = extractVisibleTweets();
            
            console.log(`Après défilement #${scrollAttempts + 1}: ${tweetElements.length} tweets trouvés (précédemment: ${previousTweetCount})`);
            
            // Vérifier si de nouveaux tweets ont été chargés
            if (tweetElements.length > previousTweetCount) {
                noNewTweetsCount = 0; // Réinitialiser le compteur car nous avons trouvé de nouveaux tweets
            } else {
                noNewTweetsCount++;
                console.log(`Aucun nouveau tweet trouvé depuis ${noNewTweetsCount} tentatives`);
            }
            
            scrollAttempts++;
            
            // Pause plus longue toutes les 10 tentatives pour éviter les limitations
            if (scrollAttempts % 10 === 0) {
                console.log('Pause plus longue pour éviter les limitations...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        const stopReason = tweetElements.length >= maxComments ? 'limite atteinte' : 
                          (scrollAttempts >= MAX_SCROLL_ATTEMPTS ? 'nombre maximum de tentatives atteint' : 
                          'aucun nouveau tweet après plusieurs tentatives');
        
        console.log(`Défilement terminé après ${scrollAttempts} tentatives: ${tweetElements.length} tweets trouvés (raison: ${stopReason})`);
        
        if (tweetElements.length === 0) {
            console.warn('Aucun tweet trouvé dans le conteneur de conversation');
            // Essayer de trouver des tweets dans tout le document comme dernier recours
            tweetElements = Array.from(document.querySelectorAll('article'));
            console.log(`${tweetElements.length} tweets trouvés dans le document entier`);
        }
        
        // 4. Extraire les informations de chaque tweet
        console.log(`Traitement de ${tweetElements.length} tweets...`);
        tweetElements.forEach((tweet, index) => {
            try {
                // 4.1 Extraire le texte du tweet avec plusieurs sélecteurs possibles
                let tweetText = '';
                const textSelectors = [
                    'div[data-testid="tweetText"]',
                    'div[lang]',
                    'div[dir="auto"]'
                ];
                
                for (const selector of textSelectors) {
                    const textElement = tweet.querySelector(selector);
                    if (textElement) {
                        tweetText = textElement.textContent.trim();
                        break;
                    }
                }
                
                if (!tweetText) {
                    console.log(`Tweet #${index + 1} ignoré: pas de texte`);
                    return; // Ignorer les tweets sans texte
                }
                
                // 4.2 Extraire l'auteur du tweet
                let author = 'Anonyme';
                for (const selector of authorSelectors) {
                    const authorElement = tweet.querySelector(selector);
                    if (authorElement) {
                        author = authorElement.textContent.trim();
                        break;
                    }
                }
                
                // 4.3 Vérifier si c'est l'auteur original (OP)
                const isOP = author === mainTweetAuthor;
                
                // 4.4 Extraire le nombre de likes (upvotes) avec plusieurs sélecteurs possibles
                let likes = 0;
                const likeSelectors = [
                    'div[data-testid="like"]',
                    'div[role="button"][data-testid="like"]',
                    'div[aria-label*="Like"]',
                    'div[aria-label*="J\'aime"]',
                    'div[data-testid="like"] span',
                    'div[aria-label*="likes"] span',
                    'div[aria-label*="j\'aime"] span'
                ];
                
                for (const selector of likeSelectors) {
                    const likeElements = tweet.querySelectorAll(selector);
                    if (likeElements && likeElements.length > 0) {
                        // Parcourir tous les éléments trouvés
                        for (const likeElement of likeElements) {
                            // Essayer d'extraire le texte directement
                            const likeText = likeElement.textContent.trim();
                            if (likeText && /^\d+(\.\d+)?[KMk]?$/.test(likeText)) {
                                // Convertir en nombre (gérer les formats comme "1.2K")
                                if (likeText.includes('K') || likeText.includes('k')) {
                                    likes = parseFloat(likeText.replace(/[Kk]/g, '')) * 1000;
                                } else if (likeText.includes('M') || likeText.includes('m')) {
                                    likes = parseFloat(likeText.replace(/[Mm]/g, '')) * 1000000;
                                } else {
                                    likes = parseInt(likeText) || 0;
                                }
                                console.log(`Likes trouvés pour le tweet #${index + 1}: ${likes} (texte: ${likeText})`);
                                break;
                            }
                            
                            // Si pas de texte direct, chercher dans les enfants
                            const likeCountElement = likeElement.querySelector('span[data-testid="app-text-transition-container"]') || 
                                                    likeElement.querySelector('span');
                            if (likeCountElement) {
                                const nestedLikeText = likeCountElement.textContent.trim();
                                if (nestedLikeText && /^\d+(\.\d+)?[KMk]?$/.test(nestedLikeText)) {
                                    // Convertir en nombre
                                    if (nestedLikeText.includes('K') || nestedLikeText.includes('k')) {
                                        likes = parseFloat(nestedLikeText.replace(/[Kk]/g, '')) * 1000;
                                    } else if (nestedLikeText.includes('M') || nestedLikeText.includes('m')) {
                                        likes = parseFloat(nestedLikeText.replace(/[Mm]/g, '')) * 1000000;
                                    } else {
                                        likes = parseInt(nestedLikeText) || 0;
                                    }
                                    console.log(`Likes trouvés pour le tweet #${index + 1}: ${likes} (texte imbriqué: ${nestedLikeText})`);
                                    break;
                                }
                            }
                        }
                        
                        if (likes > 0) break; // Sortir si on a trouvé des likes
                    }
                }
                
                // S'assurer que likes est un nombre valide
                if (isNaN(likes) || likes < 0) {
                    console.warn(`Valeur de likes invalide pour le tweet #${index + 1}, réinitialisation à 0`);
                    likes = 0;
                }
                
                // 4.5 Extraire l'ID du tweet et le permalink
                let tweetId = `twitter-${index}`;
                let tweetLink = window.location.href;
                
                const linkElement = tweet.querySelector('a[href*="/status/"]');
                if (linkElement) {
                    tweetLink = linkElement.href;
                    const match = tweetLink.match(/\/status\/(\d+)/);
                    if (match && match[1]) {
                        tweetId = match[1];
                    }
                }
                
                // 4.6 Extraire la date de création
                let created = new Date().toISOString();
                const timeElement = tweet.querySelector('time');
                if (timeElement && timeElement.hasAttribute('datetime')) {
                    created = timeElement.getAttribute('datetime');
                }
                
                // 5. Créer un objet commentaire avec la même structure que Reddit
                const comment = {
                    text: tweetText,
                    author: author,
                    score: likes,
                    upvotes: likes, // Pour la compatibilité avec Reddit
                    downvotes: 0,   // Twitter n'a pas de downvotes
                    awards: 0,      // Twitter n'a pas d'awards
                    isOP: isOP,
                    id: tweetId,
                    permalink: tweetLink,
                    created: created,
                    truncatedText: truncateText(tweetText, 100)
                };
                
                // Vérifier que les valeurs numériques sont valides
                if (isNaN(comment.score) || comment.score < 0) comment.score = 0;
                if (isNaN(comment.upvotes) || comment.upvotes < 0) comment.upvotes = 0;
                if (isNaN(comment.downvotes) || comment.downvotes < 0) comment.downvotes = 0;
                if (isNaN(comment.awards) || comment.awards < 0) comment.awards = 0;
                
                // 6. Valider que toutes les propriétés requises sont présentes
                const requiredProps = ['text', 'author', 'score', 'upvotes', 'downvotes', 'awards', 'isOP', 'id', 'permalink', 'created'];
                const missingProps = requiredProps.filter(prop => !comment.hasOwnProperty(prop) || comment[prop] === undefined);
                
                if (missingProps.length > 0) {
                    console.warn(`Tweet #${index + 1} a des propriétés manquantes:`, missingProps);
                    // Ajouter des valeurs par défaut pour les propriétés manquantes
                    missingProps.forEach(prop => {
                        if (prop === 'text' || prop === 'author' || prop === 'permalink') {
                            comment[prop] = comment[prop] || '';
                        } else if (prop === 'id') {
                            comment[prop] = comment[prop] || `twitter-${index}`;
                        } else if (prop === 'created') {
                            comment[prop] = comment[prop] || new Date().toISOString();
                        } else if (prop === 'isOP') {
                            comment[prop] = comment[prop] || false;
                        } else {
                            comment[prop] = comment[prop] || 0;
                        }
                    });
                }
                
                // 7. Ajouter le commentaire à la liste
                comments.push(comment);
                console.log(`Tweet #${index + 1} extrait avec succès:`, {
                    author: comment.author,
                    isOP: comment.isOP,
                    score: comment.score,
                    id: comment.id,
                    text: comment.truncatedText
                });
                
            } catch (tweetError) {
                console.error(`Erreur lors de l'extraction du tweet #${index + 1}:`, tweetError);
            }
        });
        
        // 8. Afficher le premier commentaire pour débogage
        if (comments.length > 0) {
            console.log('Premier commentaire Twitter (structure complète):', JSON.stringify(comments[0], null, 2));
        } else {
            console.warn('Aucun commentaire extrait');
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'extraction des commentaires Twitter:', error);
    }
    
    console.log(`Extraction Twitter terminée: ${comments.length} commentaires extraits`);
    return comments;
}

/**
 * Vérifie si la page actuelle est Twitter
 * @returns {boolean} Vrai si c'est une page Twitter
 */
function isTwitterPage() {
    return window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');
}

/**
 * Crée un objet de réponse d'erreur
 * @param {Error} error - Erreur
 * @returns {Object} Objet de réponse d'erreur
 */
function createErrorResponse(error) {
    return {
        success: false,
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        }
    };
}

/**
 * Extrait le contenu de la page (Reddit ou Twitter)
 * @returns {Promise<Object>} Contenu de la page
 */
async function getPageContent() {
    try {
        // Récupérer les options de l'extension, notamment maxComments
        const options = await new Promise(resolve => {
            chrome.storage.local.get({ maxComments: 150 }, resolve);
        });
        
        console.log(`Options récupérées: limite de ${options.maxComments} commentaires`);
        
        // Déterminer si nous sommes sur Twitter ou Reddit
        const isTwitter = isTwitterPage();
        const platform = isTwitter ? 'Twitter' : 'Reddit';
        console.log(`Début de l'extraction du contenu ${platform}`);
        
        // Extraction des métadonnées
        const metadata = extractPostMetadata();
        
        // Extraction des commentaires avec différentes méthodes
        let comments = [];
        
        if (isTwitter) {
            // Extraction des commentaires Twitter avec défilement automatique
            comments = await extractTwitterComments(options.maxComments);
            console.log(`Extraction Twitter: ${comments.length} commentaires trouvés`);
        } else {
            // Méthode 1: Shreddit Comments
            const shredditComments = extractShredditComments();
            if (shredditComments.length > 0) {
                console.log(`Extraction réussie avec Shreddit Comments: ${shredditComments.length} commentaires`);
                comments = shredditComments;
            } else {
                // Méthode 2: Comment Slots
                const slotComments = extractCommentSlots();
                if (slotComments.length > 0) {
                    console.log(`Extraction réussie avec Comment Slots: ${slotComments.length} commentaires`);
                    comments = slotComments;
                } else {
                    // Méthode 3: Old Comments
                    const oldComments = extractOldComments();
                    if (oldComments.length > 0) {
                        console.log(`Extraction réussie avec Old Comments: ${oldComments.length} commentaires`);
                        comments = oldComments;
                    } else {
                        // Méthode 4: Generic Text (fallback)
                        const genericComments = extractGenericText();
                        console.log(`Extraction générique: ${genericComments.length} paragraphes`);
                        comments = genericComments;
                    }
                }
            }
        }
        
        // S'assurer que tous les commentaires ont les propriétés requises
        comments = comments.map(comment => {
            // Définir des valeurs par défaut pour les propriétés manquantes
            return {
                text: comment.text || '',
                author: comment.author || 'Anonyme',
                score: comment.score || 0,
                upvotes: comment.upvotes || comment.score || 0,
                downvotes: comment.downvotes || 0,
                awards: comment.awards || 0,
                isOP: comment.isOP || false,
                id: comment.id || `comment-${Math.random().toString(36).substring(2, 10)}`,
                permalink: comment.permalink || '',
                created: comment.created || new Date().toISOString(),
                truncatedText: comment.truncatedText || truncateText(comment.text || '', 100)
            };
        });
        
        // Trier les commentaires par score (descendant)
        comments.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Limiter le nombre de commentaires à la valeur définie dans les options
        if (comments.length > options.maxComments) {
            console.log(`Limitation du nombre de commentaires à ${options.maxComments}`);
            comments = comments.slice(0, options.maxComments);
        }
        
        return {
            success: true,
            postTitle: metadata.postTitle,
            postContent: metadata.postContent,
            url: metadata.url,
            platform: platform,
            comments: comments,
            commentCount: comments.length
        };
    } catch (error) {
        console.error('Erreur lors de l\'extraction du contenu:', error);
        return createErrorResponse(error);
    }
}

// Écouteur de messages pour communiquer avec le popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message reçu dans content.js:', request.action);
    
    // Répondre au ping pour vérifier que le content script est injecté
    if (request.action === 'ping') {
        console.log('Ping reçu, réponse envoyée');
        sendResponse({ status: 'ok' });
        return true;
    }
    
    if (request.action === 'getContent' || request.action === 'getPageContent') {
        console.log('Réception de la demande d\'extraction de contenu');
        
        // Utiliser une fonction asynchrone auto-exécutée pour gérer les promesses
        (async () => {
            try {
                // Extraction du contenu et envoi de la réponse
                const content = await getPageContent();
                console.log(`Contenu extrait avec succès: ${content.commentCount} commentaires`);
                sendResponse(content);
            } catch (error) {
                console.error('Erreur lors de l\'extraction du contenu:', error);
                sendResponse({ 
                    success: false,
                    error: `Erreur lors de l'extraction: ${error.message || 'Erreur inconnue'}`,
                    errorDetails: error.toString()
                });
            }
        })();
    } else if (request.action === 'checkRedditPage') {
        // Vérifier si nous sommes sur une page Reddit
        const isRedditPage = window.location.hostname.includes('reddit.com');
        sendResponse({ isRedditPage });
    } else if (request.action === 'checkTwitterPage') {
        // Vérifier si nous sommes sur une page Twitter
        const isTwitterPage = window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');
        sendResponse({ isTwitterPage });
    } else if (request.action === 'checkSupportedPage') {
        // Vérifier si nous sommes sur une page supportée (Reddit ou Twitter)
        const isRedditPage = window.location.hostname.includes('reddit.com');
        const isTwitterPage = window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');
        sendResponse({ isSupported: isRedditPage || isTwitterPage, platform: isTwitterPage ? 'Twitter' : (isRedditPage ? 'Reddit' : 'Unsupported') });
    }
    
    // Retourner true pour indiquer que la réponse sera envoyée de manière asynchrone
    return true;
});
