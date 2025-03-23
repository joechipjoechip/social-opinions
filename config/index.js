/**
 * Configuration centralisée pour les MCP (Model Control Protocols)
 * Ce fichier exporte les configurations pour les différents MCP utilisés
 * dans l'extension Reddit Opinions.
 */

import sequentialThinkingConfig from './sequential-thinking.config.js';
import playwrightConfig from './playwright.config.js';

// Configuration globale pour les MCP
const mcpConfig = {
  // Activer/désactiver l'utilisation des MCP
  enabled: true,
  
  // Configuration pour le MCP Sequential-Thinking
  sequentialThinking: sequentialThinkingConfig,
  
  // Configuration pour le MCP Playwright
  playwright: playwrightConfig,
  
  // Fonction d'initialisation des MCP
  init() {
    console.log('Initialisation des MCP...');
    // Code d'initialisation supplémentaire si nécessaire
    return this;
  }
};

export default mcpConfig;
export { sequentialThinkingConfig, playwrightConfig };
