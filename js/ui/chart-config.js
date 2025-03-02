/**
 * Configuration des graphiques pour l'extension Reddit Opinions
 */
export class ChartConfig {
    constructor() {
        // Configuration des couleurs NuxtUI
        this.colors = {
            primary: '#00DC82',    // Vert NuxtUI
            secondary: '#3B82F6',  // Bleu
            tertiary: '#9333EA',   // Violet stylé (remplace le vert secondaire #10B981)
            quaternary: '#F59E0B', // Orange
            quinary: '#8B5CF6',    // Violet
            senary: '#EC4899'      // Rose
        };
    }
    
    /**
     * Applique la configuration globale à Chart.js
     */
    applyGlobalConfig() {
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
     * Récupère les options pour un graphique en donut
     * @param {Function} labelCallback - Fonction de callback pour les labels
     * @returns {Object} Options de configuration
     */
    getDoughnutOptions(labelCallback) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false // Désactiver la légende native de Chart.js
                },
                tooltip: {
                    callbacks: {
                        label: labelCallback
                    }
                }
            }
        };
    }
    
    /**
     * Récupère les options pour un graphique en camembert
     * @param {Function} labelCallback - Fonction de callback pour les labels
     * @returns {Object} Options de configuration
     */
    getPieOptions(labelCallback) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Désactiver la légende native de Chart.js
                },
                tooltip: {
                    callbacks: {
                        label: labelCallback
                    }
                }
            }
        };
    }
    
    /**
     * Récupère les options pour un graphique en barres
     * @param {Function} labelCallback - Fonction de callback pour les labels
     * @param {boolean} horizontal - Si le graphique est horizontal
     * @returns {Object} Options de configuration
     */
    getBarOptions(labelCallback, horizontal = false) {
        return {
            indexAxis: horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: labelCallback
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: !horizontal
                    },
                    ticks: {
                        callback: function(value) {
                            // Tronquer les textes trop longs
                            const label = this.getLabelForValue(value);
                            if (label && label.length > 25) {
                                return label.substring(0, 22) + '...';
                            }
                            return label;
                        }
                    }
                },
                x: {
                    beginAtZero: true,
                    grid: {
                        display: horizontal
                    }
                }
            }
        };
    }
    
    /**
     * Récupère une couleur par index
     * @param {number} index - Index de la couleur
     * @returns {string} Couleur
     */
    getColorByIndex(index) {
        const colorValues = Object.values(this.colors);
        if (index < colorValues.length) {
            return colorValues[index];
        }
        // Couleur par défaut si l'index est hors limites
        return '#94A3B8'; // Gris slate NuxtUI
    }
}
