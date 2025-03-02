/**
 * Module de légendes pour les graphiques de Reddit Opinions
 * Contient des fonctions pour créer et gérer des légendes personnalisées
 */
import { formatNumber } from '../utils/index.js';

/**
 * Crée une légende personnalisée standard pour les graphiques circulaires
 * @param {HTMLElement} container - Conteneur de la légende
 * @param {Array} labels - Étiquettes
 * @param {Array} values - Valeurs
 * @param {Array} colors - Couleurs
 * @param {Array} originalLabels - Étiquettes originales (optionnel)
 */
export function createStandardLegend(container, labels, values, colors, originalLabels = null) {
    if (!container || !labels || !values || !colors) return;
    
    // Utiliser les labels originaux s'ils sont fournis, sinon utiliser les labels normaux
    const displayLabels = originalLabels || labels;
    
    const total = values.reduce((a, b) => a + b, 0);
    const legendHTML = labels.map((label, index) => {
        const percentage = Math.round((values[index] / total) * 100);
        const displayLabel = displayLabels[index];
        return `
            <div class="custom-legend-item" data-index="${index}">
                <div class="legend-item-container">
                    <div class="custom-legend-item-head">
                        <span class="legend-color-box" style="background-color: ${colors[index]}"></span>
                        <span class="legend-value">${percentage}%</span>
                    </div>
                    <span class="legend-text" title="${displayLabel}">${displayLabel}</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = legendHTML;
    
    // Ajouter la classe less-than-three si il y a moins de 3 éléments
    if (labels.length < 3) {
        container.classList.add('less-than-three');
    } else {
        container.classList.remove('less-than-three');
    }
}

/**
 * Crée une légende personnalisée pour les graphiques de controverse
 * @param {HTMLElement} container - Conteneur de la légende
 * @param {Array} labels - Étiquettes des sujets
 * @param {Array} opinion1Values - Valeurs de la première opinion
 * @param {Array} opinion2Values - Valeurs de la seconde opinion
 * @param {Array} opinion1Labels - Étiquettes de la première opinion
 * @param {Array} opinion2Labels - Étiquettes de la seconde opinion
 * @param {Object} colors - Couleurs à utiliser
 */
export function createControversyLegend(container, labels, opinion1Values, opinion2Values, opinion1Labels, opinion2Labels, colors) {
    if (!container || !labels || !opinion1Values || !opinion2Values) return;
    
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
                            <span class="legend-color-box" style="background-color: ${colors.quaternary}"></span>
                            <span class="legend-value">${opinion1Percent}%</span>
                            <span class="legend-text-small" title="${opinion1Labels[index]}">${opinion1Labels[index]}</span>
                        </div>
                        <div class="diverging-legend-item">
                            <span class="legend-color-box" style="background-color: ${colors.secondary}"></span>
                            <span class="legend-value">${opinion2Percent}%</span>
                            <span class="legend-text-small" title="${opinion2Labels[index]}">${opinion2Labels[index]}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = legendHTML;
    
    // Ajouter la classe less-than-three si il y a moins de 3 éléments
    if (labels.length < 3) {
        container.classList.add('less-than-three');
    } else {
        container.classList.remove('less-than-three');
    }
}

/**
 * Ajoute des interactions à la légende personnalisée
 * @param {HTMLElement} legendContainer - Conteneur de la légende
 * @param {Chart} chart - Instance de graphique
 * @param {Function} highlightCallback - Fonction de mise en surbrillance
 * @param {Function} resetCallback - Fonction de réinitialisation
 * @param {Function} toggleCallback - Fonction de basculement
 */
export function addLegendInteractions(legendContainer, chart, highlightCallback, resetCallback, toggleCallback) {
    if (!legendContainer || !chart) return;
    
    const legendItems = legendContainer.querySelectorAll('.custom-legend-item');
    legendItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const index = parseInt(item.getAttribute('data-index'));
            highlightCallback(chart, index);
        });
        
        item.addEventListener('mouseleave', () => {
            resetCallback(chart);
        });
        
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            toggleCallback(chart, index, item);
        });
    });
}

/**
 * Met en surbrillance un élément du graphique circulaire
 * @param {Chart} chart - Instance de graphique
 * @param {number} dataIndex - Index de l'élément
 */
export function highlightPieDataset(chart, dataIndex) {
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) return;
    
    // Sauvegarder les couleurs originales si ce n'est pas déjà fait
    const dataset = chart.data.datasets[0];
    if (!dataset.originalBackgroundColor) {
        dataset.originalBackgroundColor = [...dataset.backgroundColor];
    }
    
    // Réduire l'opacité de tous les segments sauf celui survolé
    const newBackgroundColors = dataset.originalBackgroundColor.map((color, index) => {
        return index === dataIndex ? color : adjustOpacity(color, 0.3);
    });
    
    dataset.backgroundColor = newBackgroundColors;
    chart.update();
}

/**
 * Met en surbrillance un élément du graphique à barres
 * @param {Chart} chart - Instance de graphique
 * @param {number} dataIndex - Index de l'élément
 */
export function highlightBarDataset(chart, dataIndex) {
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) return;
    
    // Sauvegarder les couleurs originales si ce n'est pas déjà fait
    const dataset = chart.data.datasets[0];
    if (!dataset.originalBackgroundColor) {
        dataset.originalBackgroundColor = [...dataset.backgroundColor];
    }
    
    // Réduire l'opacité de toutes les barres sauf celle survolée
    const newBackgroundColors = dataset.originalBackgroundColor.map((color, index) => {
        return index === dataIndex ? color : adjustOpacity(color, 0.3);
    });
    
    dataset.backgroundColor = newBackgroundColors;
    chart.update();
}

/**
 * Met en surbrillance un élément du graphique de controverse
 * @param {Chart} chart - Instance de graphique
 * @param {number} dataIndex - Index de l'élément
 */
export function highlightControversyDataset(chart, dataIndex) {
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length < 2) return;
    
    // Sauvegarder les couleurs originales si ce n'est pas déjà fait
    const dataset1 = chart.data.datasets[0];
    const dataset2 = chart.data.datasets[1];
    
    if (!dataset1.originalBackgroundColor) {
        dataset1.originalBackgroundColor = dataset1.backgroundColor;
    }
    
    if (!dataset2.originalBackgroundColor) {
        dataset2.originalBackgroundColor = dataset2.backgroundColor;
    }
    
    // Créer des tableaux de couleurs pour chaque barre
    const newColors1 = [];
    const newColors2 = [];
    
    for (let i = 0; i < chart.data.labels.length; i++) {
        if (i === dataIndex) {
            newColors1.push(dataset1.originalBackgroundColor);
            newColors2.push(dataset2.originalBackgroundColor);
        } else {
            newColors1.push(adjustOpacity(dataset1.originalBackgroundColor, 0.3));
            newColors2.push(adjustOpacity(dataset2.originalBackgroundColor, 0.3));
        }
    }
    
    dataset1.backgroundColor = newColors1;
    dataset2.backgroundColor = newColors2;
    
    chart.update();
}

/**
 * Réinitialise la surbrillance du graphique circulaire
 * @param {Chart} chart - Instance de graphique
 */
export function resetPieHighlight(chart) {
    if (!chart || !chart.data || !chart.data.datasets) return;
    
    // Restaurer les couleurs originales pour tous les datasets
    chart.data.datasets.forEach((dataset, datasetIndex) => {
        if (dataset.originalBackgroundColor) {
            // Si c'est un tableau, appliquer directement
            if (Array.isArray(dataset.originalBackgroundColor)) {
                dataset.backgroundColor = [...dataset.originalBackgroundColor];
            } 
            // Si c'est une seule couleur, l'appliquer à tous les éléments
            else {
                const meta = chart.getDatasetMeta(datasetIndex);
                if (meta && meta.data) {
                    dataset.backgroundColor = Array(meta.data.length).fill(dataset.originalBackgroundColor);
                } else {
                    dataset.backgroundColor = dataset.originalBackgroundColor;
                }
            }
        }
    });
    
    chart.update();
}

/**
 * Bascule la visibilité d'un élément du graphique
 * @param {Chart} chart - Instance de graphique
 * @param {number} dataIndex - Index de l'élément
 * @param {HTMLElement} legendItem - Élément de légende correspondant
 */
export function toggleDataVisibility(chart, dataIndex, legendItem) {
    if (!chart || !chart.getDatasetMeta) return;
    
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data[dataIndex]) return;
    
    // Basculer la visibilité
    meta.data[dataIndex].hidden = !meta.data[dataIndex].hidden;
    
    // Ajouter/supprimer la classe pour le style
    if (meta.data[dataIndex].hidden) {
        legendItem.classList.add('legend-item-hidden');
    } else {
        legendItem.classList.remove('legend-item-hidden');
    }
    
    chart.update();
}

/**
 * Ajuste l'opacité d'une couleur
 * @param {string} color - Couleur au format hex ou rgba
 * @param {number} opacity - Opacité (0-1)
 * @returns {string} - Couleur avec opacité ajustée
 */
export function adjustOpacity(color, opacity) {
    if (!color) return 'rgba(0, 0, 0, ' + opacity + ')';
    
    // Si la couleur est déjà au format rgba, ajuster l'opacité
    if (color.startsWith('rgba')) {
        return color.replace(/rgba\((.+),\s*[\d\.]+\)/, 'rgba($1, ' + opacity + ')');
    }
    
    // Si la couleur est au format rgb, convertir en rgba
    if (color.startsWith('rgb(')) {
        return color.replace(/rgb\((.+)\)/, 'rgba($1, ' + opacity + ')');
    }
    
    // Si la couleur est au format hex, convertir en rgba
    if (color.startsWith('#')) {
        let r, g, b;
        
        // Format #RGB ou #RRGGBB
        if (color.length === 4) {
            r = parseInt(color[1] + color[1], 16);
            g = parseInt(color[2] + color[2], 16);
            b = parseInt(color[3] + color[3], 16);
        } else {
            r = parseInt(color.substring(1, 3), 16);
            g = parseInt(color.substring(3, 5), 16);
            b = parseInt(color.substring(5, 7), 16);
        }
        
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
    }
    
    // Si le format de couleur n'est pas reconnu, retourner noir avec l'opacité spécifiée
    return 'rgba(0, 0, 0, ' + opacity + ')';
}
