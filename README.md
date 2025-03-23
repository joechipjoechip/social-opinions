# Social Opinions

Extension Chrome qui analyse les opinions et les tendances dans les commentaires Reddit à l'aide de l'IA.

# /!\ Projet "Vibe coding" /!\
Ce projet est un essai pour tester Windsurf : je n'ai écris que des prompts et aucune ligne de code.
Après quelques essais, j'ai décidé de rester sur Claude 3.7 sonnet et récemment j'ai ajouté 2 MCP :
- sequential-thinking
- playwright

Les autres modèles n'ont produit que du code non-fonctionnel et inutilement ambigu.
J'ai décidé de ne pas prendre la version "thinking" de Claude 3.7 après quelques essais, 
car celui-ci avait tendance à se perdre et à engranger tellement de contexte que cela semblait le rendre inopérant.

## API keys en clair
l'ia a pu écrire mes clés api en clair dans le code, perdez pas votre temps à tenter, j'ai tout révoqué ;)


## Structure du projet

Le projet est organisé selon la structure suivante :

```
reddit-resume/
├── js/
│   ├── components/     # Composants d'interface utilisateur réutilisables
│   ├── core/           # Fonctionnalités principales et services
│   ├── extractors/     # Extracteurs de contenu spécifiques (future utilisation)
│   ├── models/         # Modèles de données
│   ├── services/       # Services (API, etc.)
│   ├── ui/             # Composants d'interface utilisateur
│   └── utils/          # Utilitaires et fonctions d'aide
├── content.js          # Script d'extraction de contenu Reddit
├── popup.js            # Script de l'interface popup
├── background.js       # Script de fond
├── manifest.json       # Configuration de l'extension
└── styles.css          # Styles CSS
```

## Fonctionnalités

- Extraction de commentaires Reddit
- Analyse des opinions et des tendances
- Visualisation des données avec des graphiques
- Détection des points de friction
- Résumé des discussions

## Développement

### Extraction de contenu

L'extension utilise plusieurs méthodes pour extraire les commentaires de Reddit, afin de s'adapter aux différentes versions de l'interface :

1. Extraction via les éléments `shreddit-comment`
2. Extraction via les éléments avec `slot="comment-content"`
3. Extraction via les éléments avec la classe `.Comment`
4. Extraction générique de texte (fallback)

### Visualisations

Les visualisations sont créées à l'aide de Chart.js et comprennent :

- Graphique en donut pour les clusters d'opinions
- Graphique en barres pour les points de friction
- Graphique en ligne pour les tendances temporelles

## Améliorations récentes

### Architecture et refactorisation
- Refactorisation du système de visualisation avec une architecture modulaire :
  - `chart-config.js` : Configuration globale des graphiques
  - `chart-types.js` : Implémentation des différents types de graphiques
  - `chart-legends.js` : Gestion des légendes personnalisées
  - `chart-data-utils.js` : Utilitaires pour manipuler les données
- Séparation des responsabilités avec des modules spécialisés
- Standardisation du style avec des fichiers CSS dédiés

### Interface utilisateur
- Sections rétractables/dépliables pour une meilleure organisation de l'interface
- Boutons "Tout plier" et "Tout déplier" pour contrôler toutes les sections à la fois
- Système de nettoyage évitant les doublons de boutons et d'écouteurs d'événements

### Visualisations améliorées
- Graphiques hiérarchiques (treemap et nested) avec système de coloration basé sur le sentiment
- Légendes interactives et informatives avec affichage du nombre de votes et du sentiment
- Étiquettes améliorées avec taille de police adaptée et couleur de texte contrastée
- Panneau de détails pour explorer les sous-opinions

### Stabilité et performance
- Meilleure gestion des valeurs undefined et des erreurs
- Correction des doubles déclarations de variables
- Optimisation des paramètres de Gemini pour des résultats déterministes et précis
- Amélioration de la robustesse face aux données manquantes ou mal formées

## Technologies utilisées

- JavaScript (ES6+)
- Chart.js pour les visualisations
- API Gemini pour l'analyse des opinions
- Chrome Extension API
