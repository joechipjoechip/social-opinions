/**
 * Configuration pour le MCP Playwright
 * Ce fichier définit les paramètres pour l'utilisation du MCP Playwright
 * dans l'extension Reddit Opinions.
 */

const playwrightConfig = {
  // Configuration du navigateur
  browser: {
    // Type de navigateur à utiliser (chromium, firefox, webkit)
    type: 'chromium',
    
    // Exécuter en mode headless (sans interface graphique)
    headless: false,
    
    // Taille de la fenêtre du navigateur
    viewport: {
      width: 1280,
      height: 720
    },
    
    // Timeout pour la navigation (en millisecondes)
    navigationTimeout: 30000,
    
    // User agent personnalisé (null pour utiliser celui par défaut)
    userAgent: null
  },
  
  // Configuration pour l'extraction de contenu Reddit
  redditExtraction: {
    // Sélecteurs CSS pour l'extraction des commentaires
    selectors: {
      // Sélecteurs pour les différentes versions de l'interface Reddit
      shredditComments: 'shreddit-comment',
      slotComments: '[slot="comment-content"]',
      classicComments: '.Comment',
      
      // Sélecteurs pour les informations de l'auteur
      authorInfo: '.author-information',
      
      // Sélecteurs pour les votes
      voteCount: '.vote-count',
      
      // Sélecteurs pour les timestamps
      timestamp: '.timestamp'
    },
    
    // Délai d'attente pour le chargement des commentaires (en millisecondes)
    commentLoadWaitTime: 2000,
    
    // Nombre maximum de commentaires à extraire (0 pour tous)
    maxComments: 0,
    
    // Profondeur maximale des commentaires imbriqués à extraire
    maxDepth: 10
  },
  
  // Configuration pour les captures d'écran
  screenshots: {
    // Répertoire de sauvegarde des captures d'écran
    directory: './screenshots',
    
    // Format des captures d'écran (png ou jpeg)
    format: 'png',
    
    // Qualité pour le format jpeg (0-100)
    quality: 80,
    
    // Prendre des captures d'écran de la page entière
    fullPage: true
  },
  
  // Configuration pour les requêtes réseau
  network: {
    // Intercepter les requêtes réseau
    interceptRequests: false,
    
    // Bloquer certains types de ressources pour améliorer les performances
    blockResources: ['image', 'font', 'media'],
    
    // Timeout pour les requêtes réseau (en millisecondes)
    requestTimeout: 30000
  },
  
  // Hooks pour les événements Playwright
  hooks: {
    // Fonction exécutée avant la navigation
    beforeNavigation: null,
    
    // Fonction exécutée après la navigation
    afterNavigation: null,
    
    // Fonction exécutée après l'extraction des commentaires
    afterExtraction: null
  }
};

export default playwrightConfig;
