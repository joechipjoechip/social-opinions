/**
 * Module de traitement des données pour les graphiques
 * Centralise la préparation et la transformation des données
 */
import { sortAndLimitData, groupSmallValues, calculatePercentages, normalizeOpposingBarsData } from './chart-data-utils.js';

/**
 * Classe pour le traitement des données de graphiques
 */
export class DataProcessor {
    /**
     * Prépare les données pour le graphique de clusters d'opinions
     * @param {Array} opinionClusters - Clusters d'opinions
     * @param {Object} colors - Palette de couleurs
     * @param {number} maxItems - Nombre maximum d'éléments à afficher
     * @returns {Object} Données préparées
     */
    static prepareClusterData(opinionClusters, colors, maxItems = 5) {
        if (!opinionClusters || !opinionClusters.length) {
            return { labels: [], values: [], colors: [], originalLabels: [] };
        }
        
        // Utiliser l'utilitaire pour trier et limiter les données
        const sortedData = sortAndLimitData(opinionClusters, 'totalVotes', maxItems);
        
        // Utiliser l'utilitaire pour regrouper les petites valeurs
        const { labels, values, otherLabel, otherItems } = groupSmallValues(
            opinionClusters, 
            'opinion', 
            'totalVotes', 
            5, 
            maxItems
        );
        
        // Générer les couleurs
        const colorValues = Object.values(colors);
        const dataColors = labels.map((_, index) => {
            // Utiliser une couleur grise pour "Autres"
            if (otherLabel && index === labels.length - 1) {
                return '#94A3B8'; // Gris slate
            }
            return colorValues[index % colorValues.length];
        });
        
        return { 
            labels, 
            values, 
            colors: dataColors, 
            originalLabels: [...labels],
            otherItems
        };
    }
    
    /**
     * Prépare les données pour le graphique des scores
     * @param {Array} opinionClusters - Clusters d'opinions
     * @param {Object} colors - Palette de couleurs
     * @param {number} limit - Nombre maximum d'éléments
     * @returns {Object} Données préparées
     */
    static prepareScoresData(opinionClusters, colors, limit = 5) {
        if (!opinionClusters || !opinionClusters.length) {
            return { labels: [], values: [], colors: [] };
        }
        
        // Utiliser l'utilitaire pour trier et limiter les données
        const sortedData = sortAndLimitData(opinionClusters, 'totalVotes', limit);
        
        const labels = sortedData.map(cluster => cluster.opinion);
        const values = sortedData.map(cluster => cluster.totalVotes);
        const dataColors = Object.values(colors).slice(0, sortedData.length);
        
        return { labels, values, colors: dataColors };
    }
    
    /**
     * Prépare les données pour le graphique de consensus
     * @param {Array} consensusPoints - Points de consensus
     * @param {Object} colors - Palette de couleurs
     * @param {number} limit - Nombre maximum d'éléments
     * @returns {Object} Données préparées
     */
    static prepareConsensusData(consensusPoints, colors, limit = 5) {
        if (!consensusPoints || !consensusPoints.length) {
            return { labels: [], values: [], colors: [] };
        }
        
        // Utiliser l'utilitaire pour trier et limiter les données
        const sortedData = sortAndLimitData(consensusPoints, 'agreementLevel', limit);
        
        const labels = sortedData.map(point => point.topic);
        const values = sortedData.map(point => point.agreementLevel * 100); // Convertir en pourcentage
        const dataColors = Object.values(colors).slice(0, sortedData.length);
        
        return { labels, values, colors: dataColors };
    }
    
    /**
     * Prépare les données pour le graphique de controverse
     * @param {Array} frictionPoints - Points de friction
     * @param {Object} colors - Palette de couleurs
     * @param {number} limit - Nombre maximum d'éléments
     * @returns {Object} Données préparées
     */
    static prepareControversyData(frictionPoints, colors, limit = 5) {
        if (!frictionPoints || !frictionPoints.length) {
            return { 
                labels: [], 
                opinion1Values: [], 
                opinion2Values: [], 
                opinion1Stances: [], 
                opinion2Stances: [], 
                colors: {} 
            };
        }
        
        // Utiliser l'utilitaire pour trier et limiter les données
        const sortedData = sortAndLimitData(frictionPoints, 'intensityScore', limit);
        
        const labels = sortedData.map(point => point.topic);
        const opinion1Values = sortedData.map(point => point.opinion1?.votes || 0);
        const opinion2Values = sortedData.map(point => point.opinion2?.votes || 0);
        const opinion1Stances = sortedData.map(point => point.opinion1?.stance || 'Opinion 1');
        const opinion2Stances = sortedData.map(point => point.opinion2?.stance || 'Opinion 2');
        
        return { 
            labels, 
            opinion1Values, 
            opinion2Values, 
            opinion1Stances, 
            opinion2Stances, 
            colors 
        };
    }
    
    /**
     * Prépare les données pour le graphique des groupes d'opinions
     * @param {Array} opinionClusters - Clusters d'opinions
     * @param {Object} colors - Palette de couleurs
     * @param {number} limit - Nombre maximum d'éléments
     * @returns {Object} Données préparées
     */
    static prepareOpinionGroupsData(opinionClusters, colors, limit = 8) {
        if (!opinionClusters || !opinionClusters.length) {
            return { labels: [], values: [], colors: [] };
        }
        
        // Utiliser l'utilitaire pour trier et limiter les données
        const sortedData = sortAndLimitData(opinionClusters, 'totalVotes', limit);
        
        const labels = sortedData.map(cluster => cluster.opinion);
        const values = sortedData.map(cluster => cluster.totalVotes);
        
        // Définir des couleurs spécifiques pour ce graphique
        const dataColors = [
            colors.primary,
            colors.secondary,
            colors.tertiary,
            colors.quaternary,
            colors.quinary,
            colors.senary,
            '#14B8A6',
            '#6366F1'
        ].slice(0, sortedData.length);
        
        return { labels, values, colors: dataColors };
    }
}
