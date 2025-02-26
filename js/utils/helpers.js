/**
 * Utilitaires généraux pour l'extension Reddit Opinions
 */

/**
 * Formate un nombre pour l'affichage (ex: 1000 -> 1k)
 * @param {number} num - Nombre à formater
 * @returns {string} - Nombre formaté
 */
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} - Texte tronqué
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Génère une couleur aléatoire en format hexadécimal
 * @returns {string} - Couleur au format #RRGGBB
 */
export function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Détermine la couleur du texte (noir ou blanc) en fonction de la couleur de fond
 * @param {string} backgroundColor - Couleur de fond au format #RRGGBB
 * @returns {string} - Couleur du texte (#000000 ou #FFFFFF)
 */
export function getTextColorForBackground(backgroundColor) {
    // Convertir la couleur hex en RGB
    const r = parseInt(backgroundColor.substring(1, 3), 16);
    const g = parseInt(backgroundColor.substring(3, 5), 16);
    const b = parseInt(backgroundColor.substring(5, 7), 16);
    
    // Calculer la luminosité
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retourner noir ou blanc selon la luminosité
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Crée un élément DOM avec des attributs et du contenu
 * @param {string} tag - Tag HTML de l'élément
 * @param {Object} attributes - Attributs de l'élément
 * @param {string|Node|Array} content - Contenu de l'élément
 * @returns {HTMLElement} - Élément créé
 */
export function createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    // Ajouter les attributs
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
            Object.entries(value).forEach(([styleKey, styleValue]) => {
                element.style[styleKey] = styleValue;
            });
        } else if (key === 'classList' && Array.isArray(value)) {
            value.forEach(cls => element.classList.add(cls));
        } else {
            element[key] = value;
        }
    });
    
    // Ajouter le contenu
    if (content) {
        if (Array.isArray(content)) {
            content.forEach(item => {
                if (typeof item === 'string') {
                    element.appendChild(document.createTextNode(item));
                } else if (item instanceof Node) {
                    element.appendChild(item);
                }
            });
        } else if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof Node) {
            element.appendChild(content);
        }
    }
    
    return element;
}

/**
 * Calcule le pourcentage d'un nombre par rapport à un total
 * @param {number} value - Valeur
 * @param {number} total - Total
 * @returns {number} - Pourcentage (0-100)
 */
export function calculatePercentage(value, total) {
    if (!total) return 0;
    return (value / total) * 100;
}

/**
 * Génère un identifiant unique
 * @returns {string} - Identifiant unique
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Débounce une fonction
 * @param {Function} func - Fonction à débouncer
 * @param {number} wait - Délai d'attente en ms
 * @returns {Function} - Fonction debouncée
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
