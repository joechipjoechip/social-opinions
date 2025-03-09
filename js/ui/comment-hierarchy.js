/**
 * Module de visualisation hiérarchique des commentaires
 * Ce module permet d'afficher les commentaires Reddit avec leur structure hiérarchique
 */

export class CommentHierarchy {
    /**
     * Initialise le module de visualisation hiérarchique
     * @param {HTMLElement} container - Conteneur pour la visualisation
     */
    constructor(container) {
        this.container = container;
        this.data = null;
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Délégation d'événements pour les boutons d'expansion/réduction
        this.container.addEventListener('click', (event) => {
            const target = event.target;
            
            // Gestion des boutons d'expansion/réduction
            if (target.classList.contains('toggle-replies')) {
                const commentEl = target.closest('.comment-item');
                if (commentEl) {
                    const repliesEl = commentEl.querySelector('.comment-replies');
                    if (repliesEl) {
                        const isExpanded = repliesEl.classList.toggle('expanded');
                        target.textContent = isExpanded ? '▼' : '►';
                        target.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                    }
                }
            }
        });
    }

    /**
     * Affiche la hiérarchie des commentaires
     * @param {Object} data - Données d'analyse contenant les commentaires hiérarchiques
     */
    render(data) {
        console.log('Rendu de la hiérarchie des commentaires avec les données:', data);
        
        // Vérification des données
        if (!data) {
            this.container.innerHTML = '<p class="info-message">Aucune donnée disponible</p>';
            return;
        }
        
        // Vérification des commentaires hiérarchiques
        if (!data.hierarchicalComments || !Array.isArray(data.hierarchicalComments) || data.hierarchicalComments.length === 0) {
            this.container.innerHTML = '<p class="info-message">Aucune donnée hiérarchique disponible</p>';
            return;
        }
        
        this.data = data;
        
        // Créer l'en-tête de la section
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <h3>Structure des commentaires</h3>
            <div class="section-controls">
                <button class="expand-all-btn">Tout développer</button>
                <button class="collapse-all-btn">Tout réduire</button>
            </div>
        `;
        
        // Créer le conteneur des commentaires
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'hierarchical-comments';
        
        // Générer le HTML pour les commentaires hiérarchiques
        commentsContainer.innerHTML = this._renderCommentTree(data.hierarchicalComments);
        
        // Vider le conteneur et ajouter les nouveaux éléments
        this.container.innerHTML = '';
        this.container.appendChild(header);
        this.container.appendChild(commentsContainer);
        
        // Initialiser les écouteurs d'événements
        this._initExpandCollapseButtons();
        this.initEventListeners();
    }
    
    /**
     * Initialise les boutons d'expansion/réduction globaux
     * @private
     */
    _initExpandCollapseButtons() {
        const expandAllBtn = this.container.querySelector('.expand-all-btn');
        const collapseAllBtn = this.container.querySelector('.collapse-all-btn');
        
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                const allReplies = this.container.querySelectorAll('.comment-replies');
                const allToggles = this.container.querySelectorAll('.toggle-replies');
                
                allReplies.forEach(el => el.classList.add('expanded'));
                allToggles.forEach(el => {
                    el.textContent = '▼';
                    el.setAttribute('aria-expanded', 'true');
                });
            });
        }
        
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                const allReplies = this.container.querySelectorAll('.comment-replies');
                const allToggles = this.container.querySelectorAll('.toggle-replies');
                
                allReplies.forEach(el => el.classList.remove('expanded'));
                allToggles.forEach(el => {
                    el.textContent = '►';
                    el.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }
    
    /**
     * Génère le HTML pour un arbre de commentaires
     * @param {Array} comments - Commentaires à afficher
     * @param {number} depth - Niveau de profondeur actuel
     * @returns {string} - HTML généré
     * @private
     */
    _renderCommentTree(comments, depth = 0) {
        if (!Array.isArray(comments) || comments.length === 0) {
            return '';
        }
        
        let html = '';
        
        comments.forEach(comment => {
            const hasReplies = comment.replies && comment.replies.length > 0;
            const scoreClass = this._getScoreClass(comment.score || 0);
            
            html += `
                <div class="comment-item depth-${depth} ${scoreClass}">
                    <div class="comment-header">
                        ${hasReplies ? 
                            `<button class="toggle-replies" aria-expanded="false" aria-label="Afficher/masquer les réponses">►</button>` : 
                            `<span class="no-replies"></span>`
                        }
                        <span class="comment-author">${this._escapeHtml(comment.author || 'Anonyme')}</span>
                        <span class="comment-score">${comment.score || 0} points</span>
                    </div>
                    <div class="comment-content">
                        <p>${this._escapeHtml(comment.text || '')}</p>
                    </div>
                    ${hasReplies ? 
                        `<div class="comment-replies">
                            ${this._renderCommentTree(comment.replies, depth + 1)}
                        </div>` : 
                        ''
                    }
                </div>
            `;
        });
        
        return html;
    }
    
    /**
     * Détermine la classe CSS basée sur le score du commentaire
     * @param {number} score - Score du commentaire
     * @returns {string} - Classe CSS
     * @private
     */
    _getScoreClass(score) {
        if (score > 100) return 'score-very-high';
        if (score > 50) return 'score-high';
        if (score > 10) return 'score-medium';
        if (score > 0) return 'score-low';
        return 'score-neutral';
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
