import geminiService from './js/services/gemini.service.js';

document.addEventListener('DOMContentLoaded', function() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const summaryDiv = document.getElementById('summary');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    summarizeBtn.addEventListener('click', async () => {
        try {
            // Afficher le loading
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            summaryDiv.style.display = 'none';
            summarizeBtn.disabled = true;

            // Récupérer le contenu de la page
            const content = await geminiService.getPageContent();
            
            // Générer le résumé avec Gemini
            const summary = await geminiService.generateSummary(content);
            
            // Afficher le résumé
            summaryDiv.textContent = summary;
            summaryDiv.style.display = 'block';
        } catch (error) {
            // Afficher l'erreur
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            // Cacher le loading
            loadingDiv.style.display = 'none';
            summarizeBtn.disabled = false;
        }
    });
});
