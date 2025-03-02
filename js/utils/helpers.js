/**
 * Utilitaires généraux pour l'extension Reddit Opinions
 */

/**
 * Formate un nombre pour l'affichage (ex: 1000 -> 1k)
 * @param {number|string} num - Nombre à formater
 * @returns {string} - Nombre formaté
 */
export function formatNumber(num) {
    // Vérification et conversion du type
    const parsedNum = Number(num);
    
    // Si la valeur n'est pas un nombre valide, retourner '0'
    if (isNaN(parsedNum)) return '0';
    
    if (parsedNum >= 1000000) {
        return (parsedNum / 1000000).toFixed(1) + 'M';
    }
    if (parsedNum >= 1000) {
        return (parsedNum / 1000).toFixed(1) + 'k';
    }
    return parsedNum.toString();
}

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} - Texte tronqué
 */
export function truncateText(text, maxLength = 100) {
    // Vérification du type
    if (!text || typeof text !== 'string') return '';
    
    if (text.length <= maxLength) return text;
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
    // Vérification du format de la couleur
    if (!backgroundColor || typeof backgroundColor !== 'string' || !backgroundColor.startsWith('#') || backgroundColor.length !== 7) {
        return '#000000'; // Noir par défaut en cas d'erreur
    }
    
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
    // Vérification des types et valeurs
    const parsedValue = Number(value);
    const parsedTotal = Number(total);
    
    if (isNaN(parsedValue) || isNaN(parsedTotal) || parsedTotal === 0) {
        return 0;
    }
    
    return (parsedValue / parsedTotal) * 100;
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
    if (typeof func !== 'function') {
        throw new Error('Le premier argument doit être une fonction');
    }
    
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

/**
 * Vérifie si une valeur est définie et non null
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} - true si la valeur est définie et non null
 */
export function isDefined(value) {
    return value !== undefined && value !== null;
}

/**
 * Récupère une valeur avec une valeur par défaut si non définie
 * @param {*} value - Valeur à vérifier
 * @param {*} defaultValue - Valeur par défaut
 * @returns {*} - Valeur ou valeur par défaut
 */
export function getValueOrDefault(value, defaultValue) {
    return isDefined(value) ? value : defaultValue;
}
