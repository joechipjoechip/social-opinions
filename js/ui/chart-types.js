/**
 * Module de types de graphiques pour Reddit Opinions
 * Contient des fonctions spécialisées pour créer différents types de graphiques
 */
import { formatNumber, truncateText } from '../utils/index.js';

/**
 * Crée un graphique en camembert pour les scores des différentes opinions
 * @param {HTMLElement} ctx - Contexte du canvas
 * @param {Array} data - Données pour le graphique
 * @param {Object} config - Configuration du graphique
 * @returns {Chart} Instance du graphique
 */
export function createScoresChart(ctx, data, config) {
    if (!ctx || !data || !data.length) {
        console.warn('Données ou contexte manquants pour le graphique des scores');
        return null;
    }
    
    // Trier par votes et prendre les 5 premiers
    const sortedData = [...data].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 5);
    
    const labels = sortedData.map(item => item.opinion);
    const values = sortedData.map(item => item.totalVotes);
    const colors = Object.values(config.colors).slice(0, sortedData.length);
    
    // Création du graphique
    return new Chart(ctx, {
        type: 'pie',
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
        options: config.getPieOptions((context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${formatNumber(value)} votes (${percentage}%)`;
        })
    });
}

/**
 * Crée un graphique en camembert pour les points de consensus
 * @param {HTMLElement} ctx - Contexte du canvas
 * @param {Array} data - Données pour le graphique
 * @param {Object} config - Configuration du graphique
 * @returns {Chart} Instance du graphique
 */
export function createConsensusChart(ctx, data, config) {
    if (!ctx || !data || !data.length) {
        console.warn('Données ou contexte manquants pour le graphique de consensus');
        return null;
    }
    
    // Limiter à 5 points de consensus
    const topConsensusPoints = [...data]
        .sort((a, b) => b.agreementLevel - a.agreementLevel)
        .slice(0, 5);
    
    const labels = topConsensusPoints.map(point => point.topic);
    const values = topConsensusPoints.map(point => point.agreementLevel * 100); // Convertir en pourcentage
    
    // Génération de couleurs
    const colors = Object.values(config.colors).slice(0, 5);
    
    // Création du graphique
    return new Chart(ctx, {
        type: 'pie',
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
        options: config.getPieOptions((context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: Consensus ${Math.round(value)}% (${percentage}% du total)`;
        })
    });
}

/**
 * Crée un graphique à barres horizontales opposées pour les points de friction
 * @param {HTMLElement} ctx - Contexte du canvas
 * @param {Array} data - Données pour le graphique
 * @param {Object} config - Configuration du graphique
 * @returns {Chart} Instance du graphique
 */
export function createControversyChart(ctx, data, config) {
    if (!ctx || !data || !data.length) {
        console.warn('Données ou contexte manquants pour le graphique de controverse');
        return null;
    }
    
    // Sélectionner les 5 points de friction les plus intenses
    const topFrictionPoints = [...data]
        .sort((a, b) => b.intensityScore - a.intensityScore)
        .slice(0, 5);
    
    // Préparer les données pour un graphique à barres horizontales opposées
    const labels = topFrictionPoints.map(point => point.topic);
    const opinion1Values = topFrictionPoints.map(point => point.opinion1?.votes || 0);
    const opinion2Values = topFrictionPoints.map(point => point.opinion2?.votes || 0);
    
    // Stocker les stances pour l'affichage dans les légendes
    const opinion1Stances = topFrictionPoints.map(point => point.opinion1?.stance || 'Opinion 1');
    const opinion2Stances = topFrictionPoints.map(point => point.opinion2?.stance || 'Opinion 2');
    
    // Création du graphique à barres horizontales opposées
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Opinion 1',
                    data: opinion1Values,
                    backgroundColor: config.colors.quaternary, // Orange
                    borderColor: 'white',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 30
                },
                {
                    label: 'Opinion 2',
                    data: opinion2Values.map(value => -value), // Valeurs négatives pour l'affichage opposé
                    backgroundColor: config.colors.secondary, // Bleu
                    borderColor: 'white',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 30
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Rend le graphique horizontal
            scales: {
                x: {
                    stacked: false,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.03)'
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        callback: function(value) {
                            // Afficher les valeurs absolues
                            return Math.abs(value);
                        },
                        color: '#6B7280'
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        padding: 10,
                        color: '#1F2937',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Désactiver la légende native
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const index = context.dataIndex;
                            const value = Math.abs(context.raw);
                            
                            if (datasetIndex === 0) {
                                return `${opinion1Stances[index]}: ${formatNumber(value)} votes`;
                            } else {
                                return `${opinion2Stances[index]}: ${formatNumber(value)} votes`;
                            }
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crée un graphique en barres pour les groupes d'opinions
 * @param {HTMLElement} ctx - Contexte du canvas
 * @param {Array} data - Données pour le graphique
 * @param {Object} config - Configuration du graphique
 * @returns {Chart} Instance du graphique
 */
export function createOpinionGroupsChart(ctx, data, config) {
    if (!ctx || !data || !data.length) {
        console.warn('Données ou contexte manquants pour le graphique des groupes d\'opinions');
        return null;
    }
    
    // Trier par votes et prendre les 8 premiers
    const sortedData = [...data].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 8);
    
    const labels = sortedData.map(item => item.opinion);
    const values = sortedData.map(item => item.totalVotes);
    
    // Définir des couleurs spécifiques pour ce graphique
    const colors = [
        config.colors.primary,
        config.colors.secondary,
        config.colors.tertiary,
        config.colors.quaternary,
        config.colors.quinary,
        config.colors.senary,
        '#14B8A6',
        '#6366F1'
    ].slice(0, sortedData.length);
    
    // Création du graphique à barres
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'white',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.03)'
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#6B7280'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        padding: 5,
                        color: '#1F2937',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            // Tronquer les textes trop longs
                            const label = this.getLabelForValue(value);
                            return truncateText(label, 15);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Désactiver la légende native
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const label = context.label || '';
                            return `${label}: ${formatNumber(value)} votes`;
                        }
                    }
                }
            }
        }
    });
}
