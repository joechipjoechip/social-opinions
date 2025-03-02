# Reddit Opinions

Extension Chrome qui analyse les opinions et les tendances dans les commentaires Reddit à l'aide de l'IA.

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

- Meilleure gestion des valeurs undefined
- Correction des doubles déclarations de variables
- Amélioration de la robustesse face aux données manquantes ou mal formées
- Refactorisation du code pour une meilleure organisation et maintenabilité
