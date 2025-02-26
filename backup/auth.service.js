import config from '../config.js';

class AuthService {
    constructor() {
        this.isAuthenticated = false;
        this.checkAuthStatus();
    }

    async checkAuthStatus() {
        try {
            // Vérifier si l'utilisateur est déjà connecté à ChatGPT
            const cookies = await chrome.cookies.getAll({
                domain: '.openai.com'
            });

            // On cherche les cookies d'authentification
            const sessionCookie = cookies.find(cookie => 
                cookie.name === '__Secure-next-auth.session-token'
            );

            // Vérifier le token Google
            const result = await chrome.storage.local.get(['googleToken', 'chatGPTSession']);
            
            if (sessionCookie && result.googleToken) {
                console.log('Sessions trouvées !');
                await chrome.storage.local.set({ 
                    chatGPTSession: sessionCookie.value
                });
                this.isAuthenticated = true;
                return true;
            }

            console.log('Une ou plusieurs sessions manquantes');
            this.isAuthenticated = false;
            return false;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            return false;
        }
    }

    async startGoogleAuth() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (chrome.runtime.lastError) {
                    console.error('Erreur d\'authentification Google:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }

                try {
                    // Stocker le token
                    await chrome.storage.local.set({ googleToken: token });
                    this.isAuthenticated = true;
                    resolve(token);
                } catch (error) {
                    console.error('Erreur lors du stockage du token:', error);
                    reject(error);
                }
            });
        });
    }

    async logout() {
        try {
            await chrome.storage.local.remove(['googleToken', 'chatGPTSession']);
            this.isAuthenticated = false;
            return true;
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            return false;
        }
    }
}

export default new AuthService();
