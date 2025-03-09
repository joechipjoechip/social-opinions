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
        // Vérifier si le total est valide pour éviter NaN%
        const percentage = total > 0 ? Math.round((values[index] / total) * 100) : 0;
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
        const opinion1Value = opinion1Values[index] || 0;
        const opinion2Value = opinion2Values[index] || 0;
        const totalVotes = opinion1Value + opinion2Value;
        // Vérifier si le total est valide pour éviter NaN%
        const opinion1Percent = totalVotes > 0 ? Math.round((opinion1Value / totalVotes) * 100) : 0;
        const opinion2Percent = totalVotes > 0 ? Math.round((opinion2Value / totalVotes) * 100) : 0;
        
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
    
    // Sélectionner tous les éléments de légende, y compris les éléments imbriqués
    const legendItems = legendContainer.querySelectorAll('.legend-section .custom-legend-item, .legend-section [data-type]');
    
    legendItems.forEach(item => {
        // Déterminer si l'élément a un attribut data-index ou data-type
        const hasIndex = item.hasAttribute('data-index');
        const hasType = item.hasAttribute('data-type');
        
        if (!hasIndex && !hasType) return;
        
        // Ajouter une classe pour indiquer que l'élément est interactif
        item.classList.add('interactive');
        
        // Interaction au survol
        item.addEventListener('mouseenter', () => {
            let index, datasetIndex;
            
            if (hasIndex) {
                index = parseInt(item.getAttribute('data-index'));
                datasetIndex = item.hasAttribute('data-dataset-index') 
                    ? parseInt(item.getAttribute('data-dataset-index')) 
                    : null;
            } else if (hasType) {
                // Pour les éléments avec data-type (sentiment)
                const type = item.getAttribute('data-type');
                index = getSentimentIndex(type);
                datasetIndex = item.hasAttribute('data-dataset-index') 
                    ? parseInt(item.getAttribute('data-dataset-index')) 
                    : null;
            }
            
            // Appliquer un style visuel à l'élément survolé
            item.classList.add('hovered');
            
            // Appeler la fonction de mise en surbrillance avec les indices appropriés
            if (index !== undefined) {
                highlightCallback(chart, index, datasetIndex);
            }
        });
        
        // Réinitialisation au départ du survol
        item.addEventListener('mouseleave', () => {
            // Supprimer le style visuel
            item.classList.remove('hovered');
            
            // Réinitialiser le graphique
            resetCallback(chart);
        });
        
        // Interaction au clic
        item.addEventListener('click', () => {
            let index, datasetIndex;
            
            if (hasIndex) {
                index = parseInt(item.getAttribute('data-index'));
                datasetIndex = item.hasAttribute('data-dataset-index') 
                    ? parseInt(item.getAttribute('data-dataset-index')) 
                    : null;
            } else if (hasType) {
                // Pour les éléments avec data-type (sentiment)
                const type = item.getAttribute('data-type');
                index = getSentimentIndex(type);
                datasetIndex = item.hasAttribute('data-dataset-index') 
                    ? parseInt(item.getAttribute('data-dataset-index')) 
                    : null;
            }
            
            // Basculer la visibilité de l'élément
            if (index !== undefined) {
                toggleCallback(chart, index, item, datasetIndex);
                
                // Afficher un panneau de détails si disponible
                showDetailsPanel(item, chart, index, datasetIndex);
            }
        });
    });
}

/**
 * Obtient l'index correspondant à un type de sentiment
 * @param {string} sentimentType - Type de sentiment (positive, neutral, negative)
 * @returns {number} Index correspondant
 * @private
 */
function getSentimentIndex(sentimentType) {
    switch (sentimentType) {
        case 'positive': return 0;
        case 'neutral': return 1;
        case 'negative': return 2;
        default: return 0;
    }
}

/**
 * Affiche un panneau de détails pour un élément de légende
 * @param {HTMLElement} legendItem - Élément de légende
 * @param {Chart} chart - Instance de graphique
 * @param {number} index - Index de l'élément
 * @param {number} datasetIndex - Index du jeu de données
 * @private
 */
