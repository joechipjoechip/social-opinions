// Script pour tester les modèles disponibles avec l'API Gemini
const API_KEY = 'REMOVED_API_KEY';
const LIST_MODELS_URL = 'https://generativelanguage.googleapis.com/v1/models?key=' + API_KEY;

async function listAvailableModels() {
    try {
        const response = await fetch(LIST_MODELS_URL);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur API:', errorData);
            return;
        }
        
        const data = await response.json();
        console.log('Modèles disponibles:');
        
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                console.log(`- ${model.name} (${model.displayName})`);
                console.log(`  Supporté pour generateContent: ${model.supportedGenerationMethods.includes('generateContent')}`);
            });
        } else {
            console.log('Aucun modèle disponible');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exécuter la fonction
listAvailableModels();
