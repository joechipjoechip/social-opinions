// Script d'extraction de contenu Reddit optimisé

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
 * Extrait le contenu de la page Reddit
 * @returns {Object} Contenu de la page
 */
function getPageContent() {
    try {
        console.log('Début de l\'extraction du contenu Reddit');
        
        // Extraction des métadonnées
        const metadata = extractPostMetadata();
        
        // Extraction des commentaires avec différentes méthodes
        let comments = [];
        
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
        
        // Trier les commentaires par score (descendant)
        comments.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Limiter le nombre de commentaires pour éviter les problèmes de performance
        const MAX_COMMENTS = 150;
        if (comments.length > MAX_COMMENTS) {
            console.log(`Limitation du nombre de commentaires à ${MAX_COMMENTS}`);
            comments = comments.slice(0, MAX_COMMENTS);
        }
        
        return {
            success: true,
            postTitle: metadata.postTitle,
            postContent: metadata.postContent,
            url: metadata.url,
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
        
        try {
            // Extraction du contenu et envoi de la réponse
            const content = getPageContent();
            sendResponse(content);
        } catch (error) {
            console.error('Erreur lors de l\'extraction du contenu:', error);
            sendResponse({ 
                error: `Erreur lors de l'extraction: ${error.message || 'Erreur inconnue'}`,
                errorDetails: error.toString()
            });
        }
    }
    
    // Retourner true pour indiquer que la réponse sera envoyée de manière asynchrone
    return true;
});
