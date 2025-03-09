/**
 * Module de fabrique de graphiques
 * Centralise la création des différents types de graphiques
 */
import { formatNumber, truncateText } from '../utils/index.js';
import { ChartTypes, ChartLegends, ChartDOMManager } from './index.js';
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
    
    /**
     * Crée un graphique en bulles pour visualiser les opinions
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {Array} data - Données pour le graphique
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createBubbleChart(ctx, data, config) {
        if (!ctx || !data || !data.length) {
            console.warn('Données ou contexte manquants pour le graphique en bulles');
            return null;
        }
        
        // Création du graphique en utilisant le module ChartTypes
        return ChartTypes.createBubbleChart(ctx, data, config);
    }
    
    /**
     * Crée un graphique en camembert multi-séries pour visualiser les opinions
     * @param {HTMLElement} ctx - Contexte du canvas
     * @param {HTMLElement} legendContainer - Conteneur de légende
     * @param {Object} data - Données hiérarchiques pour le graphique
     * @param {Object} config - Configuration du graphique
     * @returns {Chart} Instance du graphique
     */
    static createMultiSeriesPieChart(ctx, legendContainer, data, config) {
        if (!ctx || !data) {
            console.warn('Données ou contexte manquants pour le graphique en camembert multi-séries');
            return null;
        }
        
        // Création du graphique en utilisant le module ChartTypes
        const chart = ChartTypes.createMultiSeriesPieChart(ctx, data, config);
        
        if (!chart) return null;
        
        // Créer une légende HTML personnalisée si un conteneur est fourni
        if (legendContainer) {
            // Vider le conteneur de légende
            if (legendContainer.innerHTML) {
                legendContainer.innerHTML = '';
            }
            
            // Créer un titre pour la légende
            const legendTitle = document.createElement('h4');
            legendTitle.textContent = 'Répartition des opinions par sentiment';
            legendTitle.className = 'legend-title';
            legendContainer.appendChild(legendTitle);
            
            // Créer les sections de légende pour chaque niveau
            this._createLegendSection(
                legendContainer, 
                'Sentiment global', 
                data.global, 
                this._formatTitles(data.global)
            );
            
            this._createLegendSection(
                legendContainer, 
                'Groupes principaux', 
                {
                    positive: data.mainGroups.groupA.positive + data.mainGroups.groupB.positive,
                    neutral: data.mainGroups.groupA.neutral + data.mainGroups.groupB.neutral,
                    negative: data.mainGroups.groupA.negative + data.mainGroups.groupB.negative
                },
                {
                    positive: [data.mainGroups.groupA.title, data.mainGroups.groupB.title],
                    neutral: [data.mainGroups.groupA.title, data.mainGroups.groupB.title],
                    negative: [data.mainGroups.groupA.title, data.mainGroups.groupB.title]
                }
            );
            
            this._createLegendSection(
                legendContainer, 
                data.subGroups.title, 
                data.subGroups,
                this._formatTitles(data.subGroups)
            );
            
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
     * Crée une section de légende pour un niveau du graphique multi-séries
     * @param {HTMLElement} container - Conteneur de légende
     * @param {string} title - Titre de la section
     * @param {Object} data - Données de sentiment pour la section
     * @param {Object} titles - Titres des opinions pour chaque sentiment
     * @private
     */
    static _createLegendSection(container, title, data, titles) {
        if (!container || !data) return;
        
        // Créer un conteneur pour la section
        const section = document.createElement('div');
        section.className = 'legend-section';
        
        // Ajouter un titre à la section
        const sectionTitle = document.createElement('h5');
        sectionTitle.textContent = title;
        sectionTitle.className = 'legend-section-title';
        section.appendChild(sectionTitle);
        
        // Créer les éléments de légende pour chaque sentiment
        const sentiments = [
            { key: 'positive', label: 'Positif', color: '#4ADE80' },
            { key: 'neutral', label: 'Neutre', color: '#94A3B8' },
            { key: 'negative', label: 'Négatif', color: '#F87171' }
        ];
        
        // Calculer le total des votes pour cette section
        const totalVotes = (data.positive || 0) + (data.neutral || 0) + (data.negative || 0) || 1;
        
        sentiments.forEach(sentiment => {
            const votes = data[sentiment.key] || 0;
            const percentage = Math.round(votes / totalVotes * 100);
            
            // Créer l'élément de légende
            const item = ChartDOMManager.createLegendItem(
                `${sentiment.label} (${percentage}%)`, 
                sentiment.color, 
                votes
            );
            
            // Ajouter des attributs de données pour les interactions
            item.dataset.type = sentiment.key;
            item.dataset.index = sentiments.indexOf(sentiment);
            
            // Ajouter l'élément à la section
            section.appendChild(item);
        });
        
        // Ajouter la section au conteneur principal
        container.appendChild(section);
    }
    
    /**
     * Formate les titres pour l'affichage dans la légende
     * @param {Object} data - Données de sentiment
     * @returns {Object} Titres formatés pour chaque sentiment
     * @private
     */
    static _formatTitles(data) {
        return {
            positive: data.positiveTitles || [],
            neutral: data.neutralTitles || [],
            negative: data.negativeTitles || []
        };
    }
    
    /**
     * Obtient une couleur en fonction du score de sentiment
     * @param {number} sentiment - Score de sentiment entre -1 et 1
     * @param {Object} config - Configuration des couleurs
     * @returns {string} Couleur en format hexadécimal
     */
    static getSentimentColor(sentiment, config) {
        if (sentiment > 0.3) {
            // Positif
            return config.colors.primary;
        } else if (sentiment < -0.3) {
            // Négatif
            return '#EF4444'; // Rouge
        } else {
            // Neutre
            return config.colors.secondary;
        }
    }
    
    /**
     * Obtient une description textuelle du sentiment
     * @param {number} sentiment - Score de sentiment entre -1 et 1
     * @returns {string} Description du sentiment
     */
    static getSentimentText(sentiment) {
        if (sentiment > 0.7) return 'Très positif';
        if (sentiment > 0.3) return 'Positif';
        if (sentiment > -0.3) return 'Neutre';
        if (sentiment > -0.7) return 'Négatif';
        return 'Très négatif';
    }
}
