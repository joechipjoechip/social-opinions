async function checkChatGPTStatus() {
    const statusDiv = document.getElementById('status');
    
    try {
        // Faire une requête à l'API ChatGPT pour vérifier la connexion
        const response = await fetch('https://chat.openai.com/api/auth/session');
        const data = await response.json();
        
        if (data && data.accessToken) {
            statusDiv.textContent = 'Connecté à ChatGPT !';
            statusDiv.className = 'status success';
            // Informer l'extension que nous sommes connectés
            chrome.runtime.sendMessage({
                action: 'chatgpt-status',
                status: 'connected',
                token: data.accessToken
            });
        } else {
            statusDiv.textContent = 'Non connecté à ChatGPT';
            statusDiv.className = 'status error';
            chrome.runtime.sendMessage({
                action: 'chatgpt-status',
                status: 'disconnected'
            });
        }
    } catch (error) {
        statusDiv.textContent = 'Erreur lors de la vérification : ' + error.message;
        statusDiv.className = 'status error';
        chrome.runtime.sendMessage({
            action: 'chatgpt-status',
            status: 'error',
            error: error.message
        });
    }
}

// Vérifier le statut immédiatement
checkChatGPTStatus();

// Vérifier toutes les 5 secondes
setInterval(checkChatGPTStatus, 5000);
