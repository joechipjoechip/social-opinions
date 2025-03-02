/**
 * Module de gestion des éléments DOM pour les graphiques
 * Centralise les opérations sur le DOM liées aux graphiques
 */

/**
 * Classe pour gérer les éléments DOM liés aux graphiques
 */
export class ChartDOMManager {
    /**
     * Récupère les éléments DOM pour un graphique
     * @param {string} chartId - ID du canvas du graphique
     * @param {string} legendId - ID du conteneur de légende
     * @returns {Object} Objet contenant le contexte et le conteneur de légende
     */
    static getChartElements(chartId, legendId) {
        const ctx = document.getElementById(chartId)?.getContext('2d');
        const legendContainer = document.getElementById(legendId);
        
        if (!ctx) {
            console.warn(`Élément canvas avec l'ID "${chartId}" non trouvé`);
        }
        
        if (!legendContainer) {
            console.warn(`Conteneur de légende avec l'ID "${legendId}" non trouvé`);
        }
        
        return { ctx, legendContainer };
    }
    
    /**
     * Vide un conteneur de légende
     * @param {HTMLElement} container - Conteneur à vider
     */
    static clearLegendContainer(container) {
        if (container) {
            container.innerHTML = '';
        }
    }
    
    /**
     * Vérifie si les données sont valides pour un graphique
     * @param {Array} data - Données à vérifier
     * @returns {boolean} true si les données sont valides, false sinon
     */
    static isValidData(data) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('Données invalides pour le graphique');
            return false;
        }
        return true;
    }
    
    /**
     * Crée un élément de légende
     * @param {string} text - Texte de la légende
     * @param {string} color - Couleur de la légende
     * @param {number} value - Valeur associée à la légende
     * @param {string} [originalText] - Texte original (non tronqué) pour l'infobulle
     * @returns {HTMLElement} Élément de légende créé
     */
    static createLegendItem(text, color, value, originalText) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = color;
        
        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = text;
        
        // Si un texte original est fourni, ajouter une infobulle
        if (originalText && originalText !== text) {
            item.title = originalText;
        }
        
        // Ajouter la valeur si elle est fournie
        if (value !== undefined) {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'legend-value';
            valueSpan.textContent = typeof value === 'number' ? value.toLocaleString() : value;
            item.appendChild(colorBox);
            item.appendChild(label);
            item.appendChild(valueSpan);
        } else {
            item.appendChild(colorBox);
            item.appendChild(label);
        }
        
        return item;
    }
    
    /**
     * Crée un conteneur pour un groupe de légendes
     * @param {string} title - Titre du groupe
     * @returns {HTMLElement} Conteneur de groupe créé
     */
    static createLegendGroup(title) {
        const group = document.createElement('div');
        group.className = 'legend-group';
        
        if (title) {
            const titleElement = document.createElement('h3');
            titleElement.className = 'legend-group-title';
            titleElement.textContent = title;
            group.appendChild(titleElement);
        }
        
        return group;
    }
}
