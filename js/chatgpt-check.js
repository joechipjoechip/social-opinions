// Ce script s'exécute directement dans la page ChatGPT
console.log('ChatGPT check script loaded');

function isElementVisible(element) {
    return element.offsetParent !== null &&
           !element.hidden &&
           getComputedStyle(element).visibility !== 'hidden' &&
           getComputedStyle(element).display !== 'none';
}

function checkChatGPTLogin() {
    try {
        // On cherche les boutons de login/signup qui sont visibles
        const loginButtons = Array.from(document.querySelectorAll('button')).filter(button => {
            const buttonText = button.textContent.toLowerCase();
            return isElementVisible(button) && (
                buttonText.includes('log in') ||
                buttonText.includes('sign up') ||
                buttonText.includes('login') ||
                buttonText.includes('signup')
            );
        });

        // On cherche aussi le menu utilisateur qui n'apparaît que quand on est connecté
        const userMenu = document.querySelector('[class*="user-menu"]') || 
                        document.querySelector('[class*="UserMenu"]') ||
                        document.querySelector('button[aria-label*="User"]');

        console.log('Found elements:', {
            loginButtons: loginButtons.length,
            userMenu: userMenu !== null
        });

        // Si on a des boutons de login visibles, on n'est pas connecté
        // Si on a le menu utilisateur, on est connecté
        const isLoggedIn = loginButtons.length === 0 && userMenu !== null;

        // Envoyer le statut à l'extension
        chrome.runtime.sendMessage({
            action: 'chatgpt-status',
            status: isLoggedIn ? 'connected' : 'disconnected'
        });
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

// Vérifier après le chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkChatGPTLogin, 1000);
    });
} else {
    setTimeout(checkChatGPTLogin, 1000);
}

// Observer les changements dans le DOM
const observer = new MutationObserver((mutations) => {
    // On vérifie si les mutations concernent des éléments pertinents
    const relevantChanges = mutations.some(mutation => {
        return mutation.target.matches('button') || 
               mutation.target.matches('[class*="user-menu"]') ||
               mutation.target.matches('[class*="UserMenu"]');
    });

    if (relevantChanges) {
        checkChatGPTLogin();
    }
});

// Observer les changements dans le body
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden']
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });
    });
}
