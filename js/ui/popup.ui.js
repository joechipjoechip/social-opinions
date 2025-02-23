class PopupUI {
    constructor() {
        this.elements = {
            loginContainer: document.getElementById('login-container'),
            summaryContainer: document.getElementById('summary-container'),
            loadingContainer: document.getElementById('loading-container'),
            loginButton: document.getElementById('google-login-btn'),
            summarizeButton: document.getElementById('summarize-btn'),
            summaryContent: document.getElementById('summary'),
            errorMessage: document.getElementById('error-message')
        };
    }

    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
        } else {
            console.error(message);
        }
    }

    showLoading(show = true) {
        this.elements.loadingContainer.style.display = show ? 'block' : 'none';
        this.elements.loginContainer.style.display = 'none';
        this.elements.summaryContainer.style.display = 'none';
        
        if (!show) {
            this.elements.summarizeButton.disabled = false;
        }
    }

    showLoginInterface() {
        this.elements.loadingContainer.style.display = 'none';
        this.elements.loginContainer.style.display = 'block';
        this.elements.summaryContainer.style.display = 'none';
    }

    showSummaryInterface() {
        this.elements.loadingContainer.style.display = 'none';
        this.elements.loginContainer.style.display = 'none';
        this.elements.summaryContainer.style.display = 'block';
    }

    displaySummary(summary) {
        this.elements.summaryContent.textContent = summary;
    }

    addLoginButtonListener(callback) {
        this.elements.loginButton.addEventListener('click', callback);
    }

    addSummarizeButtonListener(callback) {
        this.elements.summarizeButton.addEventListener('click', () => {
            this.elements.summarizeButton.disabled = true;
            this.elements.summarizeButton.textContent = 'Génération en cours...';
            callback().finally(() => {
                this.elements.summarizeButton.disabled = false;
                this.elements.summarizeButton.textContent = 'Résume-moi ça !';
            });
        });
    }
}

export default new PopupUI();
