/**
 * Module de fabrique de graphiques
 * Centralise la création des différents types de graphiques
 */
import { formatNumber } from '../utils/index.js';
import { ChartTypes, ChartLegends } from './index.js';
import { DataProcessor } from '../utils/index.js';

/**
 * Classe pour créer et gérer les graphiques
 */
export class ChartFactory {
    /**
     * Crée un graphique en donut pour les clusters d'opinions
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {HTMLElement} legendContainer - Conteneur de légende
     * @param {Array} opinionClusters - Données des clusters d'opinions
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createOpinionClusterChart(ctx, legendContainer, opinionClusters, config) {
        if (!ctx || !opinionClusters || !opinionClusters.length) {
            console.warn('Données ou contexte manquants pour le graphique des clusters d\'opinions');
            return null;
        }
        
        // Préparation des données
        const { labels, values, colors, originalLabels } = DataProcessor.prepareClusterData(
            opinionClusters, 
            config.colors
        );
        
        if (!labels.length) return null;
        
        // Création du graphique
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverOffset: 6
                }]
            },
            options: config.getDoughnutOptions((context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${formatNumber(value)} votes (${percentage}%)`;
            })
        });
        
        // Créer une légende HTML personnalisée si un conteneur est fourni
        if (legendContainer) {
            ChartLegends.createStandardLegend(legendContainer, labels, values, colors, originalLabels);
            
            // Ajouter les interactions pour la légende
            ChartLegends.addLegendInteractions(
                legendContainer, 
                chart, 
                ChartLegends.highlightPieDataset, 
                ChartLegends.resetPieHighlight, 
                ChartLegends.toggleDataVisibility
            );
        }
        
        return chart;
    }
    
    /**
     * Crée un graphique en camembert pour les scores
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {HTMLElement} legendContainer - Conteneur de légende
     * @param {Array} opinionClusters - Données des clusters d'opinions
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createScoresChart(ctx, legendContainer, opinionClusters, config) {
        if (!ctx || !opinionClusters || !opinionClusters.length) {
            console.warn('Données ou contexte manquants pour le graphique des scores');
            return null;
        }
        
        // Création du graphique en utilisant le module ChartTypes
        const chart = ChartTypes.createScoresChart(ctx, opinionClusters, config);
        
        if (!chart) return null;
        
        // Préparation des données pour la légende
        const { labels, values, colors } = DataProcessor.prepareScoresData(
            opinionClusters, 
            config.colors
        );
        
        // Créer une légende HTML personnalisée si un conteneur est fourni
        if (legendContainer) {
            ChartLegends.createStandardLegend(legendContainer, labels, values, colors);
            
            // Ajouter les interactions pour la légende
            ChartLegends.addLegendInteractions(
                legendContainer, 
                chart, 
                ChartLegends.highlightPieDataset, 
                ChartLegends.resetPieHighlight, 
                ChartLegends.toggleDataVisibility
            );
        }
        
        return chart;
    }
    
    /**
     * Crée un graphique en camembert pour les points de consensus
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {HTMLElement} legendContainer - Conteneur de légende
     * @param {Array} consensusPoints - Données des points de consensus
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createConsensusChart(ctx, legendContainer, consensusPoints, config) {
        if (!ctx || !consensusPoints || !consensusPoints.length) {
            console.warn('Données ou contexte manquants pour le graphique de consensus');
            return null;
        }
        
        // Création du graphique en utilisant le module ChartTypes
        const chart = ChartTypes.createConsensusChart(ctx, consensusPoints, config);
        
        if (!chart) return null;
        
        // Préparation des données pour la légende
        const { labels, values, colors } = DataProcessor.prepareConsensusData(
            consensusPoints, 
            config.colors
        );
        
        // Créer une légende HTML personnalisée si un conteneur est fourni
        if (legendContainer) {
            ChartLegends.createStandardLegend(legendContainer, labels, values, colors);
            
            // Ajouter les interactions pour la légende
            ChartLegends.addLegendInteractions(
                legendContainer, 
                chart, 
                ChartLegends.highlightPieDataset, 
                ChartLegends.resetPieHighlight, 
                ChartLegends.toggleDataVisibility
            );
        }
        
        return chart;
    }
    
    /**
     * Crée un graphique à barres horizontales opposées pour les points de friction
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {HTMLElement} legendContainer - Conteneur de légende
     * @param {Array} frictionPoints - Données des points de friction
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createControversyChart(ctx, legendContainer, frictionPoints, config) {
        if (!ctx || !frictionPoints || !frictionPoints.length) {
            console.warn('Données ou contexte manquants pour le graphique de controverse');
            return null;
        }
        
        // Création du graphique en utilisant le module ChartTypes
        const chart = ChartTypes.createControversyChart(ctx, frictionPoints, config);
        
        if (!chart) return null;
        
        // Préparation des données pour la légende
        const { 
            labels, 
            opinion1Values, 
            opinion2Values, 
            opinion1Stances, 
            opinion2Stances, 
            colors 
        } = DataProcessor.prepareControversyData(frictionPoints, config.colors);
        
        // Créer une légende HTML personnalisée si un conteneur est fourni
        if (legendContainer) {
            ChartLegends.createControversyLegend(
                legendContainer, 
                labels, 
                opinion1Values, 
                opinion2Values, 
                opinion1Stances, 
                opinion2Stances, 
                colors
            );
            
            // Ajouter les interactions pour la légende
            ChartLegends.addLegendInteractions(
                legendContainer, 
                chart, 
                ChartLegends.highlightControversyDataset, 
                ChartLegends.resetPieHighlight, 
                (chart, index, item) => {
                    // Pas d'implémentation de bascule pour le graphique de controverse
                }
            );
        }
        
        return chart;
    }
    
    /**
     * Crée un graphique en barres pour les groupes d'opinions
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {HTMLElement} legendContainer - Conteneur de légende
     * @param {Array} opinionClusters - Données des clusters d'opinions
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createOpinionGroupsChart(ctx, legendContainer, opinionClusters, config) {
        if (!ctx || !opinionClusters || !opinionClusters.length) {
            console.warn('Données ou contexte manquants pour le graphique des groupes d\'opinions');
            return null;
        }
        
        // Création du graphique en utilisant le module ChartTypes
        const chart = ChartTypes.createOpinionGroupsChart(ctx, opinionClusters, config);
        
        if (!chart) return null;
        
        // Préparation des données pour la légende
        const { labels, values, colors } = DataProcessor.prepareOpinionGroupsData(
            opinionClusters, 
            config.colors
        );
        
        // Créer une légende HTML personnalisée si un conteneur est fourni
        if (legendContainer) {
            ChartLegends.createStandardLegend(legendContainer, labels, values, colors);
            
            // Ajouter les interactions pour la légende
            ChartLegends.addLegendInteractions(
                legendContainer, 
                chart, 
                ChartLegends.highlightBarDataset, 
                ChartLegends.resetPieHighlight, 
                ChartLegends.toggleDataVisibility
            );
        }
        
        return chart;
    }
}
