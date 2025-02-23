import geminiService from './js/services/gemini.service.js';
import { Visualizations } from './js/visualizations.js';

const visualizations = new Visualizations();

function displayOverview(data) {
    const overviewContent = document.getElementById('overviewContent');
    overviewContent.innerHTML = `
        <div class="stat-value">${data.overview.totalComments}</div>
        <p>commentaires analysés</p>
        <p><strong>Opinion dominante :</strong> ${data.overview.mainOpinion}</p>
        <p><strong>Niveau de consensus :</strong> ${Math.round(data.overview.consensusLevel * 100)}%</p>
    `;
}

function displayTopComments(data) {
    const topCommentsContent = document.getElementById('topCommentsContent');
    const topOpinions = data.opinionClusters
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 3);

    topCommentsContent.innerHTML = topOpinions.map(opinion => `
        <div class="stat-card">
            <p><strong>${opinion.opinion}</strong></p>
            <p>${opinion.representativeComment}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span>Votes: <strong>${opinion.totalVotes}</strong></span>
                <span>Commentaires: <strong>${opinion.commentCount}</strong></span>
            </div>
        </div>
    `).join('');
}

function displayControversialPoints(data) {
    const controversialContent = document.getElementById('controversialContent');
    controversialContent.innerHTML = data.frictionPoints.map(point => `
        <div class="controversy-item">
            <div style="display: flex; justify-content: space-between;">
                <strong>${point.topic}</strong>
                <span class="intensity">Intensité: ${Math.round(point.intensityScore * 10)}/10</span>
            </div>
            <div style="margin-top: 8px;">
                <div>
                    <strong>Position 1 (${point.opinion1.votes} votes):</strong>
                    <p>${point.opinion1.stance}</p>
                </div>
                <div>
                    <strong>Position 2 (${point.opinion2.votes} votes):</strong>
                    <p>${point.opinion2.stance}</p>
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const visualizationContainer = document.querySelector('.visualization-container');

    visualizationContainer.style.display = 'none';

    summarizeBtn.addEventListener('click', async () => {
        try {
            // Reset UI
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            visualizationContainer.style.display = 'none';
            summarizeBtn.disabled = true;

            // Récupérer et analyser les données
            const content = await geminiService.getPageContent();
            const analysisData = await geminiService.generateSummary(content);

            // Créer les visualisations
            visualizations.createOpinionClusterChart(analysisData);
            visualizations.createScoresChart(analysisData);
            visualizations.createConsensusChart(analysisData);

            // Afficher les données textuelles
            displayOverview(analysisData);
            displayTopComments(analysisData);
            displayControversialPoints(analysisData);

            // Afficher les résultats
            visualizationContainer.style.display = 'block';

        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            loadingDiv.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    });
});
