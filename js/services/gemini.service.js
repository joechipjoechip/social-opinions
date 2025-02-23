class GeminiService {
    constructor() {
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.MAX_COMMENTS = 15; // Paramètre configurable pour la limite de commentaires
    }

    setMaxComments(limit) {
        this.MAX_COMMENTS = limit;
    }

    async getAccessToken() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                resolve(token);
            });
        });
    }

    async generateSummary(pageContent) {
        try {
            const token = await this.getAccessToken();
            
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    "contents": [{
                        "parts": [{
                            "text": `Analyse les commentaires suivants d'un post Reddit et génère un résumé structuré des différentes opinions et points de vue exprimés. Mets en valeur les commentaires les plus pertinents (basé sur leur score) et organise les informations de manière claire.

Post: ${pageContent.postTitle}

Commentaires (triés par score, limités aux 15 plus pertinents):
${pageContent.comments.map(c => `[Score: ${c.score}] ${c.text}`).join('\n')}

Format souhaité pour le résumé:
1. Points clés et opinions principales
2. Arguments pour et contre
3. Expériences partagées
4. Consensus général (si applicable)
`
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "topK": 40,
                        "topP": 0.95,
                        "maxOutputTokens": 1024,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API Gemini:', errorData);
                throw new Error(`Erreur API: ${errorData.error?.message || 'Erreur inconnue'}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Erreur lors de la génération du résumé:', error);
            throw error;
        }
    }

    async getPageContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('reddit.com')) {
                throw new Error('Cette extension fonctionne uniquement sur Reddit');
            }

            // Fonction qui sera exécutée dans le contexte de la page
            const extractComments = () => {
                const cleanText = (text) => {
                    if (!text) return '';
                    return text.trim()
                        .replace(/\s+/g, ' ')
                        .replace(/[^\x20-\x7E]/g, '');
                };

                // Récupérer le titre du post
                const postTitle = document.querySelector('h1')?.textContent || '';
                if (!postTitle) {
                    throw new Error('Impossible de trouver le titre du post');
                }

                // Récupérer tous les commentaires
                const comments = [];
                const commentTrees = document.querySelectorAll('shreddit-comment-tree');

                commentTrees.forEach(commentTree => {
                    const commentElements = commentTree.querySelectorAll('shreddit-comment');
                    commentElements.forEach(comment => {
                        // Ignorer les commentaires supprimés ou modérés
                        const commentText = comment.querySelector('.md')?.textContent;
                        if (!commentText || 
                            commentText.includes('[deleted]') || 
                            commentText.includes('[removed]')) {
                            return;
                        }

                        // Récupérer le score
                        const scoreElement = comment.querySelector('span faceplate-number');
                        const score = scoreElement ? parseInt(scoreElement.getAttribute('number')) || 0 : 0;

                        comments.push({
                            text: cleanText(commentText),
                            score: score
                        });
                    });
                });

                if (comments.length === 0) {
                    throw new Error('Aucun commentaire trouvé');
                }

                // Trier les commentaires par score (du plus haut au plus bas)
                comments.sort((a, b) => b.score - a.score);

                // Limiter aux 15 commentaires les plus pertinents
                const topComments = comments.slice(0, 15);

                return {
                    postTitle: cleanText(postTitle),
                    comments: topComments,
                    totalComments: comments.length
                };
            };

            // Exécuter le script d'extraction
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: extractComments
            });

            const content = result[0].result;
            
            if (!content.comments.length) {
                throw new Error('Aucun commentaire trouvé sur cette page. Assurez-vous d\'être sur une page de post Reddit avec des commentaires.');
            }

            return content;
        } catch (error) {
            console.error('Erreur lors de la récupération des commentaires:', error);
            throw new Error('Impossible de lire les commentaires. Assurez-vous d\'être sur une page de post Reddit.');
        }
    }
}

export default new GeminiService();
