// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Handle Google OAuth
chrome.identity.getAuthToken({ 
    interactive: true,
    scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]
}, function(token) {
    if (chrome.runtime.lastError) {
        console.error('Erreur d\'authentification:', chrome.runtime.lastError.message);
        console.error('Détails complets:', JSON.stringify(chrome.runtime.lastError));
        return;
    }
    // Store the token
    chrome.storage.local.set({ googleToken: token }, function() {
        console.log('Token stored:', token);
    });
});

// Handle authentication state and login
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkAuth') {
        chrome.storage.local.get(['googleToken', 'chatGPTSession'], function(result) {
            sendResponse({
                isAuthenticated: !!(result.googleToken && result.chatGPTSession)
            });
        });
        return true; // Will respond asynchronously
    }
    
    if (request.action === 'login') {
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError) {
                console.error('Erreur d\'authentification:', chrome.runtime.lastError);
                sendResponse({ error: chrome.runtime.lastError.message });
                return;
            }
            
            // Store the token
            chrome.storage.local.set({ googleToken: token }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Erreur de stockage:', chrome.runtime.lastError);
                    sendResponse({ error: chrome.runtime.lastError.message });
                    return;
                }
                console.log('Token obtenu et stocké avec succès');
                sendResponse({ success: true, token: token });
            });
        });
        return true; // Will respond asynchronously
    }

    if (request.action === 'summarize') {
        chrome.storage.local.get(['chatGPTSession'], async function(result) {
            if (!result.chatGPTSession) {
                sendResponse({ error: 'Not authenticated with ChatGPT' });
                return;
            }

            try {
                // Implement actual ChatGPT API call here
                const response = await fetch('https://chat.openai.com/api/conversation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${result.chatGPTSession}`
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: 'user',
                            content: `Please summarize the following text: ${request.content}`
                        }]
                    })
                });

                const data = await response.json();
                sendResponse({ summary: data.choices[0].message.content });
            } catch (error) {
                console.error('Erreur ChatGPT:', error);
                sendResponse({ error: error.message });
            }
        });
        return true; // Will respond asynchronously
    }
});
