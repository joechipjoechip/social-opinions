import { formatNumber } from './utils/index.js';
import { ChartConfig, ChartFactory, ChartDOMManager } from './ui/index.js';

/**
 * Classe pour gérer les visualisations des données Reddit
 */
export class Visualizations {
    constructor() {
        // Initialisation des graphiques
        this.charts = {
            opinionBubble: null,
            opinionCluster: null,
            scores: null,
            consensus: null,
            controversy: null,
            opinionGroups: null,
            multiSeriesPie: null
        };
        
        // Initialiser la configuration des graphiques
        this.config = new ChartConfig();
        
        // Appliquer la configuration globale
        this.config.applyGlobalConfig();
    }
    
    /**
     * Crée un graphique en camembert multi-séries pour visualiser les opinions
     * @param {Array} opinions - Données des opinions
     */
    createOpinionBubbleChart(opinions) {
        // Récupérer les éléments DOM
        const { ctx, legendContainer } = ChartDOMManager.getChartElements(
            'opinionBubbleChart', 
            'bubbleChartLegend'
        );
        
        if (!ctx) {
            console.warn('Contexte de canvas non trouvé pour le graphique en bulles');
            return;
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionBubble) {
            this.charts.opinionBubble.destroy();
        }
        
        // Vérifier les données
        if (!Array.isArray(opinions) || opinions.length === 0) {
            console.warn('Aucune opinion à afficher dans le graphique en bulles');
            return;
        }
        
        try {
            // Log pour le débogage
            console.log('Données d\'opinions reçues:', opinions);
            
            // Récupérer les données hiérarchiques
            const hierarchicalData = {
                // Niveau 1: Sentiment global (positif/négatif)
                global: this.extractGlobalSentiment(opinions || []),
                // Niveau 2: Groupes principaux (basés sur les commentaires de premier niveau)
                mainGroups: this.extractMainGroups(opinions || []),
                // Niveau 3: Sous-groupes (basés sur les réponses aux commentaires principaux)
                subGroups: this.extractSubGroups(opinions || [])
            };
            
            // Log pour le débogage
            console.log('Données hiérarchiques extraites:', hierarchicalData);
            
            // Vérifier que les données hiérarchiques sont complètes
            if (!hierarchicalData.global || !hierarchicalData.mainGroups || !hierarchicalData.subGroups) {
                console.warn('Données hiérarchiques incomplètes pour le graphique multi-séries');
                return;
            }
            
            // Vérifier les valeurs numériques
            this.validateNumericValues(hierarchicalData);
            
            // Création du graphique avec la fabrique
            this.charts.multiSeriesPie = ChartFactory.createMultiSeriesPieChart(ctx, legendContainer, hierarchicalData, this.config);
            
            if (!this.charts.multiSeriesPie) {
                console.warn('Échec de création du graphique multi-séries');
            } else {
                console.log('Graphique multi-séries créé avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de la création du graphique multi-séries:', error);
        }
    }
    
    /**
     * Valide et corrige les valeurs numériques dans les données hiérarchiques
     * @param {Object} data - Données hiérarchiques
     * @private
     */
    validateNumericValues(data) {
        // Valider le niveau global
        data.global.positive = Number(data.global.positive) || 0;
        data.global.negative = Number(data.global.negative) || 0;
        data.global.neutral = Number(data.global.neutral) || 0;
        
        // Valider les groupes principaux
        if (data.mainGroups && data.mainGroups.groupA) {
            data.mainGroups.groupA.positive = Number(data.mainGroups.groupA.positive) || 0;
            data.mainGroups.groupA.negative = Number(data.mainGroups.groupA.negative) || 0;
            data.mainGroups.groupA.neutral = Number(data.mainGroups.groupA.neutral) || 0;
        }
        
        if (data.mainGroups && data.mainGroups.groupB) {
            data.mainGroups.groupB.positive = Number(data.mainGroups.groupB.positive) || 0;
            data.mainGroups.groupB.negative = Number(data.mainGroups.groupB.negative) || 0;
            data.mainGroups.groupB.neutral = Number(data.mainGroups.groupB.neutral) || 0;
        }
        
        // Valider les sous-groupes
        if (data.subGroups) {
            data.subGroups.positive = Number(data.subGroups.positive) || 0;
            data.subGroups.negative = Number(data.subGroups.negative) || 0;
            data.subGroups.neutral = Number(data.subGroups.neutral) || 0;
        }
        
        // S'assurer qu'il y a au moins une valeur positive et négative pour l'affichage
        this.ensureMinimumValues(data);
    }
    
    /**
     * S'assure qu'il y a au moins une valeur minimale pour chaque catégorie
     * @param {Object} data - Données hiérarchiques
     * @private
     */
    ensureMinimumValues(data) {
        const MIN_VALUE = 1;
        
        // Niveau global
        if (data.global.positive === 0 && data.global.negative === 0 && data.global.neutral === 0) {
            data.global.positive = MIN_VALUE;
            data.global.negative = MIN_VALUE;
            data.global.neutral = MIN_VALUE;
        } else if (data.global.positive > 0 && data.global.negative === 0) {
            data.global.negative = Math.max(MIN_VALUE, Math.round(data.global.positive * 0.05));
        } else if (data.global.negative > 0 && data.global.positive === 0) {
            data.global.positive = Math.max(MIN_VALUE, Math.round(data.global.negative * 0.05));
        }
        
        // Groupes principaux
        if (data.mainGroups && data.mainGroups.groupA) {
            if (data.mainGroups.groupA.positive > 0 && data.mainGroups.groupA.negative === 0) {
                data.mainGroups.groupA.negative = Math.max(MIN_VALUE, Math.round(data.mainGroups.groupA.positive * 0.05));
            }
        }
        
        if (data.mainGroups && data.mainGroups.groupB) {
            if (data.mainGroups.groupB.positive > 0 && data.mainGroups.groupB.negative === 0) {
                data.mainGroups.groupB.negative = Math.max(MIN_VALUE, Math.round(data.mainGroups.groupB.positive * 0.05));
            }
        }
        
        // Sous-groupes
        if (data.subGroups) {
            if (data.subGroups.positive > 0 && data.subGroups.negative === 0) {
                data.subGroups.negative = Math.max(MIN_VALUE, Math.round(data.subGroups.positive * 0.05));
            }
        }
    }
    
    /**
     * Extrait le sentiment global à partir des opinions
     * @param {Array} opinions - Données des opinions
     * @returns {Object} Données de sentiment global
     * @private
     */
    extractGlobalSentiment(opinions) {
        if (!Array.isArray(opinions) || opinions.length === 0) {
            console.warn('Aucune opinion fournie pour extraire le sentiment global');
            return { positive: 0, negative: 0, neutral: 0 };
        }
        
        try {
            // Initialiser les compteurs
            let positive = 0;
            let negative = 0;
            let neutral = 0;
            
            // Compter les opinions par sentiment
            opinions.forEach(opinion => {
                if (!opinion) return;
                
                const sentiment = opinion.sentiment || 0;
                
                if (sentiment > 0.2) {
                    positive += opinion.votes || 1;
                } else if (sentiment < -0.2) {
                    negative += opinion.votes || 1;
                } else {
                    neutral += opinion.votes || 1;
                }
            });
            
            // S'assurer qu'il y a au moins une valeur minimale pour chaque catégorie
            if (positive === 0 && negative === 0 && neutral === 0) {
                positive = 1;
                negative = 1;
                neutral = 1;
            }
            
            console.log('Sentiment global extrait:', { positive, negative, neutral });
            
            return { positive, negative, neutral };
        } catch (error) {
            console.error('Erreur lors de l\'extraction du sentiment global:', error);
            return { positive: 1, negative: 1, neutral: 1 };
        }
    }
    
    /**
     * Extrait les groupes principaux à partir des opinions
     * @param {Array} opinions - Données des opinions
     * @returns {Object} Données des groupes principaux
     * @private
     */
    extractMainGroups(opinions) {
        if (!Array.isArray(opinions) || opinions.length === 0) {
            console.warn('Aucune opinion fournie pour extraire les groupes principaux');
            return {
                groupA: { title: 'Groupe A', positive: 0, negative: 0, neutral: 0 },
                groupB: { title: 'Groupe B', positive: 0, negative: 0, neutral: 0 }
            };
        }
        
        try {
            // Trier les opinions par nombre de votes
            const sortedOpinions = [...opinions].sort((a, b) => (b.votes || 0) - (a.votes || 0));
            
            // Prendre les deux premières opinions comme groupes principaux
            const groupA = sortedOpinions[0] || { opinion: 'Groupe A', votes: 0, sentiment: 0 };
            const groupB = sortedOpinions[1] || { opinion: 'Groupe B', votes: 0, sentiment: 0 };
            
            // Créer les objets de groupe avec les données de sentiment
            const groupAData = {
                title: groupA.opinion || 'Groupe A',
                positive: groupA.sentiment > 0.2 ? (groupA.votes || 1) : 0,
                negative: groupA.sentiment < -0.2 ? (groupA.votes || 1) : 0,
                neutral: (groupA.sentiment >= -0.2 && groupA.sentiment <= 0.2) ? (groupA.votes || 1) : 0
            };
            
            const groupBData = {
                title: groupB.opinion || 'Groupe B',
                positive: groupB.sentiment > 0.2 ? (groupB.votes || 1) : 0,
                negative: groupB.sentiment < -0.2 ? (groupB.votes || 1) : 0,
                neutral: (groupB.sentiment >= -0.2 && groupB.sentiment <= 0.2) ? (groupB.votes || 1) : 0
            };
            
            // S'assurer qu'il y a au moins une valeur dans chaque catégorie
            if (groupAData.positive === 0 && groupAData.negative === 0 && groupAData.neutral === 0) {
                groupAData.positive = 1;
            }
            
            if (groupBData.positive === 0 && groupBData.negative === 0 && groupBData.neutral === 0) {
                groupBData.positive = 1;
            }
            
            console.log('Groupes principaux extraits:', { groupA: groupAData, groupB: groupBData });
            
            return { groupA: groupAData, groupB: groupBData };
        } catch (error) {
            console.error('Erreur lors de l\'extraction des groupes principaux:', error);
            return {
                groupA: { title: 'Groupe A', positive: 1, negative: 0, neutral: 0 },
                groupB: { title: 'Groupe B', positive: 1, negative: 0, neutral: 0 }
            };
        }
    }
    
    /**
     * Extrait les sous-groupes à partir des opinions
     * @param {Array} opinions - Données des opinions
     * @returns {Object} Données des sous-groupes
     * @private
     */
    extractSubGroups(opinions) {
        if (!Array.isArray(opinions) || opinions.length === 0) {
            console.warn('Aucune opinion fournie pour extraire les sous-groupes');
            return { title: 'Autres opinions', positive: 0, negative: 0, neutral: 0 };
        }
        
        try {
            // Prendre les opinions restantes (après les deux principales)
            const remainingOpinions = [...opinions];
            if (remainingOpinions.length > 2) {
                remainingOpinions.sort((a, b) => (b.votes || 0) - (a.votes || 0));
                remainingOpinions.splice(0, 2); // Retirer les deux premières opinions
            }
            
            // Initialiser les compteurs
            let positive = 0;
            let negative = 0;
            let neutral = 0;
            
            // Compter les opinions par sentiment
            remainingOpinions.forEach(opinion => {
                if (!opinion) return;
                
                const sentiment = opinion.sentiment || 0;
                const votes = opinion.votes || 1;
                
                if (sentiment > 0.2) {
                    positive += votes;
                } else if (sentiment < -0.2) {
                    negative += votes;
                } else {
                    neutral += votes;
                }
            });
            
            // S'assurer qu'il y a au moins une valeur minimale pour chaque catégorie
            if (positive === 0 && negative === 0 && neutral === 0) {
                positive = 1;
                negative = 1;
                neutral = 1;
            }
            
            const result = { 
                title: 'Autres opinions', 
                positive, 
                negative, 
                neutral 
            };
            
            console.log('Sous-groupes extraits:', result);
            
            return result;
        } catch (error) {
            console.error('Erreur lors de l\'extraction des sous-groupes:', error);
            return { title: 'Autres opinions', positive: 1, negative: 1, neutral: 1 };
        }
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
            opinionBubble: null,
            opinionCluster: null,
            scores: null,
            consensus: null,
            controversy: null,
            opinionGroups: null,
            multiSeriesPie: null
        };
    }
}
