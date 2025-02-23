import authService from './js/services/auth.service.js';
import summaryService from './js/services/summary.service.js';
import popupUI from './js/ui/popup.ui.js';

class PopupController {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Montrer le spinner de chargement pendant la vérification
            popupUI.showLoading(true);

            // Vérifier l'état de l'authentification
            const isAuthenticated = await authService.checkAuthStatus();
            
            // Cacher le spinner et montrer l'interface appropriée
            popupUI.showLoading(false);
            this.updateInterface(isAuthenticated);

            // Configurer les écouteurs d'événements
            this.setupEventListeners();
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            popupUI.showLoading(false);
            popupUI.showError('Erreur lors de l\'initialisation de l\'extension');
        }
    }

    updateInterface(isAuthenticated) {
        if (isAuthenticated) {
            popupUI.showSummaryInterface();
        } else {
            popupUI.showLoginInterface();
        }
    }

    setupEventListeners() {
        // Gérer le clic sur le bouton de connexion
        popupUI.addLoginButtonListener(async () => {
            try {
                popupUI.showLoading(true);
                await authService.startGoogleAuth();
                this.updateInterface(true);
            } catch (error) {
                console.error('Erreur de connexion:', error);
                popupUI.showError('Erreur lors de la connexion');
            } finally {
                popupUI.showLoading(false);
            }
        });

        // Gérer le clic sur le bouton de résumé
        popupUI.addSummarizeButtonListener(async () => {
            try {
                const content = await summaryService.getPageContent();
                const summary = await summaryService.generateSummary(content);
                popupUI.displaySummary(summary);
            } catch (error) {
                console.error('Erreur de résumé:', error);
                popupUI.showError('Erreur lors de la génération du résumé');
            }
        });
    }
}

// Initialiser le contrôleur quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
