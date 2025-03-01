import { formatNumber, getRandomColor, truncateText } from './utils/helpers.js';

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
        const ctx = document.getElementById('opinionDistributionChart').getContext('2d');
        const legendContainer = document.getElementById('opinionDistributionLegend');
        
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
                    <div class="custom-legend-item" data-index="${index}">
                        <div class="legend-item-container">
                            <div class="custom-legend-item-head">
                                <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                                <span class="legend-value">${percentage}%</span>
                            </div>
                            <span class="legend-text" title="${originalLabel}">${originalLabel}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
            
            // Ajouter les interactions pour la légende
            this.addLegendInteractions(legendContainer, this.charts.opinionCluster);
            
            // Ajouter la classe less-than-three si il y a moins de 3 éléments
            if (labels.length < 3) {
                legendContainer.classList.add('less-than-three');
            } else {
                legendContainer.classList.remove('less-than-three');
            }
        }
    }
    
    /**
     * Crée un graphique en camembert pour les scores des différentes opinions
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
                return `
                    <div class="custom-legend-item" data-index="${index}">
                        <div class="legend-item-container">
                            <div class="custom-legend-item-head">
                                <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                                <span class="legend-value">${percentage}%</span>
                            </div>
                            <span class="legend-text" title="${label}">${label}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
            
            // Ajouter les interactions pour la légende
            this.addLegendInteractions(legendContainer, this.charts.scores);
            
            // Ajouter la classe less-than-three si il y a moins de 3 éléments
            if (labels.length < 3) {
                legendContainer.classList.add('less-than-three');
            } else {
                legendContainer.classList.remove('less-than-three');
            }
        }
    }
    
    /**
     * Crée un graphique en camembert pour les points de consensus
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
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Désactiver la légende native
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: Consensus ${Math.round(value)}% (${percentage}% du total)`;
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
                return `
                    <div class="custom-legend-item" data-index="${index}">
                        <div class="legend-item-container">
                            <div class="custom-legend-item-head">
                                <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                                <span class="legend-value">${percentage}%</span>
                            </div>
                            <span class="legend-text" title="${label}">${label}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
            
            // Ajouter les interactions pour la légende
            this.addLegendInteractions(legendContainer, this.charts.consensus);
            
            // Ajouter la classe less-than-three si il y a moins de 3 éléments
            if (labels.length < 3) {
                legendContainer.classList.add('less-than-three');
            } else {
                legendContainer.classList.remove('less-than-three');
            }
        }
    }
    
    /**
     * Crée un graphique à barres horizontales opposées pour les points de friction
     * Idéal pour comparer les opinions divergentes sur un même sujet
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
        
        // Préparer les données pour un graphique à barres horizontales opposées
        const labels = topFrictionPoints.map(point => point.topic);
        const opinion1Values = topFrictionPoints.map(point => point.opinion1.votes);
        const opinion2Values = topFrictionPoints.map(point => point.opinion2.votes); // Valeurs positives pour les votes
        
        // Stocker les stances pour l'affichage dans les légendes
        const opinion1Stances = topFrictionPoints.map(point => point.opinion1.stance);
        const opinion2Stances = topFrictionPoints.map(point => point.opinion2.stance);
        
        // Création du graphique à barres horizontales opposées
        this.charts.controversy = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Opinion 1',
                        data: opinion1Values,
                        backgroundColor: this.colors.quaternary, // Orange
                        borderColor: 'white',
                        borderWidth: 1,
                        borderRadius: 6,
                        maxBarThickness: 30
                    },
                    {
                        label: 'Opinion 2',
                        data: opinion2Values.map(value => -value), // Valeurs négatives pour l'affichage opposé
                        backgroundColor: this.colors.secondary, // Bleu
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
                                    return `${opinion1Stances[index]}: ${value} votes`;
                                } else {
                                    return `${opinion2Stances[index]}: ${value} votes`;
                                }
                            }
                        }
                    }
                }
            }
        });
        
        // Créer une légende HTML personnalisée
        if (legendContainer) {
            const legendHTML = labels.map((label, index) => {
                const opinion1Value = opinion1Values[index];
                const opinion2Value = opinion2Values[index];
                const totalVotes = opinion1Value + opinion2Value;
                const opinion1Percent = Math.round((opinion1Value / totalVotes) * 100);
                const opinion2Percent = Math.round((opinion2Value / totalVotes) * 100);
                
                return `
                    <div class="custom-legend-item" data-index="${index}">
                        <div class="legend-item-container">
                            <div class="legend-text-bold" title="${label}">${label}</div>
                            <div class="diverging-legend">
                                <div class="diverging-legend-item">
                                    <span class="legend-color-box" style="background-color: ${this.colors.quaternary}"></span>
                                    <span class="legend-value">${opinion1Percent}%</span>
                                    <span class="legend-text-small" title="${opinion1Stances[index]}">${opinion1Stances[index]}</span>
                                </div>
                                <div class="diverging-legend-item">
                                    <span class="legend-color-box" style="background-color: ${this.colors.secondary}"></span>
                                    <span class="legend-value">${opinion2Percent}%</span>
                                    <span class="legend-text-small" title="${opinion2Stances[index]}">${opinion2Stances[index]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
            
            // Ajouter les interactions pour la légende
            this.addControversyLegendInteractions(legendContainer, this.charts.controversy);
            
            // Ajouter la classe less-than-three si il y a moins de 3 éléments
            if (labels.length < 3) {
                legendContainer.classList.add('less-than-three');
            } else {
                legendContainer.classList.remove('less-than-three');
            }
        }
    }
    
    /**
     * Crée un graphique en barres pour les groupes d'opinions
     * @param {RedditAnalysis} data - Données d'analyse
     */
    createOpinionGroupsChart(data) {
        const ctx = document.getElementById('opinionClusterChart').getContext('2d');
        const legendContainer = document.getElementById('opinionClusterLegend');
        
        // Vider le conteneur de légende s'il existe
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
        
        // Destruction du graphique existant s'il existe
        if (this.charts.opinionGroups) {
            this.charts.opinionGroups.destroy();
        }
        
        // Préparation des données
        const opinionClusters = data.opinionClusters || [];
        if (!opinionClusters.length) return;
        
        // Limiter à 8 opinions maximum pour le graphique en barres
        let labels = [];
        let values = [];
        
        // Trier par votes et prendre les 8 premiers
        const sortedClusters = [...opinionClusters].sort((a, b) => b.totalVotes - a.totalVotes);
        const topClusters = sortedClusters.slice(0, 8);
        
        // Extraire les données
        labels = topClusters.map(cluster => cluster.opinion);
        values = topClusters.map(cluster => cluster.totalVotes);
        
        // Calculer le total des votes pour les pourcentages
        const totalVotes = values.reduce((sum, value) => sum + value, 0);
        
        // Générer un tableau de couleurs pour chaque barre
        const colors = [
            this.colors.primary,    // Vert
            this.colors.secondary,  // Bleu
            this.colors.tertiary,   // Vert secondaire
            this.colors.quaternary, // Orange
            this.colors.quinary,    // Violet
            this.colors.senary,     // Rose
            '#14B8A6',              // Teal
            '#6366F1'               // Indigo
        ];
        
        // Création du graphique en barres
        this.charts.opinionGroups = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: values,
                    backgroundColor: colors.slice(0, topClusters.length),
                    borderColor: 'white',
                    borderWidth: 1,
                    borderRadius: 6,
                    maxBarThickness: 30
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = Math.round((value / totalVotes) * 100);
                                return `Votes: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    },
                    datalabels: {
                        display: true,
                        color: '#1F2937',
                        anchor: 'end',
                        align: 'end',
                        formatter: (value) => {
                            return value.toLocaleString();
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                // Tronquer les textes trop longs
                                const label = this.getLabelForValue(value);
                                if (label.length > 25) {
                                    return label.substring(0, 22) + '...';
                                }
                                return label;
                            }
                        }
                    },
                    x: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        // Créer une légende HTML personnalisée dans le style de celle du consensus
        if (legendContainer) {
            const legendHTML = topClusters.map((cluster, index) => {
                const percentage = Math.round((cluster.totalVotes / totalVotes) * 100);
                return `
                    <div class="custom-legend-item" data-index="${index}">
                        <div class="legend-item-container">
                            <div class="custom-legend-item-head">
                                <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                                <span class="legend-value">${percentage}%</span>
                            </div>
                            <span class="legend-text" title="${cluster.opinion}">${cluster.opinion}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            legendContainer.innerHTML = legendHTML;
            
            // Ajouter les interactions pour la légende du graphique en barres
            this.addBarLegendInteractions(legendContainer, this.charts.opinionGroups, colors);
            
            // Ajouter la classe less-than-three si il y a moins de 3 éléments
            if (topClusters.length < 3) {
                legendContainer.classList.add('less-than-three');
            } else {
                legendContainer.classList.remove('less-than-three');
            }
        }
    }
    
    addLegendInteractions(legendContainer, chart) {
        const legendItems = legendContainer.querySelectorAll('.custom-legend-item');
        
        legendItems.forEach((item) => {
            // Utiliser tout l'élément pour le survol
            const handleMouseOver = () => {
                const itemIndex = parseInt(item.getAttribute('data-index'));
                
                // Mettre en évidence l'élément survolé dans le graphique
                const meta = chart.getDatasetMeta(0);
                
                // Pour les graphiques de type doughnut et pie
                if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
                    meta.data.forEach((dataItem, index) => {
                        // Mettre en évidence l'élément survolé
                        if (index === itemIndex) {
                            dataItem.outerRadius = dataItem.outerRadius * 1.08;
                        } else {
                            // Atténuer les autres éléments
                            const originalColor = chart.data.datasets[0].backgroundColor[index];
                            meta.data[index].options = {
                                ...meta.data[index].options,
                                backgroundColor: this.addTransparency(originalColor, 0.5)
                            };
                        }
                    });
                }
                
                // Mettre à jour les styles de la légende
                legendItems.forEach((legendItem, idx) => {
                    if (idx === itemIndex) {
                        legendItem.classList.add('highlight');
                    } else {
                        legendItem.classList.add('dimmed');
                    }
                });
                
                chart.update();
            };
            
            const handleMouseOut = () => {
                const itemIndex = parseInt(item.getAttribute('data-index'));
                
                // Restaurer l'apparence normale du graphique
                const meta = chart.getDatasetMeta(0);
                
                // Pour les graphiques de type doughnut et pie
                if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
                    meta.data.forEach((dataItem, index) => {
                        // Restaurer le rayon d'origine
                        if (index === itemIndex) {
                            dataItem.outerRadius = dataItem.outerRadius / 1.08;
                        }
                        
                        // Restaurer la couleur d'origine
                        const originalColor = chart.data.datasets[0].backgroundColor[index];
                        meta.data[index].options = {
                            ...meta.data[index].options,
                            backgroundColor: originalColor
                        };
                    });
                }
                
                // Restaurer les styles de la légende
                legendItems.forEach(legendItem => {
                    legendItem.classList.remove('highlight');
                    legendItem.classList.remove('dimmed');
                });
                
                chart.update();
            };
            
            // Ajouter les événements à l'élément principal
            item.addEventListener('mouseover', handleMouseOver);
            item.addEventListener('mouseout', handleMouseOut);
        });
    }
    
    // Méthode spécifique pour les interactions avec les légendes des graphiques en barres
    addBarLegendInteractions(legendContainer, chart, colors) {
        const legendItems = legendContainer.querySelectorAll('.custom-legend-item');
        
        legendItems.forEach((item) => {
            // Utiliser tout l'élément pour le survol
            const handleMouseOver = () => {
                const itemIndex = parseInt(item.getAttribute('data-index'));
                
                // Mettre en évidence la barre survolée dans le graphique
                const dataset = chart.data.datasets[0];
                const originalColors = [...dataset.backgroundColor];
                
                // Créer un nouvel array de couleurs avec transparence pour toutes les barres sauf celle survolée
                const newColors = originalColors.map((color, idx) => {
                    return idx === itemIndex ? color : this.addTransparency(color, 0.3);
                });
                
                // Appliquer les nouvelles couleurs
                dataset.backgroundColor = newColors;
                
                // Mettre à jour les styles de la légende
                legendItems.forEach((legendItem, idx) => {
                    if (idx === itemIndex) {
                        legendItem.classList.add('highlight');
                    } else {
                        legendItem.classList.add('dimmed');
                    }
                });
                
                chart.update();
            };
            
            const handleMouseOut = () => {
                // Restaurer les couleurs d'origine
                const dataset = chart.data.datasets[0];
                dataset.backgroundColor = colors.slice(0, dataset.data.length);
                
                // Restaurer les styles de la légende
                legendItems.forEach(legendItem => {
                    legendItem.classList.remove('highlight');
                    legendItem.classList.remove('dimmed');
                });
                
                chart.update();
            };
            
            // Ajouter les événements à l'élément principal
            item.addEventListener('mouseover', handleMouseOver);
            item.addEventListener('mouseout', handleMouseOut);
        });
    }
    
    addControversyLegendInteractions(legendContainer, chart) {
        const legendItems = legendContainer.querySelectorAll('.custom-legend-item');
        
        legendItems.forEach((item) => {
            // Utiliser tout l'élément pour le survol
            const handleMouseOver = () => {
                const itemIndex = parseInt(item.getAttribute('data-index'));
                
                // Mettre en évidence la barre survolée dans le graphique
                const dataset1 = chart.data.datasets[0];
                const dataset2 = chart.data.datasets[1];
                
                // Sauvegarder les couleurs d'origine si ce n'est pas déjà fait
                if (!dataset1._originalBackgroundColor) {
                    dataset1._originalBackgroundColor = this.colors.quaternary;
                    dataset2._originalBackgroundColor = this.colors.secondary;
                }
                
                // Créer des tableaux de couleurs pour chaque barre
                const newColors1 = [];
                const newColors2 = [];
                
                for (let i = 0; i < chart.data.labels.length; i++) {
                    if (i === itemIndex) {
                        newColors1.push(dataset1._originalBackgroundColor);
                        newColors2.push(dataset2._originalBackgroundColor);
                    } else {
                        newColors1.push(this.addTransparency(dataset1._originalBackgroundColor, 0.3));
                        newColors2.push(this.addTransparency(dataset2._originalBackgroundColor, 0.3));
                    }
                }
                
                // Appliquer les nouvelles couleurs
                dataset1.backgroundColor = newColors1;
                dataset2.backgroundColor = newColors2;
                
                // Mettre à jour les styles de la légende
                legendItems.forEach((legendItem, idx) => {
                    if (idx === itemIndex) {
                        legendItem.classList.add('highlight');
                    } else {
                        legendItem.classList.add('dimmed');
                    }
                });
                
                chart.update();
            };
            
            const handleMouseOut = () => {
                // Restaurer les couleurs d'origine
                const dataset1 = chart.data.datasets[0];
                const dataset2 = chart.data.datasets[1];
                
                // Utiliser les couleurs d'origine sauvegardées
                const originalColor1 = dataset1._originalBackgroundColor || this.colors.quaternary;
                const originalColor2 = dataset2._originalBackgroundColor || this.colors.secondary;
                
                // Réinitialiser les couleurs pour toutes les barres
                dataset1.backgroundColor = originalColor1;
                dataset2.backgroundColor = originalColor2;
                
                // Restaurer les styles de la légende
                legendItems.forEach(legendItem => {
                    legendItem.classList.remove('highlight');
                    legendItem.classList.remove('dimmed');
                });
                
                chart.update();
            };
            
            // Ajouter les événements à l'élément principal
            item.addEventListener('mouseover', handleMouseOver);
            item.addEventListener('mouseout', handleMouseOut);
        });
    }
    
    // Utilitaire pour ajouter de la transparence à une couleur
    addTransparency(color, alpha) {
        if (color.startsWith('#')) {
            // Convertir hexadécimal en RGB
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else if (color.startsWith('rgb')) {
            // Convertir rgb en rgba
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        } else if (color.startsWith('rgba')) {
            // Modifier la valeur alpha existante
            return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/, `rgba($1, $2, $3, ${alpha})`);
        }
        return color;
    }
}
