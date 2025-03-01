// Configuration de l'extension
const config = {
    // Configuration de l'authentification
    auth: {
        google: {
            clientId: '274847669888-4lru8abj1ccgelcqunorqiiodktn7m2d.apps.googleusercontent.com',
            scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
        },
        chatGPT: {
            sessionCookieName: '__Secure-next-auth.session-token',
            apiUrl: 'https://chat.openai.com/api/conversation'
        }
    },
    
    // Configuration de l'interface
    ui: {
        popup: {
            width: 500,
            height: 600
        }
    }
};

export default config;
