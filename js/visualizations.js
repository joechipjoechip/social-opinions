import { formatNumber, getRandomColor, truncateText } from './utils/helpers.js';
import { ChartConfig } from './ui/chart-config.js';
import * as ChartTypes from './ui/chart-types.js';
import * as ChartLegends from './ui/chart-legends.js';

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
        const ctx = document.getElementById('opinionDistributionChart')?.getContext('2d');
        const legendContainer = document.getElementById('opinionDistributionLegend');
        
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: opinionDistributionChart');
            return;
        }
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionCluster) {
            this.charts.opinionCluster.destroy();
        }
        
        // Préparation des données
        const opinionClusters = data?.opinionClusters || [];
        if (!opinionClusters.length) return;
        
        const { labels, values, colors, originalLabels } = this.prepareClusterData(opinionClusters);
        
        // Création du graphique
        this.charts.opinionCluster = new Chart(ctx, {
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
            options: this.config.getDoughnutOptions((context) => {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${formatNumber(value)} votes (${percentage}%)`;
            })
        });
        
        // Créer une légende HTML personnalisée
        ChartLegends.createStandardLegend(legendContainer, labels, values, colors, originalLabels);
        
        // Ajouter les interactions pour la légende
        ChartLegends.addLegendInteractions(
            legendContainer, 
            this.charts.opinionCluster, 
            ChartLegends.highlightPieDataset, 
            ChartLegends.resetPieHighlight, 
            ChartLegends.toggleDataVisibility
        );
    }
    
    /**
     * Prépare les données pour le graphique de clusters d'opinions
     * @param {Array} opinionClusters - Clusters d'opinions
     * @returns {Object} Données préparées
     */
    prepareClusterData(opinionClusters) {
        let labels = [];
        let values = [];
        let colors = [];
        let originalLabels = []; // Stocke les labels complets
        
        if (opinionClusters.length <= 6) {
            labels = opinionClusters.map(cluster => cluster.opinion);
            originalLabels = [...labels]; // Copie des labels complets
            values = opinionClusters.map(cluster => cluster.totalVotes);
            colors = Object.values(this.config.colors).slice(0, opinionClusters.length);
        } else {
            // Trier par votes et prendre les 5 premiers
            const sortedClusters = [...opinionClusters].sort((a, b) => b.totalVotes - a.totalVotes);
            const topClusters = sortedClusters.slice(0, 5);
            const otherClusters = sortedClusters.slice(5);
            
            // Ajouter les 5 premiers clusters
            labels = topClusters.map(cluster => cluster.opinion);
            originalLabels = [...labels]; // Copie des labels complets
            values = topClusters.map(cluster => cluster.totalVotes);
            colors = Object.values(this.config.colors).slice(0, 5);
            
            // Ajouter la catégorie "Autres"
            const otherVotes = otherClusters.reduce((sum, cluster) => sum + cluster.totalVotes, 0);
            labels.push('Autres opinions');
            originalLabels.push('Autres opinions');
            values.push(otherVotes);
            colors.push('#94A3B8'); // Gris slate NuxtUI
        }
        
        return { labels, values, colors, originalLabels };
    }
    
    /**
     * Crée un graphique en camembert pour les scores des différentes opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createScoresChart(data) {
        const ctx = document.getElementById('scoresChart')?.getContext('2d');
        const legendContainer = document.getElementById('scoresChartLegend');
        
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: scoresChart');
            return;
        }
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.scores) {
            this.charts.scores.destroy();
        }
        
        // Préparation des données
        const opinionClusters = data?.opinionClusters || [];
        if (!opinionClusters.length) return;
        
        // Création du graphique
        this.charts.scores = ChartTypes.createScoresChart(ctx, opinionClusters, this.config);
        
        if (!this.charts.scores) return;
        
        // Récupérer les données pour la légende
        const sortedClusters = [...opinionClusters]
            .sort((a, b) => b.totalVotes - a.totalVotes)
            .slice(0, 5);
        
        const labels = sortedClusters.map(cluster => cluster.opinion);
        const values = sortedClusters.map(cluster => cluster.totalVotes);
        const colors = Object.values(this.config.colors).slice(0, sortedClusters.length);
        
        // Créer une légende HTML personnalisée
        ChartLegends.createStandardLegend(legendContainer, labels, values, colors);
        
        // Ajouter les interactions pour la légende
        ChartLegends.addLegendInteractions(
            legendContainer, 
            this.charts.scores, 
            ChartLegends.highlightPieDataset, 
            ChartLegends.resetPieHighlight, 
            ChartLegends.toggleDataVisibility
        );
    }
    
    /**
     * Crée un graphique en camembert pour les points de consensus
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createConsensusChart(data) {
        const ctx = document.getElementById('consensusChart')?.getContext('2d');
        const legendContainer = document.getElementById('consensusChartLegend');
        
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: consensusChart');
            return;
        }
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.consensus) {
            this.charts.consensus.destroy();
        }
        
        // Préparation des données
        const consensusPoints = data?.consensusPoints || [];
        if (!consensusPoints.length) return;
        
        // Création du graphique
        this.charts.consensus = ChartTypes.createConsensusChart(ctx, consensusPoints, this.config);
        
        if (!this.charts.consensus) return;
        
        // Récupérer les données pour la légende
        const topConsensusPoints = [...consensusPoints]
            .sort((a, b) => b.agreementLevel - a.agreementLevel)
            .slice(0, 5);
        
        const labels = topConsensusPoints.map(point => point.topic);
        const values = topConsensusPoints.map(point => point.agreementLevel * 100);
        const colors = Object.values(this.config.colors).slice(0, 5);
        
        // Créer une légende HTML personnalisée
        ChartLegends.createStandardLegend(legendContainer, labels, values, colors);
        
        // Ajouter les interactions pour la légende
        ChartLegends.addLegendInteractions(
            legendContainer, 
            this.charts.consensus, 
            ChartLegends.highlightPieDataset, 
            ChartLegends.resetPieHighlight, 
            ChartLegends.toggleDataVisibility
        );
    }
    
    /**
     * Crée un graphique à barres horizontales opposées pour les points de friction
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createControversyChart(data) {
        const ctx = document.getElementById('controversyChart')?.getContext('2d');
        const legendContainer = document.getElementById('controversyChartLegend');
        
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: controversyChart');
            return;
        }
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.controversy) {
            this.charts.controversy.destroy();
        }
        
        // Préparation des données
        const frictionPoints = data?.frictionPoints || [];
        if (!frictionPoints.length) return;
        
        // Création du graphique
        this.charts.controversy = ChartTypes.createControversyChart(ctx, frictionPoints, this.config);
        
        if (!this.charts.controversy) return;
        
        // Récupérer les données pour la légende
        const topFrictionPoints = [...frictionPoints]
            .sort((a, b) => b.intensityScore - a.intensityScore)
            .slice(0, 5);
        
        const labels = topFrictionPoints.map(point => point.topic);
        const opinion1Values = topFrictionPoints.map(point => point.opinion1?.votes || 0);
        const opinion2Values = topFrictionPoints.map(point => point.opinion2?.votes || 0);
        const opinion1Stances = topFrictionPoints.map(point => point.opinion1?.stance || 'Opinion 1');
        const opinion2Stances = topFrictionPoints.map(point => point.opinion2?.stance || 'Opinion 2');
        
        // Créer une légende HTML personnalisée
        ChartLegends.createControversyLegend(
            legendContainer, 
            labels, 
            opinion1Values, 
            opinion2Values, 
            opinion1Stances, 
            opinion2Stances, 
            this.config.colors
        );
        
        // Ajouter les interactions pour la légende
        ChartLegends.addLegendInteractions(
            legendContainer, 
            this.charts.controversy, 
            ChartLegends.highlightControversyDataset, 
            ChartLegends.resetPieHighlight, 
            (chart, index, item) => {
                // Pas d'implémentation de bascule pour le graphique de controverse
            }
        );
    }
    
    /**
     * Crée un graphique en barres pour les groupes d'opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createOpinionGroupsChart(data) {
        const ctx = document.getElementById('opinionClusterChart')?.getContext('2d');
        const legendContainer = document.getElementById('opinionClusterLegend');
        
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: opinionClusterChart');
            return;
        }
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionGroups) {
            this.charts.opinionGroups.destroy();
        }
        
        // Préparation des données
        const opinionClusters = data?.opinionClusters || [];
        if (!opinionClusters.length) return;
        
        // Création du graphique
        this.charts.opinionGroups = ChartTypes.createOpinionGroupsChart(ctx, opinionClusters, this.config);
        
        if (!this.charts.opinionGroups) return;
        
        // Récupérer les données pour la légende
        const sortedClusters = [...opinionClusters]
            .sort((a, b) => b.totalVotes - a.totalVotes)
            .slice(0, 8);
        
        const labels = sortedClusters.map(cluster => cluster.opinion);
        const values = sortedClusters.map(cluster => cluster.totalVotes);
        const colors = [
            this.config.colors.primary,
            this.config.colors.secondary,
            this.config.colors.tertiary,
            this.config.colors.quaternary,
            this.config.colors.quinary,
            this.config.colors.senary,
            '#14B8A6',
            '#6366F1'
        ].slice(0, sortedClusters.length);
        
        // Créer une légende HTML personnalisée
        ChartLegends.createStandardLegend(legendContainer, labels, values, colors);
        
        // Ajouter les interactions pour la légende
        ChartLegends.addLegendInteractions(
            legendContainer, 
            this.charts.opinionGroups, 
            ChartLegends.highlightBarDataset, 
            ChartLegends.resetPieHighlight, 
            ChartLegends.toggleDataVisibility
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