function showDetailsPanel(legendItem, chart, index, datasetIndex) {
    // Vérifier si l'élément a des détails à afficher
    if (!legendItem.hasAttribute('data-details') && !chart.data.details) return;
    
    // Récupérer les détails depuis l'attribut ou depuis les données du graphique
    const details = legendItem.hasAttribute('data-details') 
        ? JSON.parse(legendItem.getAttribute('data-details'))
        : getDetailsFromChart(chart, index, datasetIndex);
    
    if (!details) return;
    
    // Créer ou récupérer le panneau de détails
    let detailsPanel = document.getElementById('chart-details-panel');
    if (!detailsPanel) {
        detailsPanel = document.createElement('div');
        detailsPanel.id = 'chart-details-panel';
        detailsPanel.className = 'chart-details-panel';
        document.body.appendChild(detailsPanel);
    }
    
    // Remplir le panneau avec les détails
    detailsPanel.innerHTML = `
        <div class="details-header">
            <h3>${details.title || 'Détails'}</h3>
            <button class="close-details">&times;</button>
        </div>
        <div class="details-content">
            ${details.content || ''}
        </div>
        ${details.examples ? `
            <div class="details-examples">
                <h4>Exemples de commentaires</h4>
                <ul>
                    ${details.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    // Positionner le panneau près de l'élément de légende
    const rect = legendItem.getBoundingClientRect();
    detailsPanel.style.top = `${rect.top + window.scrollY}px`;
    detailsPanel.style.left = `${rect.right + window.scrollX + 10}px`;
    
    // Afficher le panneau
    detailsPanel.classList.add('visible');
    
    // Ajouter un gestionnaire pour fermer le panneau
    detailsPanel.querySelector('.close-details').addEventListener('click', () => {
        detailsPanel.classList.remove('visible');
    });
    
    // Fermer le panneau en cliquant en dehors
    document.addEventListener('click', function closePanel(e) {
        if (!detailsPanel.contains(e.target) && !legendItem.contains(e.target)) {
            detailsPanel.classList.remove('visible');
            document.removeEventListener('click', closePanel);
        }
    });
}

/**
 * Récupère les détails à partir des données du graphique
 * @param {Chart} chart - Instance de graphique
 * @param {number} index - Index de l'élément
 * @param {number} datasetIndex - Index du jeu de données
 * @returns {Object} Détails formatés
 * @private
 */
function getDetailsFromChart(chart, index, datasetIndex) {
    if (!chart.data.details) return null;
    
    // Récupérer les détails spécifiques à cet élément
    const details = datasetIndex !== null && chart.data.details[datasetIndex] 
        ? chart.data.details[datasetIndex][index]
        : chart.data.details[index];
    
    if (!details) return null;
    
    // Formater les détails pour l'affichage
    return {
        title: details.title || chart.data.labels[index],
        content: details.description || '',
        examples: details.examples || []
    };
}

/**
 * Met en surbrillance un élément du graphique circulaire
 * @param {Chart} chart - Instance de graphique
 * @param {number} dataIndex - Index de l'élément
 * @param {number} datasetIndex - Index du jeu de données (optionnel)
 */
export function highlightPieDataset(chart, dataIndex, datasetIndex = null) {
    if (!chart || !chart.data || !chart.data.datasets) return;
    
    // Réinitialiser d'abord tous les éléments
    resetPieHighlight(chart);
    
    // Déterminer si nous avons un datasetIndex spécifique ou si nous devons mettre en évidence dans tous les jeux de données
    const datasets = datasetIndex !== null ? [chart.data.datasets[datasetIndex]] : chart.data.datasets;
    
    // Mettre en évidence l'élément sélectionné dans chaque jeu de données
    datasets.forEach((dataset, i) => {
        if (!dataset.backgroundColor) return;
        
        // Pour les graphiques multi-séries, nous devons gérer différemment selon le jeu de données
        const actualIndex = datasetIndex !== null ? dataIndex : getActualDataIndex(i, dataIndex);
        
        if (Array.isArray(dataset.backgroundColor)) {
            // Sauvegarder les couleurs originales si ce n'est pas déjà fait
            if (!dataset._originalBackgroundColor) {
                dataset._originalBackgroundColor = [...dataset.backgroundColor];
            }
            
            // Appliquer l'effet de surbrillance
            dataset.backgroundColor = dataset.backgroundColor.map((color, j) => {
                return j === actualIndex ? color : adjustOpacity(color, 0.3);
            });
        }
        
        // Augmenter le décalage de l'élément sélectionné
        if (!dataset._originalHoverOffset) {
            dataset._originalHoverOffset = dataset.hoverOffset || 0;
        }
        
        if (Array.isArray(dataset.hoverOffset)) {
            if (!dataset._originalHoverOffset) {
                dataset._originalHoverOffset = [...dataset.hoverOffset];
            }
            dataset.hoverOffset = dataset.hoverOffset.map((offset, j) => {
                return j === actualIndex ? 15 : offset;
            });
        } else {
            // Appliquer un décalage plus important à l'élément sélectionné
            const hoverOffsets = new Array(dataset.data.length).fill(dataset.hoverOffset || 0);
            hoverOffsets[actualIndex] = 15;
            dataset.hoverOffset = hoverOffsets;
        }
    });
    
    chart.update();
}

/**
 * Obtient l'index réel des données pour les graphiques multi-séries
 * @param {number} datasetIndex - Index du jeu de données
 * @param {number} dataIndex - Index de l'élément dans la légende
 * @returns {number} Index réel des données
 * @private
 */
function getActualDataIndex(datasetIndex, dataIndex) {
    // Pour le graphique multi-séries, nous avons 3 jeux de données avec des structures différentes
    if (datasetIndex === 0) { // Niveau 1: Sentiment global (3 éléments)
        return dataIndex % 3; // 0, 1, 2 pour positif, neutre, négatif
    } else if (datasetIndex === 1) { // Niveau 2: Groupes principaux (6 éléments)
        // Mapper les indices 0-2 (positif, neutre, négatif) pour le groupe A
        // et 3-5 (positif, neutre, négatif) pour le groupe B
        return Math.floor(dataIndex / 3) * 3 + (dataIndex % 3);
    } else if (datasetIndex === 2) { // Niveau 3: Sous-groupes (3 éléments)
        return dataIndex % 3; // 0, 1, 2 pour positif, neutre, négatif
    }
    return dataIndex;
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
    
    // Réinitialiser tous les jeux de données
    chart.data.datasets.forEach(dataset => {
        // Réinitialiser les couleurs d'arrière-plan
        if (dataset._originalBackgroundColor) {
            dataset.backgroundColor = [...dataset._originalBackgroundColor];
        }
        
        // Réinitialiser les décalages au survol
        if (dataset._originalHoverOffset !== undefined) {
            dataset.hoverOffset = dataset._originalHoverOffset;
        }
    });
    
    chart.update();
}

/**
 * Bascule la visibilité d'un élément du graphique
 * @param {Chart} chart - Instance de graphique
 * @param {number} dataIndex - Index de l'élément
 * @param {HTMLElement} legendItem - Élément de légende correspondant
 * @param {number} datasetIndex - Index du jeu de données (optionnel)
 */
export function toggleDataVisibility(chart, dataIndex, legendItem, datasetIndex = null) {
    if (!chart || !chart.getDatasetMeta) return;
    
    // Déterminer les jeux de données à modifier
    const datasetIndices = datasetIndex !== null 
        ? [datasetIndex] 
        : Array.from({ length: chart.data.datasets.length }, (_, i) => i);
    
    // Basculer la visibilité pour chaque jeu de données
    let isHidden = false;
    
    datasetIndices.forEach(dsIndex => {
        const meta = chart.getDatasetMeta(dsIndex);
        if (!meta || !meta.data) return;
        
        // Pour les graphiques multi-séries, nous devons gérer différemment selon le jeu de données
        const actualIndex = datasetIndex !== null ? dataIndex : getActualDataIndex(dsIndex, dataIndex);
        
        // Vérifier si l'élément existe
        if (!meta.data[actualIndex]) return;
        
        // Basculer la visibilité
        meta.data[actualIndex].hidden = !meta.data[actualIndex].hidden;
        
        // Stocker l'état pour mettre à jour la classe de l'élément de légende
        isHidden = meta.data[actualIndex].hidden;
    });
    
    // Ajouter/supprimer la classe pour le style
    if (isHidden) {
        legendItem.classList.add('legend-item-hidden');
    } else {
        legendItem.classList.remove('legend-item-hidden');
    }
    
    // Mettre à jour le graphique
    chart.update();
    
    // Mettre à jour les attributs de données pour suivre l'état
    legendItem.dataset.hidden = isHidden ? 'true' : 'false';
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
