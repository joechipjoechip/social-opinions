class GeminiService {
    constructor() {
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.MAX_COMMENTS = 15;
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

    parseGeminiResponse(text) {
        try {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}') + 1;
            if (start === -1 || end === 0) {
                throw new Error('Aucun JSON trouvé dans la réponse');
            }

            const jsonStr = text.substring(start, end);
            const data = JSON.parse(jsonStr);

            return {
                overview: {
                    totalComments: Number(data.overview?.totalComments) || 0,
                    mainOpinion: String(data.overview?.mainOpinion || ''),
                    consensusLevel: Number(data.overview?.consensusLevel) || 0
                },
                opinionClusters: (data.opinionClusters || []).map(cluster => ({
                    opinion: String(cluster.opinion || ''),
                    totalVotes: Number(cluster.totalVotes) || 0,
                    commentCount: Number(cluster.commentCount) || 0,
                    avgScore: Number(cluster.avgScore) || 0,
                    representativeComment: String(cluster.representativeComment || ''),
                    relatedOpinions: Array.isArray(cluster.relatedOpinions) ? 
                        cluster.relatedOpinions.map(String) : []
                })),
                consensusPoints: (data.consensusPoints || []).map(point => ({
                    topic: String(point.topic || ''),
                    agreementLevel: Number(point.agreementLevel) || 0,
                    totalVotes: Number(point.totalVotes) || 0,
                    keyEvidence: Array.isArray(point.keyEvidence) ? 
                        point.keyEvidence.map(String) : []
                })),
                frictionPoints: (data.frictionPoints || []).map(point => ({
                    topic: String(point.topic || ''),
                    opinion1: {
                        stance: String(point.opinion1?.stance || ''),
                        votes: Number(point.opinion1?.votes) || 0,
                        keyArguments: Array.isArray(point.opinion1?.keyArguments) ? 
                            point.opinion1.keyArguments.map(String) : []
                    },
                    opinion2: {
                        stance: String(point.opinion2?.stance || ''),
                        votes: Number(point.opinion2?.votes) || 0,
                        keyArguments: Array.isArray(point.opinion2?.keyArguments) ? 
                            point.opinion2.keyArguments.map(String) : []
                    },
                    intensityScore: Number(point.intensityScore) || 0
                })),
                voteDistribution: (data.voteDistribution || []).map(dist => ({
                    opinionGroup: String(dist.opinionGroup || ''),
                    totalVotes: Number(dist.totalVotes) || 0,
                    percentageOfTotal: Number(dist.percentageOfTotal) || 0,
                    topComments: Array.isArray(dist.topComments) ? 
                        dist.topComments.map(String) : []
                }))
            };
        } catch (error) {
            console.error('Erreur lors du parsing de la réponse:', error);
            throw new Error('Le format de la réponse est invalide');
        }
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
                            "text": `Analyse les commentaires Reddit suivants en te concentrant sur l'identification des opinions principales, leur popularité basée sur les votes, et les points de consensus/friction. 
IMPORTANT: Ta réponse doit être un objet JSON valide, sans aucun texte avant ou après. Utilise uniquement des guillemets doubles pour les chaînes.

Titre: ${pageContent.postTitle}

Commentaires (triés par score):
${pageContent.comments.map(c => `[Score: ${c.score}] ${c.text}`).join('\n')}

Format de réponse attendu:
{
    "overview": {
        "totalComments": 123,
        "mainOpinion": "L'opinion la plus soutenue",
        "consensusLevel": 0.75
    },
    "opinionClusters": [
        {
            "opinion": "Résumé de l'opinion",
            "totalVotes": 100,
            "commentCount": 5,
            "avgScore": 20,
            "representativeComment": "Le commentaire le plus représentatif",
            "relatedOpinions": ["opinion similaire 1", "opinion similaire 2"]
        }
    ],
    "consensusPoints": [
        {
            "topic": "Sujet de consensus",
            "agreementLevel": 0.9,
            "totalVotes": 150,
            "keyEvidence": ["citation 1", "citation 2"]
        }
    ],
    "frictionPoints": [
        {
            "topic": "Sujet de désaccord",
            "opinion1": {
                "stance": "Première position",
                "votes": 75,
                "keyArguments": ["argument 1", "argument 2"]
            },
            "opinion2": {
                "stance": "Position opposée",
                "votes": 50,
                "keyArguments": ["argument 1", "argument 2"]
            },
            "intensityScore": 0.8
        }
    ],
    "voteDistribution": [
        {
            "opinionGroup": "Groupe d'opinions",
            "totalVotes": 200,
            "percentageOfTotal": 35,
            "topComments": ["commentaire 1", "commentaire 2"]
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
            const result = data.candidates[0].content.parts[0].text;
            
            return this.parseGeminiResponse(result);
        } catch (error) {
            console.error('Erreur lors de la génération du résumé:', error);
            throw error;
        }
    }

    async getPageContent() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
                try {
                    const tab = tabs[0];
                    const results = await chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        func: () => {
                            const comments = [];
                            document.querySelectorAll('.Comment').forEach(comment => {
                                const scoreElem = comment.querySelector('[id^="vote-arrows-t1"] + div');
                                const textElem = comment.querySelector('.RichTextJSON-root');
                                if (scoreElem && textElem) {
                                    const score = parseInt(scoreElem.textContent) || 0;
                                    comments.push({
                                        text: textElem.textContent.trim(),
                                        score: score
                                    });
                                }
                            });
                            
                            comments.sort((a, b) => b.score - a.score);
                            
                            return {
                                postTitle: document.querySelector('h1')?.textContent || '',
                                comments: comments
                            };
                        }
                    });

                    if (results && results[0]?.result) {
                        const content = results[0].result;
                        content.comments = content.comments.slice(0, this.MAX_COMMENTS);
                        resolve(content);
                    } else {
                        reject(new Error('Impossible de récupérer le contenu de la page'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}

export default new GeminiService();
