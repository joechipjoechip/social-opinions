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

/**
 * Extrait le contenu de la page Reddit
 * @returns {Object} Contenu de la page
 */
function getPageContent() {
    try {
        console.log('Début de l\'extraction du contenu Reddit');
        let comments = [];
        
        // Extraction des commentaires avec différentes approches
        console.log('Extraction des commentaires...');
        
        // Approche 1: Rechercher les éléments shreddit-comment
        comments = extractShredditComments();
        
        // Si aucun commentaire n'a été trouvé, essayer d'autres approches
        if (comments.length === 0) {
            // Approche 2: Rechercher les éléments avec slot="comment-content"
            console.log('Tentative d\'extraction via slot="comment-content"');
            comments = extractCommentSlots();
            
            if (comments.length === 0) {
                // Approche 3: Rechercher les éléments avec la classe .Comment
                console.log('Tentative d\'extraction via .Comment');
                comments = extractOldComments();
                
                if (comments.length === 0) {
                    // Approche 4: Recherche générique de texte
                    console.log('Tentative d\'extraction générique de texte');
                    comments = extractGenericText();
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
        const metadata = extractPostMetadata();
        
        console.log(`Extraction terminée: ${comments.length} commentaires, titre: "${truncateText(metadata.postTitle, 30)}"`);
        
        return {
            ...metadata,
            comments: comments,
            commentCount: comments.length
        };
    } catch (error) {
        console.error('Erreur lors de l\'extraction du contenu:', error);
        // Retourner un objet avec une erreur mais toujours utilisable
        return createErrorResponse(error);
    }
}

// Écouteur de messages pour communiquer avec le popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getContent') {
        console.log('Réception de la demande d\'extraction de contenu');
        
        try {
            const content = getPageContent();
            console.log('Envoi du contenu extrait au popup');
            sendResponse({ content: content });
        } catch (error) {
            console.error('Erreur lors de l\'extraction:', error);
            sendResponse({ 
                error: error.message,
                content: createErrorResponse(error)
            });
        }
        
        return true; // Important pour indiquer que la réponse sera envoyée de manière asynchrone
    }
});

// Journalisation pour débogage
console.log('Reddit Opinions: Script d\'extraction chargé');
