/**
 * Gestion des sections rétractables/dépliables
 * Ce module permet de transformer les sections de visualisation en éléments rétractables
 */

export class CollapsibleSections {
    /**
     * Initialise les sections rétractables
     * @param {string[]} sectionSelectors - Sélecteurs CSS des sections à rendre rétractables
     */
    constructor(sectionSelectors = []) {
        this.sectionSelectors = sectionSelectors.length > 0 
            ? sectionSelectors 
            : [
                '#opinionVisualization',
                '#consensusVisualization',
                '#controversyVisualization',
                '#opinionClusterVisualization',
                '#summary .stat-card'
            ];
        
        // Nettoyer les sections existantes avant de les réinitialiser
        this.cleanExistingSections();
        
        // Initialiser les sections
        this.init();
    }
    
    /**
     * Nettoie les sections rétractables existantes
     * Cela évite les doublons de boutons et d'écouteurs d'événements
     */
    cleanExistingSections() {
        // Supprimer les boutons de bascule existants
        document.querySelectorAll('.collapse-toggle').forEach(button => {
            button.remove();
        });
        
        // Supprimer les classes et attributs des sections
        document.querySelectorAll('.collapsible-section').forEach(section => {
            section.classList.remove('collapsible-section');
            section.removeAttribute('data-collapsed');
            
            // Trouver l'en-tête
            const header = section.querySelector('.collapsible-header');
            if (header) {
                header.classList.remove('collapsible-header');
                
                // Supprimer les écouteurs d'événements (clone et remplace)
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);
            }
            
            // Trouver le contenu
            const content = section.querySelector('.collapsible-content');
            if (content) {
                content.classList.remove('collapsible-content');
                content.style.height = '';
            }
        });
        
        // Supprimer les wrappers si nécessaire
        document.querySelectorAll('.collapsible-wrapper').forEach(wrapper => {
            // Déplacer tous les enfants du wrapper vers le parent
            const parent = wrapper.parentNode;
            while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, wrapper);
            }
            // Supprimer le wrapper vide
            wrapper.remove();
        });
    }
    
    /**
     * Initialise les sections rétractables
     */
    init() {
        this.sectionSelectors.forEach(selector => {
            const sections = document.querySelectorAll(selector);
            
            sections.forEach(section => {
                this.makeCollapsible(section);
            });
        });
    }
    
    /**
     * Rend une section rétractable
     * @param {HTMLElement} section - Élément à rendre rétractable
     */
    makeCollapsible(section) {
        // Vérifier si la section existe
        if (!section) return;
        
        // Vérifier si la section a déjà été rendue rétractable
        if (section.classList.contains('collapsible-section')) return;
        
        // Ajouter la classe pour le style
        section.classList.add('collapsible-section');
        
        // Trouver l'en-tête de la section
        const header = section.querySelector('.visualization-header, h3');
        
        if (!header) return;
        
        // Ajouter la classe pour le style
        header.classList.add('collapsible-header');
        
        // Créer le bouton de bascule
        const toggleButton = document.createElement('button');
        toggleButton.className = 'collapse-toggle';
        toggleButton.innerHTML = '<span class="collapse-icon">▼</span>';
        toggleButton.setAttribute('aria-label', 'Plier/déplier la section');
        toggleButton.setAttribute('type', 'button');
        
        // Ajouter le bouton à l'en-tête
        header.appendChild(toggleButton);
        
        // Trouver le contenu à plier/déplier
        const content = this.findCollapsibleContent(section, header);
        
        if (!content) return;
        
        // Ajouter la classe pour le style
        content.classList.add('collapsible-content');
        
        // Ajouter l'écouteur d'événement
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSection(section, content, toggleButton);
        });
        
        // Rendre l'en-tête cliquable également
        header.addEventListener('click', (e) => {
            if (e.target !== toggleButton && !toggleButton.contains(e.target)) {
                this.toggleSection(section, content, toggleButton);
            }
        });
        
        // Ajouter un attribut pour l'état (déplié par défaut)
        section.setAttribute('data-collapsed', 'false');
    }
    
    /**
     * Trouve le contenu à plier/déplier dans une section
     * @param {HTMLElement} section - Section contenant le contenu
     * @param {HTMLElement} header - En-tête de la section
     * @returns {HTMLElement} Élément contenant le contenu à plier/déplier
     */
    findCollapsibleContent(section, header) {
        // Pour les visualisations
        if (section.classList.contains('visualization-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-wrapper';
            
            // Déplacer tous les éléments après l'en-tête dans le wrapper
            let nextElement = header.nextElementSibling;
            while (nextElement) {
                const current = nextElement;
                nextElement = nextElement.nextElementSibling;
                wrapper.appendChild(current);
            }
            
            section.appendChild(wrapper);
            return wrapper;
        }
        
        // Pour les stat-cards
        if (section.classList.contains('stat-card')) {
            const content = section.querySelector('div');
            if (content) {
                return content;
            }
        }
        
        // Cas général: créer un wrapper pour tous les éléments après l'en-tête
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-wrapper';
        
        let nextElement = header.nextElementSibling;
        while (nextElement) {
            const current = nextElement;
            nextElement = nextElement.nextElementSibling;
            wrapper.appendChild(current);
        }
        
        section.appendChild(wrapper);
        return wrapper;
    }
    
    /**
     * Bascule l'état plié/déplié d'une section
     * @param {HTMLElement} section - Section à basculer
     * @param {HTMLElement} content - Contenu à plier/déplier
     * @param {HTMLElement} toggleButton - Bouton de bascule
     */
    toggleSection(section, content, toggleButton) {
        const isCollapsed = section.getAttribute('data-collapsed') === 'true';
        
        // Mettre à jour l'attribut
        section.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
        
        // Mettre à jour l'icône
        const icon = toggleButton.querySelector('.collapse-icon');
        if (icon) {
            icon.textContent = isCollapsed ? '▼' : '▶';
        }
        
        // Animer la transition
        if (isCollapsed) {
            // Déplier
            content.style.height = 'auto';
            const height = content.scrollHeight;
            content.style.height = '0';
            
            // Force reflow
            content.offsetHeight;
            
            content.style.height = `${height}px`;
            
            // Nettoyer après la transition
            const onTransitionEnd = () => {
                content.style.height = '';
                content.removeEventListener('transitionend', onTransitionEnd);
            };
            
            content.addEventListener('transitionend', onTransitionEnd);
        } else {
            // Plier
            content.style.height = `${content.scrollHeight}px`;
            
            // Force reflow
            content.offsetHeight;
            
            content.style.height = '0';
        }
    }
    
    /**
     * Déplie toutes les sections
     */
    expandAll() {
        document.querySelectorAll('.collapsible-section[data-collapsed="true"]').forEach(section => {
            const toggleButton = section.querySelector('.collapse-toggle');
            const content = section.querySelector('.collapsible-content');
            
            if (toggleButton && content) {
                this.toggleSection(section, content, toggleButton);
            }
        });
    }
    
    /**
     * Plie toutes les sections
     */
    collapseAll() {
        document.querySelectorAll('.collapsible-section[data-collapsed="false"]').forEach(section => {
            const toggleButton = section.querySelector('.collapse-toggle');
            const content = section.querySelector('.collapsible-content');
            
            if (toggleButton && content) {
                this.toggleSection(section, content, toggleButton);
            }
        });
    }
}

export default CollapsibleSections;
