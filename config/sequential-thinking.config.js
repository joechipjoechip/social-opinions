/**
 * Configuration pour le MCP Sequential-Thinking
 * Ce fichier définit les paramètres pour l'utilisation du MCP Sequential-Thinking
 * dans l'extension Reddit Opinions.
 */

const sequentialThinkingConfig = {
  // Paramètres par défaut pour l'analyse des opinions
  defaultParams: {
    // Nombre initial de pensées estimées pour une analyse complète
    initialThoughts: 5,
    
    // Activer la révision des pensées précédentes
    enableRevision: true,
    
    // Activer la possibilité de brancher vers de nouvelles pistes d'analyse
    enableBranching: true,
    
    // Profondeur maximale des branches (pour éviter les analyses trop profondes)
    maxBranchDepth: 3,
    
    // Nombre maximum de pensées totales (pour limiter la complexité)
    maxTotalThoughts: 15
  },
  
  // Configuration des types d'analyse
  analysisTypes: {
    // Analyse des opinions générales
    generalOpinions: {
      initialThoughts: 3,
      promptTemplate: "Analyser les opinions générales dans le texte suivant en identifiant les thèmes principaux, le sentiment global et les points de vue divergents : {text}"
    },
    
    // Analyse des points de friction
    frictionPoints: {
      initialThoughts: 4,
      promptTemplate: "Identifier les points de friction ou de controverse dans la discussion suivante en analysant les désaccords, les arguments opposés et les sujets qui génèrent des réactions émotionnelles : {text}"
    },
    
    // Analyse hiérarchique des opinions
    hierarchicalOpinions: {
      initialThoughts: 5,
      promptTemplate: "Organiser les opinions dans le texte suivant en une structure hiérarchique, en regroupant les idées similaires et en identifiant les relations entre les différents groupes d'opinions : {text}"
    }
  },
  
  // Hooks pour le traitement des résultats
  hooks: {
    // Fonction exécutée avant le début de l'analyse
    beforeAnalysis: null,
    
    // Fonction exécutée après chaque pensée
    afterThought: null,
    
    // Fonction exécutée à la fin de l'analyse
    afterAnalysis: null
  }
};

export default sequentialThinkingConfig;
