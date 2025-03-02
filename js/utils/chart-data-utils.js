/**
 * Utilitaires pour la manipulation des données de graphiques
 */

/**
 * Trie et limite les données pour les graphiques
 * @param {Array} data - Données à traiter
 * @param {string} sortKey - Clé pour le tri
 * @param {number} limit - Nombre maximum d'éléments à conserver
 * @param {boolean} descending - Ordre décroissant si true
 * @returns {Array} Données triées et limitées
 */
export function sortAndLimitData(data, sortKey, limit = 5, descending = true) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
    }

    // Vérifier que les éléments ont la propriété de tri
    if (!data[0].hasOwnProperty(sortKey)) {
        console.warn(`La clé de tri "${sortKey}" n'existe pas dans les données`);
        return data.slice(0, limit);
    }

    // Créer une copie pour ne pas modifier l'original
    const sortedData = [...data].sort((a, b) => {
        const valueA = a[sortKey] || 0;
        const valueB = b[sortKey] || 0;
        return descending ? valueB - valueA : valueA - valueB;
    });

    return sortedData.slice(0, limit);
}

/**
 * Regroupe les petites valeurs dans une catégorie "Autres"
 * @param {Array} data - Données à traiter
 * @param {string} labelKey - Clé pour les étiquettes
 * @param {string} valueKey - Clé pour les valeurs
 * @param {number} threshold - Seuil en pourcentage pour regrouper (0-100)
 * @param {number} maxItems - Nombre maximum d'éléments avant regroupement
 * @returns {Object} Données regroupées avec labels, values et otherLabel
 */
export function groupSmallValues(data, labelKey, valueKey, threshold = 5, maxItems = 5) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return { labels: [], values: [], otherLabel: 'Autres' };
    }

    // Si moins d'éléments que maxItems, renvoyer tel quel
    if (data.length <= maxItems) {
        return {
            labels: data.map(item => item[labelKey] || ''),
            values: data.map(item => item[valueKey] || 0),
            otherLabel: null
        };
    }

    // Calculer le total
    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    
    // Trier par valeur décroissante
    const sortedData = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
    
    const mainItems = [];
    const otherItems = [];
    
    // Séparer les éléments principaux et les "autres"
    sortedData.forEach((item, index) => {
        const percentage = ((item[valueKey] || 0) / total) * 100;
        
        if (index < maxItems - 1 || percentage >= threshold) {
            mainItems.push(item);
        } else {
            otherItems.push(item);
        }
    });
    
    // Créer les tableaux de résultats
    const labels = mainItems.map(item => item[labelKey] || '');
    const values = mainItems.map(item => item[valueKey] || 0);
    
    // Ajouter la catégorie "Autres" si nécessaire
    if (otherItems.length > 0) {
        const otherValue = otherItems.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
        labels.push('Autres');
        values.push(otherValue);
        
        return {
            labels,
            values,
            otherLabel: 'Autres',
            otherItems
        };
    }
    
    return {
        labels,
        values,
        otherLabel: null
    };
}

/**
 * Calcule les pourcentages pour un ensemble de valeurs
 * @param {Array} values - Tableau de valeurs
 * @returns {Array} Tableau de pourcentages
 */
export function calculatePercentages(values) {
    if (!values || !Array.isArray(values) || values.length === 0) {
        return [];
    }
    
    const total = values.reduce((sum, value) => sum + (value || 0), 0);
    if (total === 0) return values.map(() => 0);
    
    return values.map(value => Math.round(((value || 0) / total) * 100));
}

/**
 * Normalise les données pour un graphique à barres opposées
 * @param {Array} data - Données à normaliser
 * @param {string} value1Key - Clé pour la première valeur
 * @param {string} value2Key - Clé pour la seconde valeur
 * @returns {Object} Données normalisées
 */
export function normalizeOpposingBarsData(data, value1Key, value2Key) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return { value1: [], value2: [] };
    }
    
    // Extraire les valeurs
    const value1 = data.map(item => item[value1Key] || 0);
    const value2 = data.map(item => item[value2Key] || 0);
    
    // Trouver la valeur maximale
    const maxValue = Math.max(
        ...value1,
        ...value2
    );
    
    // Normaliser les valeurs (0-1)
    const normalizedValue1 = value1.map(v => v / maxValue);
    const normalizedValue2 = value2.map(v => v / maxValue);
    
    return {
        value1: normalizedValue1,
        value2: normalizedValue2,
        originalValue1: value1,
        originalValue2: value2,
        maxValue
    };
}

/**
 * Prépare les données pour un graphique à barres empilées
 * @param {Array} data - Données à traiter
 * @param {string} categoryKey - Clé pour les catégories
 * @param {Array} valueKeys - Clés pour les valeurs
 * @param {Array} labels - Étiquettes pour les séries
 * @returns {Object} Données préparées
 */
export function prepareStackedBarData(data, categoryKey, valueKeys, labels) {
    if (!data || !Array.isArray(data) || data.length === 0 || !valueKeys || !Array.isArray(valueKeys)) {
        return { labels: [], datasets: [] };
    }
    
    // Extraire les catégories
    const categories = data.map(item => item[categoryKey] || '');
    
    // Créer les datasets
    const datasets = valueKeys.map((key, index) => {
        return {
            label: labels[index] || key,
            data: data.map(item => item[key] || 0)
        };
    });
    
    return {
        labels: categories,
        datasets
    };
}
