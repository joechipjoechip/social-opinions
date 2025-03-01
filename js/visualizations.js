import { formatNumber, getRandomColor } from './utils/helpers.js';

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
            controversy: null
        };
        
        // Configuration des couleurs NuxtUI
        this.colors = {
            primary: '#00DC82',    // Vert NuxtUI
            secondary: '#3B82F6',  // Bleu
            tertiary: '#10B981',   // Vert secondaire
            quaternary: '#F59E0B', // Orange
            quinary: '#8B5CF6',    // Violet
            senary: '#EC4899'      // Rose
        };
        
        // Configuration globale de Chart.js
        Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        Chart.defaults.color = '#6B7280'; // Gris moyen NuxtUI
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        Chart.defaults.plugins.tooltip.titleColor = '#1F2937'; // Gris foncé NuxtUI
        Chart.defaults.plugins.tooltip.bodyColor = '#1F2937';
        Chart.defaults.plugins.tooltip.borderColor = '#E5E7EB'; // Couleur de bordure NuxtUI
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.displayColors = true;
        Chart.defaults.plugins.tooltip.boxPadding = 6;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.titleFont = {
            weight: '600',
            size: 14
        };
        Chart.defaults.plugins.tooltip.bodyFont = {
            size: 13
        };
    }
    
    /**
     * Crée un graphique en donut pour les clusters d'opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createOpinionClusterChart(data) {
        const ctx = document.getElementById('opinionClusterChart').getContext('2d');
        const legendContainer = document.getElementById('opinionClusterLegend');
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionCluster) {
            this.charts.opinionCluster.destroy();
        }
        
        // Préparation des données
        const opinionClusters = data.opinionClusters || [];
        if (!opinionClusters.length) return;
        
        // Limiter à 6 opinions maximum, regrouper le reste dans "Autres"
        let labels = [];
        let values = [];
        let colors = [];
        let originalLabels = []; // Stocke les labels complets
        
        if (opinionClusters.length <= 6) {
            labels = opinionClusters.map(cluster => cluster.opinion);
            originalLabels = [...labels]; // Copie des labels complets
            values = opinionClusters.map(cluster => cluster.totalVotes);
            colors = Object.values(this.colors).slice(0, opinionClusters.length);
        } else {
            // Trier par votes et prendre les 5 premiers
            const sortedClusters = [...opinionClusters].sort((a, b) => b.totalVotes - a.totalVotes);
            const topClusters = sortedClusters.slice(0, 5);
            const otherClusters = sortedClusters.slice(5);
            
            // Ajouter les 5 premiers clusters
            labels = topClusters.map(cluster => cluster.opinion);
            originalLabels = [...labels]; // Copie des labels complets
            values = topClusters.map(cluster => cluster.totalVotes);
            colors = Object.values(this.colors).slice(0, 5);
            
            // Ajouter la catégorie "Autres"
            const otherVotes = otherClusters.reduce((sum, cluster) => sum + cluster.totalVotes, 0);
            labels.push('Autres opinions');
            originalLabels.push('Autres opinions');
            values.push(otherVotes);
            colors.push('#94A3B8'); // Gris slate NuxtUI
        }
        
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
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false // Désactiver la légende native de Chart.js
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatNumber(value)} votes (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // Créer une légende HTML personnalisée
        if (legendContainer) {
            const total = values.reduce((a, b) => a + b, 0);
            const legendHTML = labels.map((label, index) => {
                const percentage = Math.round((values[index] / total) * 100);
                const originalLabel = originalLabels[index];
                return `
                    <div class="custom-legend-item">
                    <div class="custom-legend-item-head">
                        <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                        <span class="legend-value">${percentage}%</span>
                        </div>
                        <span class="legend-text" title="${originalLabel}">${originalLabel}</span>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
        }
    }
    
    /**
     * Crée un graphique en barres pour les scores des différentes opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createScoresChart(data) {
        const ctx = document.getElementById('scoresChart').getContext('2d');
        const legendContainer = document.getElementById('scoresChartLegend');
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.scores) {
            this.charts.scores.destroy();
        }
        
        // Préparation des données
        const opinionClusters = data.opinionClusters || [];
        if (!opinionClusters.length) return;
        
        // Trier par votes et prendre les 5 premiers
        const sortedClusters = [...opinionClusters].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 5);
        
        const labels = sortedClusters.map(cluster => cluster.opinion);
        const values = sortedClusters.map(cluster => cluster.totalVotes);
        const colors = Object.values(this.colors).slice(0, sortedClusters.length);
        
        // Création du graphique
        this.charts.scores = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false // Désactiver la légende native
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${formatNumber(context.raw)} votes`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)'
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
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
                }
            }
        });
        
        // Créer une légende HTML personnalisée
        if (legendContainer) {
            const legendHTML = labels.map((label, index) => {
                return `
                    <div class="custom-legend-item">
                    <div class="custom-legend-item-head">
                        <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                        <span class="legend-value">${formatNumber(values[index])} votes</span>
                        </div>
                        <span class="legend-text" title="${label}">${label}</span>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
        }
    }
    
    /**
     * Crée un graphique en barres horizontales pour les points de consensus
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createConsensusChart(data) {
        const ctx = document.getElementById('consensusChart').getContext('2d');
        const legendContainer = document.getElementById('consensusChartLegend');
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.consensus) {
            this.charts.consensus.destroy();
        }
        
        // Préparation des données
        const consensusPoints = data.consensusPoints || [];
        if (!consensusPoints.length) return;
        
        // Limiter à 5 points de consensus
        const topConsensusPoints = consensusPoints
            .sort((a, b) => b.agreementLevel - a.agreementLevel)
            .slice(0, 5);
        
        const labels = topConsensusPoints.map(point => point.topic);
        const values = topConsensusPoints.map(point => point.agreementLevel * 100); // Convertir en pourcentage
        
        // Génération de couleurs dégradées
        const colors = [
            this.colors.primary,
            this.colors.secondary,
            this.colors.tertiary,
            this.colors.quaternary,
            this.colors.quinary
        ];
        
        // Création du graphique
        this.charts.consensus = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Niveau de consensus',
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false // Désactiver la légende native
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw || 0;
                                return `Consensus: ${Math.round(value)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)'
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            callback: (value) => {
                                return `${value}%`;
                            },
                            color: '#6B7280'
                        }
                    },
                    y: {
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
                }
            }
        });
        
        // Créer une légende HTML personnalisée
        if (legendContainer) {
            const legendHTML = labels.map((label, index) => {
                return `
                    <div class="custom-legend-item">
                    <div class="custom-legend-item-head">
                        <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                        <span class="legend-value">${Math.round(values[index])}%</span>
                        </div>
                        <span class="legend-text" title="${label}">${label}</span>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
        }
    }
    
    /**
     * Crée un graphique à barres horizontales pour les groupes d'opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createControversyChart(data) {
        const ctx = document.getElementById('controversyChart')?.getContext('2d');
        const legendContainer = document.getElementById('controversyChartLegend');
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.controversy) {
            this.charts.controversy.destroy();
        }
        
        // Préparation des données
        const frictionPoints = data.frictionPoints || [];
        if (!frictionPoints.length) return;
        
        // Sélectionner les 5 points de friction les plus intenses
        const topFrictionPoints = frictionPoints
            .sort((a, b) => b.intensityScore - a.intensityScore)
            .slice(0, 5);
        
        const labels = topFrictionPoints.map(point => point.topic);
        const values = topFrictionPoints.map(point => point.intensityScore * 10); // Échelle de 0 à 100
        
        // Générer des couleurs pour chaque barre
        const colors = [
            this.colors.primary,
            this.colors.secondary,
            this.colors.tertiary,
            this.colors.quaternary,
            this.colors.quinary
        ];
        
        // Création du graphique à barres horizontales
        this.charts.controversy = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Intensité',
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Rend le graphique horizontal
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)'
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '/100';
                            },
                            color: '#6B7280'
                        }
                    },
                    y: {
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
                                const value = context.raw || 0;
                                return `Intensité: ${(value/10).toFixed(1)}/10`;
                            }
                        }
                    }
                }
            }
        });
        
        // Créer une légende HTML personnalisée
        if (legendContainer) {
            const legendHTML = labels.map((label, index) => {
                return `
                    <div class="custom-legend-item">
                        <div class="custom-legend-item-head">
                            <span class="legend-color-box" style="background-color: ${colors[index % colors.length]}"></span>
                            <span class="legend-value">${(values[index]/10).toFixed(1)}/10</span>
                        </div>
                        <span class="legend-text" title="${label}">${label}</span>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
        }
    }
}
