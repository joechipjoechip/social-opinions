// Configuration de l'extension
const config = {
    // Configuration de l'authentification
    auth: {
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
