/**
 * Module pour afficher les opinions sous forme de bulles
 * Visualisation des opinions principales où la taille représente la popularité 
 * et la position horizontale représente le sentiment
 */
import { formatNumber, truncateText } from '../utils/helpers.js';

export class BubbleOpinions {
    /**
     * Initialise le module BubbleOpinions
     * @param {HTMLElement} container - Conteneur pour le graphique
     */
    constructor(container) {
        this.container = container;
        this.data = null;
        this.modalElement = null;
        this.initModal();
    }

    /**
     * Initialise le modal pour afficher les détails d'une opinion
     */
    initModal() {
        // Créer l'élément modal s'il n'existe pas déjà
        if (!document.getElementById('opinionDetailModal')) {
            this.modalElement = document.createElement('div');
            this.modalElement.id = 'opinionDetailModal';
            this.modalElement.className = 'opinion-detail-modal';
            this.modalElement.innerHTML = `
                <div class="opinion-detail-content">
                    <div class="opinion-detail-header">
                        <h3 class="opinion-detail-title">Détail de l'opinion</h3>
                        <button class="opinion-detail-close" aria-label="Fermer">&times;</button>
                    </div>
                    <div class="opinion-detail-body"></div>
                </div>
            `;
            document.body.appendChild(this.modalElement);

            // Ajouter les écouteurs d'événements
            const closeBtn = this.modalElement.querySelector('.opinion-detail-close');
            closeBtn.addEventListener('click', () => this.closeModal());
            
            // Fermer le modal en cliquant en dehors du contenu
            this.modalElement.addEventListener('click', (e) => {
                if (e.target === this.modalElement) {
                    this.closeModal();
                }
            });
            
            // Fermer le modal avec la touche Echap
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modalElement.classList.contains('active')) {
                    this.closeModal();
                }
            });
        } else {
            this.modalElement = document.getElementById('opinionDetailModal');
        }
    }

    /**
     * Affiche le modal avec les détails d'une opinion
     * @param {Object} opinion - Données de l'opinion à afficher
     */
    showModal(opinion) {
        if (!this.modalElement || !opinion) return;
        
        const modalBody = this.modalElement.querySelector('.opinion-detail-body');
        const modalTitle = this.modalElement.querySelector('.opinion-detail-title');
        
        // Définir le titre
        modalTitle.textContent = truncateText(opinion.text || opinion.opinion, 50);
        
        // Déterminer la classe de sentiment
        const sentimentClass = this.getSentimentClass(opinion.sentiment || 0);
        
        // Formater le texte du sentiment
        const sentimentText = this.getSentimentText(opinion.sentiment || 0);
        
        // Construire le contenu du modal
        modalBody.innerHTML = `
            <div class="opinion-detail-stats">
                <div class="opinion-detail-stat">
                    <div class="opinion-detail-stat-value">${formatNumber(opinion.votes || opinion.totalVotes || 0)}</div>
                    <div class="opinion-detail-stat-label">Votes</div>
                </div>
                <div class="opinion-detail-stat ${sentimentClass}">
                    <div class="opinion-detail-stat-value">${sentimentText}</div>
                    <div class="opinion-detail-stat-label">Sentiment</div>
                </div>
                <div class="opinion-detail-stat">
                    <div class="opinion-detail-stat-value">${opinion.score || Math.round((opinion.votes || 0) * (opinion.sentiment || 0) * 100) / 100 || 0}</div>
                    <div class="opinion-detail-stat-label">Score</div>
                </div>
            </div>
            <div class="opinion-detail-text">
                <p>${opinion.text || opinion.opinion || 'Aucun texte disponible'}</p>
            </div>
        `;
        
        // Ajouter les sous-opinions si disponibles
        if (opinion.subOpinions && opinion.subOpinions.length > 0) {
            const subOpinionsHTML = `
                <div class="opinion-detail-subopinions">
                    <h4>Sous-opinions (${opinion.subOpinions.length})</h4>
                    <div class="subopinion-list">
                        ${opinion.subOpinions.map(subOp => {
                            const subSentimentClass = this.getSentimentClass(subOp.sentiment || 0);
                            return `
                                <div class="subopinion-item ${subSentimentClass}">
                                    <p>${subOp.text || 'Aucun texte'}</p>
                                    <div class="subopinion-meta">
                                        <span>${formatNumber(subOp.votes || 0)} votes</span>
                                        <span>${this.getSentimentText(subOp.sentiment || 0)}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            modalBody.innerHTML += subOpinionsHTML;
        }
        
        // Afficher le modal
        this.modalElement.classList.add('active');
    }

    /**
     * Ferme le modal de détails
     */
    closeModal() {
        if (this.modalElement) {
            this.modalElement.classList.remove('active');
        }
    }

    /**
     * Rend le graphique d'opinions en bulles
     * @param {Object} data - Données d'analyse
     */
    render(data) {
        if (!data) {
            this.container.innerHTML = '<p class="error">Aucune donnée disponible pour les opinions</p>';
            return;
        }
        
        // Stocker les données
        this.data = data;
        
        // Extraire les opinions principales ou les clusters d'opinions
        const opinions = data.mainOpinions || data.opinionClusters || [];
        
        if (!opinions || opinions.length === 0) {
            this.container.innerHTML = '<p class="info-message">Aucune opinion disponible pour afficher</p>';
            return;
        }
        
        // Trier les opinions par nombre de votes (décroissant)
        const sortedOpinions = [...opinions].sort((a, b) => {
            const votesA = a.votes || a.totalVotes || 0;
            const votesB = b.votes || b.totalVotes || 0;
            return votesB - votesA;
        });
        
        // Limiter à 10 opinions principales pour éviter la surcharge
        const topOpinions = sortedOpinions.slice(0, 10);
        
        // Créer le conteneur pour le graphique en bulles
        const bubbleChartContainer = document.createElement('div');
        bubbleChartContainer.className = 'bubble-chart-container';
        
        // Créer l'axe de sentiment
        const sentimentAxis = document.createElement('div');
        sentimentAxis.className = 'sentiment-axis';
        sentimentAxis.innerHTML = `
            <div class="sentiment-label negative">Très négatif</div>
            <div class="sentiment-line"></div>
            <div class="sentiment-label positive">Très positif</div>
        `;
        
        // Créer le conteneur des bulles
        const bubblesContainer = document.createElement('div');
        bubblesContainer.className = 'bubbles-container';
        
        // Générer les bulles d'opinions
        topOpinions.forEach(opinion => {
            const sentiment = opinion.sentiment || 0;
            const votes = opinion.votes || opinion.totalVotes || 0;
            
            // Calculer la taille des bulles en fonction des votes (échelle logarithmique)
            const size = Math.max(40, Math.min(120, Math.log(votes + 1) * 15));
            
            // Calculer la position horizontale basée sur le sentiment (-1 à 1)
            // Transformer en pourcentage (0% à 100%)
            const positionX = ((sentiment + 1) / 2) * 100;
            
            // Déterminer la classe de sentiment pour la couleur
            const sentimentClass = this.getSentimentClass(sentiment);
            
            // Créer l'élément bulle
            const bubble = document.createElement('div');
            bubble.className = `opinion-bubble ${sentimentClass}`;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${positionX}%`;
            bubble.style.transform = `translateX(-50%) translateY(-50%)`;
            
            // Ajouter le texte de l'opinion
            bubble.innerHTML = `
                <span class="opinion-bubble-text">${truncateText(opinion.text || opinion.opinion, Math.max(20, size / 4))}</span>
                <span class="opinion-bubble-votes">${formatNumber(votes)}</span>
            `;
            
            // Ajouter l'écouteur d'événement pour afficher les détails
            bubble.addEventListener('click', () => this.showModal(opinion));
            
            // Ajouter la bulle au conteneur
            bubblesContainer.appendChild(bubble);
        });
        
        // Créer la légende
        const legend = document.createElement('div');
        legend.className = 'bubble-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color sentiment-positive"></span>
                <span class="legend-label">Opinions positives</span>
            </div>
            <div class="legend-item">
                <span class="legend-color sentiment-neutral"></span>
                <span class="legend-label">Opinions neutres</span>
            </div>
            <div class="legend-item">
                <span class="legend-color sentiment-negative"></span>
                <span class="legend-label">Opinions négatives</span>
            </div>
        `;
        
        // Assembler le graphique
        bubbleChartContainer.appendChild(sentimentAxis);
        bubbleChartContainer.appendChild(bubblesContainer);
        
        // Vider le conteneur et ajouter les nouveaux éléments
        this.container.innerHTML = '';
        this.container.appendChild(bubbleChartContainer);
        this.container.appendChild(legend);
    }

    /**
     * Détermine la classe CSS basée sur le score de sentiment
     * @param {number} sentiment - Score de sentiment entre -1 et 1
     * @returns {string} - Classe CSS
     */
    getSentimentClass(sentiment) {
        if (sentiment > 0.2) return 'sentiment-positive';
        if (sentiment < -0.2) return 'sentiment-negative';
        return 'sentiment-neutral';
    }

    /**
     * Obtient une description textuelle du sentiment
     * @param {number} sentiment - Score de sentiment entre -1 et 1
     * @returns {string} Description du sentiment
     */
    getSentimentText(sentiment) {
        if (sentiment > 0.6) return 'Très positif';
        if (sentiment > 0.2) return 'Positif';
        if (sentiment > -0.2) return 'Neutre';
        if (sentiment > -0.6) return 'Négatif';
        return 'Très négatif';
    }
}
