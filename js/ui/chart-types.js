/**
 * Module de types de graphiques pour Social Opinions
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

/**
 * Crée un graphique en bulles (bubble chart) pour visualiser les opinions
 * @param {HTMLElement} ctx - Contexte du canvas
 * @param {Array} data - Données pour le graphique
 * @param {Object} config - Configuration du graphique
 * @returns {Chart} Instance du graphique
 */
export function createBubbleChart(ctx, data, config) {
    if (!ctx || !data || !data.length) {
        console.warn('Données ou contexte manquants pour le graphique en bulles');
        return null;
    }
    
    // Trier par votes et prendre les 15 premiers pour une meilleure lisibilité
    const sortedData = [...data].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 15);
    
    // Préparer les données pour le graphique en bulles
    const bubbleData = sortedData.map((item, index) => {
        // Calculer la taille des bulles en fonction des votes (échelle logarithmique pour éviter des bulles trop grandes)
        const size = Math.max(10, Math.log(item.totalVotes + 1) * 10);
        
        // Sentiment score entre -1 et 1, transformé en valeur x entre 0 et 100
        const sentimentX = ((item.sentimentScore || 0) + 1) * 50;
        
        // Répartir les bulles verticalement pour éviter les chevauchements
        // Utiliser une distribution en zigzag pour maximiser l'espace
        const y = 30 + (index % 5) * 15;
        
        return {
            x: sentimentX,
            y: y,
            r: size,
            opinion: item.opinion,
            votes: item.totalVotes,
            sentiment: item.sentimentScore || 0,
            color: getSentimentColor(item.sentimentScore || 0, config)
        };
    });
    
    // Création du graphique
    return new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                data: bubbleData,
                backgroundColor: bubbleData.map(item => item.color),
                borderColor: 'white',
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverBackgroundColor: bubbleData.map(item => item.color),
                hoverBorderColor: '#333'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: -10,
                    max: 110,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value === 0) return 'Très négatif';
                            if (value === 50) return 'Neutre';
                            if (value === 100) return 'Très positif';
                            return '';
                        },
                        color: '#6B7280'
                    },
                    title: {
                        display: true,
                        text: 'Sentiment',
                        color: '#1F2937',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    display: false // Masquer l'axe Y car il est arbitraire
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = context.raw;
                            const sentimentText = getSentimentText(item.sentiment);
                            return [
                                `Opinion: ${truncateText(item.opinion, 50)}`,
                                `Votes: ${formatNumber(item.votes)}`,
                                `Sentiment: ${sentimentText}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

/**
 * Crée un graphique en camembert multi-séries pour visualiser les opinions hiérarchiques
 * @param {HTMLElement} ctx - Contexte du canvas
 * @param {HTMLElement} legendContainer - Conteneur pour la légende personnalisée
 * @param {Object} data - Données hiérarchiques pour le graphique
 * @param {Object} config - Configuration du graphique
 * @returns {Chart} Instance du graphique
 */
export function createMultiSeriesPieChart(ctx, data, config = {}) {
    if (!ctx || !data) {
        console.warn('Données ou contexte manquants pour le graphique en camembert multi-séries');
        return null;
    }
    
    console.log('Données reçues dans createMultiSeriesPieChart:', data);
    
    // Extraire les données hiérarchiques et s'assurer qu'elles existent
    const global = data.global || { positive: 0, negative: 0, neutral: 0 };
    const mainGroups = data.mainGroups || { 
        groupA: { positive: 0, negative: 0, neutral: 0, title: 'Groupe A' },
        groupB: { positive: 0, negative: 0, neutral: 0, title: 'Groupe B' }
    };
    const subGroups = data.subGroups || { 
        positive: 0, negative: 0, neutral: 0, title: 'Autres opinions'
    };
    
    // S'assurer que toutes les propriétés numériques sont des nombres valides
    global.positive = Number(global.positive) || 0;
    global.negative = Number(global.negative) || 0;
    global.neutral = Number(global.neutral) || 0;
    
    // S'assurer que les groupes principaux existent et ont toutes les propriétés nécessaires
    if (!mainGroups.groupA) mainGroups.groupA = { positive: 0, negative: 0, neutral: 0, title: 'Groupe A' };
    if (!mainGroups.groupB) mainGroups.groupB = { positive: 0, negative: 0, neutral: 0, title: 'Groupe B' };
    
    mainGroups.groupA.positive = Number(mainGroups.groupA.positive) || 0;
    mainGroups.groupA.negative = Number(mainGroups.groupA.negative) || 0;
    mainGroups.groupA.neutral = Number(mainGroups.groupA.neutral) || 0;
    mainGroups.groupA.title = mainGroups.groupA.title || 'Groupe A';
    
    mainGroups.groupB.positive = Number(mainGroups.groupB.positive) || 0;
    mainGroups.groupB.negative = Number(mainGroups.groupB.negative) || 0;
    mainGroups.groupB.neutral = Number(mainGroups.groupB.neutral) || 0;
    mainGroups.groupB.title = mainGroups.groupB.title || 'Groupe B';
    
    // S'assurer que les sous-groupes ont toutes les propriétés nécessaires
    subGroups.positive = Number(subGroups.positive) || 0;
    subGroups.negative = Number(subGroups.negative) || 0;
    subGroups.neutral = Number(subGroups.neutral) || 0;
    subGroups.title = subGroups.title || 'Autres opinions';
    
    // Définir les couleurs pour chaque niveau avec une meilleure différenciation
    const colors = {
        // Niveau 1: Sentiment global
        global: {
            positive: '#4ADE80', // Vert
            neutral: '#94A3B8',  // Gris
            negative: '#F87171'  // Rouge
        },
        // Niveau 2: Groupes principaux
        mainGroups: {
            groupA: {
                positive: '#22C55E', // Vert foncé
                neutral: '#64748B',  // Gris foncé
                negative: '#EF4444'  // Rouge vif
            },
            groupB: {
                positive: '#86EFAC', // Vert clair
                neutral: '#CBD5E1',  // Gris clair
                negative: '#FCA5A5'  // Rouge clair
            }
        },
        // Niveau 3: Sous-groupes
        subGroups: {
            positive: '#10B981', // Vert émeraude
            neutral: '#9CA3AF',  // Gris moyen
            negative: '#DC2626'  // Rouge foncé
        }
    };
    
    // S'assurer qu'il y a au moins une valeur minimale pour chaque catégorie
    const MIN_VALUE = 1;
    
    // Niveau global
    if (global.positive === 0 && global.negative === 0 && global.neutral === 0) {
        console.warn('Aucune donnée de sentiment global, ajout de valeurs minimales');
        global.positive = MIN_VALUE;
        global.negative = MIN_VALUE;
        global.neutral = MIN_VALUE;
    }
    
    // Calculer les pourcentages pour les étiquettes
    const totalVotes = global.positive + global.negative + global.neutral || 3;
    const groupATotalVotes = mainGroups.groupA.positive + mainGroups.groupA.negative + mainGroups.groupA.neutral || 1;
    const groupBTotalVotes = mainGroups.groupB.positive + mainGroups.groupB.negative + mainGroups.groupB.neutral || 1;
    const subGroupsTotalVotes = subGroups.positive + subGroups.negative + subGroups.neutral || 1;
    
    console.log('Totaux calculés:', {
        totalVotes,
        groupATotalVotes,
        groupBTotalVotes,
        subGroupsTotalVotes
    });
    
    // Préparer les données pour Chart.js
    const chartData = {
        labels: [
            // Niveau 1: Sentiment global
            `Opinions positives (${Math.round(global.positive / totalVotes * 100)}%)`,
            `Opinions neutres (${Math.round(global.neutral / totalVotes * 100)}%)`,
            `Opinions négatives (${Math.round(global.negative / totalVotes * 100)}%)`,
            // Niveau 2: Groupes principaux
            `${mainGroups.groupA.title} - Positif (${Math.round(mainGroups.groupA.positive / groupATotalVotes * 100)}%)`,
            `${mainGroups.groupA.title} - Neutre (${Math.round(mainGroups.groupA.neutral / groupATotalVotes * 100)}%)`,
            `${mainGroups.groupA.title} - Négatif (${Math.round(mainGroups.groupA.negative / groupATotalVotes * 100)}%)`,
            `${mainGroups.groupB.title} - Positif (${Math.round(mainGroups.groupB.positive / groupBTotalVotes * 100)}%)`,
            `${mainGroups.groupB.title} - Neutre (${Math.round(mainGroups.groupB.neutral / groupBTotalVotes * 100)}%)`,
            `${mainGroups.groupB.title} - Négatif (${Math.round(mainGroups.groupB.negative / groupBTotalVotes * 100)}%)`,
            // Niveau 3: Sous-groupes
            `${subGroups.title} - Positif (${Math.round(subGroups.positive / subGroupsTotalVotes * 100)}%)`,
            `${subGroups.title} - Neutre (${Math.round(subGroups.neutral / subGroupsTotalVotes * 100)}%)`,
            `${subGroups.title} - Négatif (${Math.round(subGroups.negative / subGroupsTotalVotes * 100)}%)`
        ],
        datasets: [
            // Niveau 1: Sentiment global (cercle extérieur)
            {
                data: [global.positive, global.neutral, global.negative],
                backgroundColor: [colors.global.positive, colors.global.neutral, colors.global.negative],
                borderColor: '#E5E7EB',
                borderWidth: 2,
                weight: 0.5,
                hoverOffset: 10
            },
            // Niveau 2: Groupes principaux (cercle intermédiaire)
            {
                data: [
                    mainGroups.groupA.positive, 
                    mainGroups.groupA.neutral,
                    mainGroups.groupA.negative,
                    mainGroups.groupB.positive,
                    mainGroups.groupB.neutral,
                    mainGroups.groupB.negative
                ],
                backgroundColor: [
                    colors.mainGroups.groupA.positive,
                    colors.mainGroups.groupA.neutral,
                    colors.mainGroups.groupA.negative,
                    colors.mainGroups.groupB.positive,
                    colors.mainGroups.groupB.neutral,
                    colors.mainGroups.groupB.negative
                ],
                borderColor: '#E5E7EB',
                borderWidth: 2,
                weight: 0.3,
                hoverOffset: 10
            },
            // Niveau 3: Sous-groupes (cercle intérieur)
            {
                data: [subGroups.positive, subGroups.neutral, subGroups.negative],
                backgroundColor: [colors.subGroups.positive, colors.subGroups.neutral, colors.subGroups.negative],
                borderColor: '#E5E7EB',
                borderWidth: 2,
                weight: 0.2,
                hoverOffset: 10
            }
        ]
    };
    
    console.log('Données préparées pour le graphique:', chartData);
    
    // Fusionner avec la configuration par défaut
    const chartConfig = {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Désactiver la légende par défaut
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.formattedValue || '';
                            return `${label}: ${value}`;
                        }
                    }
                },
                datalabels: {
                    display: false // Désactiver les étiquettes de données par défaut
                }
            },
            layout: {
                padding: 20
            }
        }
    };
    
    // Créer et retourner le graphique
    try {
        // Détruire le graphique existant s'il existe
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
        
        return new Chart(ctx, chartConfig);
    } catch (error) {
        console.error('Erreur lors de la création du graphique multi-séries:', error);
        return null;
    }
}

/**
 * Formate les exemples de commentaires pour l'infobulle
 * @param {Array} titles - Titres à formater
 * @returns {string} Titres formatés pour l'infobulle
 */
function formatTooltipExamples(titles) {
    if (!titles || !Array.isArray(titles) || titles.length === 0) {
        return 'Aucun exemple';
    }
    
    return 'Exemples: ' + titles.map(title => truncateText(title, 30)).join(', ');
}

/**
 * Obtient une couleur en fonction du score de sentiment
 * @param {number} sentiment - Score de sentiment entre -1 et 1
 * @param {Object} config - Configuration des couleurs
 * @returns {string} Couleur en format hexadécimal
 */
function getSentimentColor(sentiment, config) {
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
function getSentimentText(sentiment) {
    if (sentiment > 0.7) return 'Très positif';
    if (sentiment > 0.3) return 'Positif';
    if (sentiment > -0.3) return 'Neutre';
    if (sentiment > -0.7) return 'Négatif';
    return 'Très négatif';
}
