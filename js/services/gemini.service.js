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
                            "text": `Analyse les commentaires Reddit suivants et génère une réponse au format JSON strict avec les données d'analyse.

Titre: ${pageContent.postTitle}

Commentaires (triés par score, top ${pageContent.comments.length}):
${pageContent.comments.map(c => `[Score: ${c.score}] ${c.text}`).join('\n')}

Réponds UNIQUEMENT avec un objet JSON valide contenant les champs suivants (tous les champs numériques doivent être des nombres, pas des chaînes) :

{
    "overview": {
        "totalComments": [nombre total],
        "mainTopic": [sujet principal],
        "generalSentiment": [sentiment général: "positive", "negative", ou "neutral"]
    },
    "sentimentAnalysis": {
        "positive": [pourcentage positif],
        "negative": [pourcentage négatif],
        "neutral": [pourcentage neutre]
    },
    "topComments": [
        {
            "text": [texte du commentaire],
            "score": [score],
            "sentiment": [sentiment]
        }
    ],
    "topics": [
        {
            "name": [nom du sujet],
            "count": [nombre d'occurrences],
            "avgScore": [score moyen],
            "sentiment": [sentiment dominant]
        }
    ],
    "scoreDistribution": [
        {
            "range": [plage de score, ex: "0-10"],
            "count": [nombre de commentaires]
        }
    ],
    "controversialPoints": [
        {
            "topic": [sujet controversé],
            "perspective1": [première perspective],
            "perspective2": [deuxième perspective],
            "intensity": [niveau de controverse de 1 à 10]
        }
    ]
}`
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.7,
                        "topK": 40,
                        "topP": 0.95,
                        "maxOutputTokens": 2048,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API Gemini:', errorData);
                throw new Error(`Erreur API: ${errorData.error?.message || 'Erreur inconnue'}`);
            }

            const data = await response.json();
            const analysisText = data.candidates[0].content.parts[0].text;
            
            // Extraire et valider le JSON
            try {
                const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('Format de réponse invalide');
                }
                const parsedData = JSON.parse(jsonMatch[0]);
                
                // Validation basique des champs requis
                if (!parsedData.overview || !parsedData.sentimentAnalysis || !parsedData.topics) {
                    throw new Error('Données JSON incomplètes');
                }
                
                return parsedData;
            } catch (parseError) {
                console.error('Erreur de parsing JSON:', parseError);
                throw new Error('Impossible de parser la réponse en JSON');
            }
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
