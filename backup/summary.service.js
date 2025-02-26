import config from '../config.js';

class SummaryService {
    constructor() {
        this.currentTab = null;
    }

    async getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tab;
        return tab;
    }

    async getPageContent() {
        if (!this.currentTab) {
            await this.getCurrentTab();
        }

        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(
                this.currentTab.id,
                { action: 'getContent' },
                response => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else if (response && response.content) {
                        resolve(response.content);
                    } else {
                        reject(new Error('Contenu non disponible'));
                    }
                }
            );
        });
    }

    async generateSummary(content) {
        try {
            const cookies = await chrome.cookies.getAll({
                domain: '.openai.com'
            });

            const sessionCookie = cookies.find(cookie => 
                cookie.name === '__Secure-next-auth.session-token'
            );

            if (!sessionCookie) {
                throw new Error('Session ChatGPT non trouvée');
            }

            const response = await fetch('https://chat.openai.com/api/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionCookie.value}`
                },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        content: `Peux-tu me faire un résumé concis de ce texte : ${content}`
                    }],
                    model: 'gpt-3.5-turbo'
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Erreur lors de la génération du résumé:', error);
            throw error;
        }
    }
}

export default new SummaryService();
