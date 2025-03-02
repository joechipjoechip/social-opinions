import { formatNumber } from './utils/index.js';
import { ChartConfig, ChartFactory, ChartDOMManager } from './ui/index.js';

/**
 * Classe pour gérer les visualisations des données Reddit
 */
export class Visualizations {
    constructor() {
        // Initialisation des graphiques
        this.charts = {
            opinionCluster: null,
            scores: null,
            consensus: null,
            controversy: null,
            opinionGroups: null
        };
        
        // Initialiser la configuration des graphiques
        this.config = new ChartConfig();
        
        // Appliquer la configuration globale
        this.config.applyGlobalConfig();
    }
    
    /**
     * Crée un graphique en donut pour les clusters d'opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createOpinionClusterChart(data) {
        // Récupérer les éléments DOM
        const { ctx, legendContainer } = ChartDOMManager.getChartElements(
            'opinionDistributionChart', 
            'opinionDistributionLegend'
        );
        
        if (!ctx) return;
        
        // Vider le conteneur de légende
        ChartDOMManager.clearLegendContainer(legendContainer);
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionCluster) {
            this.charts.opinionCluster.destroy();
        }
        
        // Vérifier les données
        const opinionClusters = data?.opinionClusters || [];
        if (!ChartDOMManager.isValidData(opinionClusters)) return;
        
        // Création du graphique avec la fabrique
        this.charts.opinionCluster = ChartFactory.createOpinionClusterChart(
            ctx,
            legendContainer,
            opinionClusters,
            this.config
        );
    }
    
    /**
     * Crée un graphique en camembert pour les scores des différentes opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createScoresChart(data) {
        // Récupérer les éléments DOM
        const { ctx, legendContainer } = ChartDOMManager.getChartElements(
            'scoresChart', 
            'scoresChartLegend'
        );
        
        if (!ctx) return;
        
        // Vider le conteneur de légende
        ChartDOMManager.clearLegendContainer(legendContainer);
        
        // Destruction du graphique existant s'il existe
        if (this.charts.scores) {
            this.charts.scores.destroy();
        }
        
        // Vérifier les données
        const opinionClusters = data?.opinionClusters || [];
        if (!ChartDOMManager.isValidData(opinionClusters)) return;
        
        // Création du graphique avec la fabrique
        this.charts.scores = ChartFactory.createScoresChart(
            ctx,
            legendContainer,
            opinionClusters,
            this.config
        );
    }
    
    /**
     * Crée un graphique en camembert pour les points de consensus
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createConsensusChart(data) {
        // Récupérer les éléments DOM
        const { ctx, legendContainer } = ChartDOMManager.getChartElements(
            'consensusChart', 
            'consensusChartLegend'
        );
        
        if (!ctx) return;
        
        // Vider le conteneur de légende
        ChartDOMManager.clearLegendContainer(legendContainer);
        
        // Destruction du graphique existant s'il existe
        if (this.charts.consensus) {
            this.charts.consensus.destroy();
        }
        
        // Vérifier les données
        const consensusPoints = data?.consensusPoints || [];
        if (!ChartDOMManager.isValidData(consensusPoints)) return;
        
        // Création du graphique avec la fabrique
        this.charts.consensus = ChartFactory.createConsensusChart(
            ctx,
            legendContainer,
            consensusPoints,
            this.config
        );
    }
    
    /**
     * Crée un graphique à barres horizontales opposées pour les points de friction
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createControversyChart(data) {
        // Récupérer les éléments DOM
        const { ctx, legendContainer } = ChartDOMManager.getChartElements(
            'controversyChart', 
            'controversyChartLegend'
        );
        
        if (!ctx) return;
        
        // Vider le conteneur de légende
        ChartDOMManager.clearLegendContainer(legendContainer);
        
        // Destruction du graphique existant s'il existe
        if (this.charts.controversy) {
            this.charts.controversy.destroy();
        }
        
        // Vérifier les données
        const frictionPoints = data?.frictionPoints || [];
        if (!ChartDOMManager.isValidData(frictionPoints)) return;
        
        // Création du graphique avec la fabrique
        this.charts.controversy = ChartFactory.createControversyChart(
            ctx,
            legendContainer,
            frictionPoints,
            this.config
        );
    }
    
    /**
     * Crée un graphique en barres pour les groupes d'opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createOpinionGroupsChart(data) {
        // Récupérer les éléments DOM
        const { ctx, legendContainer } = ChartDOMManager.getChartElements(
            'opinionClusterChart', 
            'opinionClusterLegend'
        );
        
        if (!ctx) return;
        
        // Vider le conteneur de légende
        ChartDOMManager.clearLegendContainer(legendContainer);
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionGroups) {
            this.charts.opinionGroups.destroy();
        }
        
        // Vérifier les données
        const opinionClusters = data?.opinionClusters || [];
        if (!ChartDOMManager.isValidData(opinionClusters)) return;
        
        // Création du graphique avec la fabrique
        this.charts.opinionGroups = ChartFactory.createOpinionGroupsChart(
            ctx,
            legendContainer,
            opinionClusters,
            this.config
        );
    }
    
    /**
     * Détruit tous les graphiques
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Réinitialiser les références
        this.charts = {
            opinionCluster: null,
            scores: null,
            consensus: null,
            controversy: null,
            opinionGroups: null
        };
    }
}
