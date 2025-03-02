/**
 * Composants d'interface utilisateur pour Reddit Opinions
 */
import { truncateText } from '../utils/helpers.js';

/**
 * Crée un élément de point de friction
 * @param {Object} point - Point de friction
 * @returns {HTMLElement} Élément DOM
 */
export function createFrictionPointElement(point) {
    if (!point || !point.topic) return null;
    
    const container = document.createElement('div');
    container.className = 'friction-point';
    
    const title = document.createElement('h4');
    title.textContent = point.topic;
    container.appendChild(title);
    
    if (point.description) {
        const description = document.createElement('p');
        description.textContent = point.description;
        container.appendChild(description);
    }
    
    if (point.score !== undefined) {
        const score = document.createElement('div');
        score.className = 'friction-score';
        score.textContent = `Score: ${point.score}`;
        container.appendChild(score);
    }
    
    return container;
}

/**
 * Crée un élément de cluster d'opinion
 * @param {Object} cluster - Cluster d'opinion
 * @returns {HTMLElement} Élément DOM
 */
export function createOpinionClusterElement(cluster) {
    if (!cluster || !cluster.name) return null;
    
    const container = document.createElement('div');
    container.className = 'opinion-cluster';
    
    const header = document.createElement('div');
    header.className = 'cluster-header';
    
    const title = document.createElement('h4');
    title.textContent = cluster.name;
    header.appendChild(title);
    
    if (cluster.percentage !== undefined) {
        const percentage = document.createElement('span');
        percentage.className = 'cluster-percentage';
        percentage.textContent = `${cluster.percentage.toFixed(1)}%`;
        header.appendChild(percentage);
    }
    
    container.appendChild(header);
    
    if (cluster.description) {
        const description = document.createElement('p');
        description.className = 'cluster-description';
        description.textContent = cluster.description;
        container.appendChild(description);
    }
    
    if (cluster.examples && Array.isArray(cluster.examples) && cluster.examples.length > 0) {
        const examples = document.createElement('div');
        examples.className = 'cluster-examples';
        
        const examplesTitle = document.createElement('h5');
        examplesTitle.textContent = 'Exemples:';
        examples.appendChild(examplesTitle);
        
        const examplesList = document.createElement('ul');
        cluster.examples.forEach(example => {
            if (example && example.text) {
                const item = document.createElement('li');
                item.textContent = truncateText(example.text, 100);
                examplesList.appendChild(item);
            }
        });
        
        examples.appendChild(examplesList);
        container.appendChild(examples);
    }
    
    return container;
}

/**
 * Crée un élément de message d'erreur
 * @param {string} message - Message d'erreur
 * @returns {HTMLElement} Élément DOM
 */
export function createErrorMessage(message) {
    const container = document.createElement('div');
    container.className = 'error-message';
    
    const icon = document.createElement('span');
    icon.className = 'error-icon';
    icon.textContent = '⚠️';
    container.appendChild(icon);
    
    const text = document.createElement('p');
    text.textContent = message || 'Une erreur est survenue';
    container.appendChild(text);
    
    return container;
}

/**
 * Crée un élément de message de succès
 * @param {string} message - Message de succès
 * @returns {HTMLElement} Élément DOM
 */
export function createSuccessMessage(message) {
    const container = document.createElement('div');
    container.className = 'success-message';
    
    const icon = document.createElement('span');
    icon.className = 'success-icon';
    icon.textContent = '✅';
    container.appendChild(icon);
    
    const text = document.createElement('p');
    text.textContent = message || 'Opération réussie';
    container.appendChild(text);
    
    return container;
}

/**
 * Crée un élément de chargement
 * @returns {HTMLElement} Élément DOM
 */
export function createLoadingIndicator() {
    const container = document.createElement('div');
    container.className = 'loading-indicator';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    container.appendChild(spinner);
    
    const text = document.createElement('p');
    text.textContent = 'Chargement en cours...';
    container.appendChild(text);
    
    return container;
}
