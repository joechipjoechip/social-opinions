/**
 * Module de visualisations pour Reddit Opinions
 * Gère la création et la mise à jour des graphiques
 */
import { formatNumber, generateRandomColors } from '../utils/helpers.js';
import { createBubbleChart } from './chart-types.js';
import { ChartConfig } from './chart-config.js';

export class Visualizations {
    constructor() {
        this.charts = {};
        this.chartConfig = new ChartConfig();
    }

    /**
     * Initialise les conteneurs de graphiques
     */
    initChartContainers() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                const canvas = document.createElement('canvas');
                canvas.id = container.id + 'Chart';
                container.appendChild(canvas);
            }
        });
    }

    /**
     * Détruit tous les graphiques existants
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Crée un graphique en bulles pour visualiser les opinions
     * @param {Array} opinions - Données des opinions
     */
    createOpinionBubbleChart(opinions) {
        if (!opinions || !Array.isArray(opinions) || opinions.length === 0) {
            console.warn('Aucune opinion à afficher dans le graphique en bulles');
            return;
        }

        const ctx = document.getElementById('opinionBubbleChart');
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: opinionBubbleChart');
            return;
        }

        // Destruction du graphique existant si nécessaire
        if (this.charts.opinionBubble) {
            this.charts.opinionBubble.destroy();
        }

        // Préparation des données pour le graphique en bulles
        const bubbleData = opinions.map(opinion => {
            return {
                opinion: opinion.text || opinion.opinion || 'Sans texte',
                totalVotes: opinion.votes || opinion.totalVotes || 1,
                sentimentScore: opinion.sentiment || opinion.sentimentScore || 0
            };
        });

        // Création du graphique en bulles
        this.charts.opinionBubble = createBubbleChart(ctx, bubbleData, this.chartConfig);
    }

    /**
     * Crée un graphique en donut pour les clusters d'opinions
     * @param {Array} clusters - Clusters d'opinions
     */
    createOpinionClusterChart(clusters) {
        if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
            console.warn('Aucun cluster d\'opinion à afficher');
            return;
        }

        const ctx = document.getElementById('opinionDistributionChart');
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: opinionDistributionChart');
            return;
        }

        // Préparation des données
        const labels = clusters.map(cluster => cluster.name || 'Sans nom');
        const values = clusters.map(cluster => cluster.percentage || 0);
        const colors = generateRandomColors(clusters.length);

        // Destruction du graphique existant si nécessaire
        if (this.charts.opinionCluster) {
            this.charts.opinionCluster.destroy();
        }

        // Création du nouveau graphique
        this.charts.opinionCluster = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'white',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Crée un graphique en barres pour les points de friction
     * @param {Array} frictionPoints - Points de friction
     */
    createFrictionPointsChart(frictionPoints) {
        if (!frictionPoints || !Array.isArray(frictionPoints) || frictionPoints.length === 0) {
            console.warn('Aucun point de friction à afficher');
            return;
        }

        const ctx = document.getElementById('frictionPointsChart');
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: frictionPointsChart');
            return;
        }

        // Tri des points de friction par score
        const sortedPoints = [...frictionPoints].sort((a, b) => b.score - a.score);
        
        // Limiter à 5 points maximum pour la lisibilité
        const topPoints = sortedPoints.slice(0, 5);

        // Préparation des données
        const labels = topPoints.map(point => point.topic || 'Sans titre');
        const values = topPoints.map(point => point.score || 0);
        const colors = generateRandomColors(topPoints.length);

        // Destruction du graphique existant si nécessaire
        if (this.charts.frictionPoints) {
            this.charts.frictionPoints.destroy();
        }

        // Création du nouveau graphique
        this.charts.frictionPoints = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score de friction',
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Score de friction'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Points de friction'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                return `Score: ${formatNumber(value)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Crée un graphique en ligne pour les tendances temporelles
     * @param {Array} timeData - Données temporelles
     */
    createTimelineChart(timeData) {
        if (!timeData || !Array.isArray(timeData) || timeData.length === 0) {
            console.warn('Aucune donnée temporelle à afficher');
            return;
        }

        const ctx = document.getElementById('timelineChart');
        if (!ctx) {
            console.error('Conteneur de graphique non trouvé: timelineChart');
            return;
        }

        // Préparation des données
        const labels = timeData.map(item => item.label || '');
        const values = timeData.map(item => item.value || 0);

        // Destruction du graphique existant si nécessaire
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        // Création du graphique en ligne
        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tendance',
                    data: values,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
