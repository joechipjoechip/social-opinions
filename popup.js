import geminiService from './js/services/gemini.service.js';
import { Visualizations } from './js/visualizations.js';

const visualizations = new Visualizations();

function displayOverview(data) {
    const overviewContent = document.getElementById('overviewContent');
    overviewContent.innerHTML = `
        <div class="stat-value">${data.overview.totalComments}</div>
        <p>commentaires analysés</p>
        <p><strong>Sujet principal :</strong> ${data.overview.mainTopic}</p>
        <p><strong>Sentiment général :</strong> ${data.overview.generalSentiment}</p>
    `;
}

function displayTopComments(comments) {
    const topCommentsContent = document.getElementById('topCommentsContent');
    topCommentsContent.innerHTML = comments.map(comment => `
        <div class="stat-card">
            <p>${comment.text}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span>Score: <strong>${comment.score}</strong></span>
                <span>Sentiment: <strong>${comment.sentiment}</strong></span>
            </div>
        </div>
    `).join('');
}

function displayControversialPoints(points) {
    const controversialContent = document.getElementById('controversialContent');
    controversialContent.innerHTML = points.map(point => `
        <div class="controversy-item">
            <div style="display: flex; justify-content: space-between;">
                <strong>${point.topic}</strong>
                <span class="intensity">Intensité: ${point.intensity}/10</span>
            </div>
            <div style="margin-top: 8px;">
                <div>👤 ${point.perspective1}</div>
                <div>👤 ${point.perspective2}</div>
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
            visualizations.createSentimentDonut(analysisData.sentimentAnalysis);
            visualizations.createTopicsBarChart(analysisData.topics);
            visualizations.createScoreDistributionChart(analysisData.scoreDistribution);
            visualizations.createControversyChart(analysisData.controversialPoints);

            // Afficher les données textuelles
            displayOverview(analysisData);
            displayTopComments(analysisData.topComments);
            displayControversialPoints(analysisData.controversialPoints);

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
