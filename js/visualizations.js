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
        
        // Configuration des couleurs
        this.colors = {
            primary: '#0079d3',
            secondary: '#ff4500',
            tertiary: '#46d160',
            quaternary: '#ffb000',
            quinary: '#7193ff',
            senary: '#ff66ac'
        };
        
        // Configuration globale de Chart.js
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        Chart.defaults.color = '#666666';
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        Chart.defaults.plugins.tooltip.titleColor = '#333333';
        Chart.defaults.plugins.tooltip.bodyColor = '#333333';
        Chart.defaults.plugins.tooltip.borderColor = '#e6e6e6';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.displayColors = true;
        Chart.defaults.plugins.tooltip.boxPadding = 6;
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
            colors.push('#999999');
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
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                    borderWidth: 1
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
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
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
        const colors = values.map((value) => {
            // Dégradé de couleurs basé sur le niveau d'accord
            const hue = 200 + (value / 100) * 60; // Bleu (200) à vert (120)
            return `hsl(${hue}, 80%, 50%)`;
        });
        
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
                    borderRadius: 4
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
                        ticks: {
                            callback: (value) => {
                                return `${value}%`;
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
     * Crée un graphique radar pour la controverse
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
        
        // Sélectionner les 6 points de friction les plus intenses
        const topFrictionPoints = frictionPoints
            .sort((a, b) => b.intensityScore - a.intensityScore)
            .slice(0, 6);
        
        const labels = topFrictionPoints.map(point => point.topic);
        const values = topFrictionPoints.map(point => point.intensityScore * 10); // Échelle de 0 à 10
        
        // Création du graphique
        this.charts.controversy = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Intensité de la controverse',
                    data: values,
                    backgroundColor: 'rgba(255, 69, 0, 0.2)',
                    borderColor: this.colors.secondary,
                    borderWidth: 2,
                    pointBackgroundColor: this.colors.secondary,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.secondary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 2
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
                                return `Intensité: ${value.toFixed(1)}/10`;
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
                        <span class="legend-color-box" style="background-color: ${this.colors.secondary}"></span>
                        <span class="legend-value">${values[index].toFixed(1)}/10</span>
                        </div>
                        <span class="legend-text" title="${label}">${label}</span>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
        }
    }
}
