/**
 * Module de visualisation des dynamiques de conversation
 * Ce module permet d'afficher les motifs d'interaction et l'évolution des opinions dans les fils de discussion
 */

export class ConversationDynamics {
    /**
     * Initialise le module de visualisation des dynamiques de conversation
     * @param {HTMLElement} container - Conteneur pour la visualisation
     */
    constructor(container) {
        this.container = container;
        this.data = null;
    }

    /**
     * Affiche les dynamiques de conversation
     * @param {Object} data - Données d'analyse contenant les dynamiques de conversation
     */
    render(data) {
        console.log('Rendu des dynamiques de conversation avec les données:', data);
        
        // Vérification des données
        if (!data) {
            this.container.innerHTML = '<p class="info-message">Aucune donnée disponible</p>';
            return;
        }
        
        // Vérification des dynamiques de conversation
        if (!data.conversationDynamics || !Array.isArray(data.conversationDynamics) || data.conversationDynamics.length === 0) {
            this.container.innerHTML = '<p class="info-message">Aucune donnée de dynamique de conversation disponible</p>';
            return;
        }
        
        this.data = data;
        
        // Créer l'en-tête de la section
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `<h3>Dynamiques de Conversation</h3>`;
        
        // Créer le conteneur des dynamiques
        const dynamicsContainer = document.createElement('div');
        dynamicsContainer.className = 'conversation-dynamics-container';
        
        // Générer le HTML pour chaque dynamique de conversation
        const dynamicsHTML = data.conversationDynamics.map(dynamic => this._renderDynamicItem(dynamic)).join('');
        dynamicsContainer.innerHTML = dynamicsHTML;
        
        // Vider le conteneur et ajouter les nouveaux éléments
        this.container.innerHTML = '';
        this.container.appendChild(header);
        this.container.appendChild(dynamicsContainer);
    }
    
    /**
     * Génère le HTML pour un élément de dynamique de conversation
     * @param {Object} dynamic - Élément de dynamique de conversation
     * @returns {string} - HTML généré
     * @private
     */
    _renderDynamicItem(dynamic) {
        // Déterminer la classe CSS basée sur le motif de réponse
        let patternClass = 'pattern-neutral';
        if (dynamic.responsePattern) {
            const pattern = dynamic.responsePattern.toLowerCase();
            if (pattern.includes('accord')) {
                patternClass = 'pattern-agreement';
            } else if (pattern.includes('désaccord')) {
                patternClass = 'pattern-disagreement';
            } else if (pattern.includes('mixte')) {
                patternClass = 'pattern-mixed';
            }
        }
        
        // Générer le HTML pour l'échange représentatif
        let exchangeHTML = '';
        if (dynamic.representativeExchange) {
            const { parent, responses } = dynamic.representativeExchange;
            
            exchangeHTML = `
                <div class="representative-exchange">
                    <div class="parent-comment">
                        <div class="comment-label">Commentaire parent:</div>
                        <div class="comment-text">${this._escapeHtml(parent || '')}</div>
                    </div>
                    ${responses && responses.length > 0 ? `
                        <div class="response-comments">
                            <div class="comment-label">Réponses:</div>
                            ${responses.map(response => `
                                <div class="response-item">
                                    <div class="comment-text">${this._escapeHtml(response || '')}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        return `
            <div class="dynamic-item ${patternClass}">
                <div class="dynamic-header">
                    <h4 class="dynamic-topic">${this._escapeHtml(dynamic.threadTopic || 'Sujet non spécifié')}</h4>
                    <span class="response-pattern">${this._escapeHtml(dynamic.responsePattern || '')}</span>
                </div>
                <div class="dynamic-content">
                    <div class="parent-opinion">
                        <strong>Opinion initiale:</strong> ${this._escapeHtml(dynamic.parentOpinion || '')}
                    </div>
                    <div class="evolution-description">
                        <strong>Évolution:</strong> ${this._escapeHtml(dynamic.evolutionDescription || '')}
                    </div>
                    ${exchangeHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Échappe les caractères HTML spéciaux
     * @param {string} text - Texte à échapper
     * @returns {string} - Texte échappé
     * @private
     */
    _escapeHtml(text) {
        if (!text) return '';
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}
