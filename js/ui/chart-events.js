/**
 * Module de gestion des événements pour les graphiques
 * Centralise les gestionnaires d'événements liés aux graphiques
 */
import { Visualizations } from '../visualizations.js';

/**
 * Classe pour gérer les événements liés aux graphiques
 */
export class ChartEvents {
    /**
     * Initialise les gestionnaires d'événements pour les graphiques
     * @param {Visualizations} visualizationInstance - Instance de la classe Visualizations
     * @param {RedditAnalysis} data - Données d'analyse
     */
    static initChartEvents(visualizationInstance, data) {
        if (!visualizationInstance || !data) return;
        
        // Initialiser les onglets de graphiques
        this.initChartTabs(visualizationInstance, data);
        
        // Initialiser les boutons d'export
        this.initExportButtons(visualizationInstance);
        
        // Initialiser les événements de redimensionnement
        this.initResizeEvents(visualizationInstance, data);
    }
    
    /**
     * Initialise les onglets de graphiques
     * @param {Visualizations} visualizationInstance - Instance de la classe Visualizations
     * @param {RedditAnalysis} data - Données d'analyse
     */
    static initChartTabs(visualizationInstance, data) {
        const tabs = document.querySelectorAll('.chart-tab');
        const chartContainers = document.querySelectorAll('.chart-container');
        
        if (!tabs.length || !chartContainers.length) return;
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Désactiver tous les onglets
                tabs.forEach(t => t.classList.remove('active'));
                
                // Masquer tous les conteneurs
                chartContainers.forEach(container => container.style.display = 'none');
                
                // Activer l'onglet cliqué
                tab.classList.add('active');
                
                // Afficher le conteneur correspondant
                const targetId = tab.getAttribute('data-target');
                const targetContainer = document.getElementById(targetId);
                if (targetContainer) {
                    targetContainer.style.display = 'block';
                    
                    // Créer ou recréer le graphique si nécessaire
                    this.createChartForTab(visualizationInstance, data, targetId);
                }
            });
        });
        
        // Activer le premier onglet par défaut
        if (tabs.length > 0) {
            tabs[0].click();
        }
    }
    
    /**
     * Crée ou recrée un graphique en fonction de l'onglet actif
     * @param {Visualizations} visualizationInstance - Instance de la classe Visualizations
     * @param {RedditAnalysis} data - Données d'analyse
     * @param {string} targetId - ID du conteneur cible
     */
    static createChartForTab(visualizationInstance, data, targetId) {
        switch (targetId) {
            case 'opinionDistributionContainer':
                visualizationInstance.createOpinionClusterChart(data);
                break;
            case 'scoresContainer':
                visualizationInstance.createScoresChart(data);
                break;
            case 'consensusContainer':
                visualizationInstance.createConsensusChart(data);
                break;
            case 'controversyContainer':
                visualizationInstance.createControversyChart(data);
                break;
            case 'opinionClusterContainer':
                visualizationInstance.createOpinionGroupsChart(data);
                break;
        }
    }
    
    /**
     * Initialise les boutons d'export
     * @param {Visualizations} visualizationInstance - Instance de la classe Visualizations
     */
    static initExportButtons(visualizationInstance) {
        const exportButtons = document.querySelectorAll('.export-chart-btn');
        
        if (!exportButtons.length) return;
        
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                const chartId = button.getAttribute('data-chart');
                const chartCanvas = document.getElementById(chartId);
                
                if (chartCanvas) {
                    // Créer un lien de téléchargement
                    const link = document.createElement('a');
                    link.download = `${chartId}-export.png`;
                    link.href = chartCanvas.toDataURL('image/png');
                    link.click();
                }
            });
        });
    }
    
    /**
     * Initialise les événements de redimensionnement
     * @param {Visualizations} visualizationInstance - Instance de la classe Visualizations
     * @param {RedditAnalysis} data - Données d'analyse
     */
    static initResizeEvents(visualizationInstance, data) {
        // Utiliser un debounce pour éviter trop d'appels lors du redimensionnement
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Recréer tous les graphiques actifs
                const activeTab = document.querySelector('.chart-tab.active');
                if (activeTab) {
                    const targetId = activeTab.getAttribute('data-target');
                    this.createChartForTab(visualizationInstance, data, targetId);
                }
            }, 250);
        });
    }
}
