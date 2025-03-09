/**
 * Module pour les visualisations hiérarchiques
 * Contient les fonctions pour créer des graphiques hiérarchiques (treemap et nested)
 */

import { formatNumber, truncateText } from '../utils/index.js';

/**
 * Transforme les données d'opinion clusters en format hiérarchique
 * @param {Array} opinionClusters - Clusters d'opinions
 * @returns {Object} - Données hiérarchiques formatées
 */
export function transformToHierarchicalData(opinionClusters) {
    if (!opinionClusters || !Array.isArray(opinionClusters) || opinionClusters.length === 0) {
        console.warn('Aucune donnée de clusters d\'opinions valide pour la transformation hiérarchique');
        return { name: 'Opinions', children: [] };
    }

    // Créer la structure de base
    const hierarchicalData = {
        name: 'Opinions',
        children: []
    };

    // Filtrer les clusters invalides
    const validClusters = opinionClusters.filter(cluster => 
        cluster && 
        typeof cluster === 'object' && 
        (cluster.opinion || cluster.name) && 
        (cluster.totalVotes > 0 || (cluster.votes && cluster.votes > 0))
    );

    if (validClusters.length === 0) {
        console.warn('Aucun cluster valide trouvé après filtrage');
        return hierarchicalData;
    }

    // Créer deux groupes principaux pour les opinions positives et négatives
    const positiveNode = {
        name: 'Opinions positives',
        value: 0,
        metadata: {
            sentiment: 'positif',
            score: 1,
            commentCount: 0
        },
        children: []
    };

    const negativeNode = {
        name: 'Opinions négatives',
        value: 0,
        metadata: {
            sentiment: 'négatif',
            score: -1,
            commentCount: 0
        },
        children: []
    };

    const neutralNode = {
        name: 'Opinions neutres',
        value: 0,
        metadata: {
            sentiment: 'neutre',
            score: 0,
            commentCount: 0
        },
        children: []
    };

    // Grouper par sentiment
    validClusters.forEach(cluster => {
        // Créer le nœud pour ce cluster
        const clusterNode = {
            name: cluster.opinion || cluster.name || 'Sans nom',
            value: cluster.totalVotes || cluster.votes || 0,
            metadata: {
                sentiment: cluster.sentiment || 'neutre',
                score: cluster.score || 0,
                commentCount: cluster.commentCount || 0
            },
            children: []
        };

        // Ajouter les sous-opinions si elles existent
        if (cluster.subOpinions && Array.isArray(cluster.subOpinions) && cluster.subOpinions.length > 0) {
            // Filtrer les sous-opinions invalides
            const validSubOpinions = cluster.subOpinions.filter(sub => 
                sub && typeof sub === 'object' && (sub.text || sub.opinion) && sub.votes > 0
            );
            
            validSubOpinions.forEach(subOpinion => {
                const subNode = {
                    name: subOpinion.text || subOpinion.opinion || 'Sous-opinion',
                    value: subOpinion.votes || 0,
                    metadata: {
                        sentiment: subOpinion.sentiment || cluster.sentiment || 'neutre',
                        score: subOpinion.score || 0
                    }
                };
                
                clusterNode.children.push(subNode);
            });
        }

        // Si pas de sous-opinions valides, ajouter un nœud enfant pour représenter le cluster lui-même
        if (clusterNode.children.length === 0) {
            clusterNode.children.push({
                name: 'Détails',
                value: clusterNode.value,
                metadata: {
                    sentiment: clusterNode.metadata.sentiment,
                    score: clusterNode.metadata.score
                }
            });
        }

        // Ajouter au nœud parent approprié selon le sentiment
        const sentiment = cluster.sentiment || 'neutre';
        if (sentiment === 'positif') {
            positiveNode.children.push(clusterNode);
            positiveNode.value += clusterNode.value;
            positiveNode.metadata.commentCount += clusterNode.metadata.commentCount || 0;
        } else if (sentiment === 'négatif') {
            negativeNode.children.push(clusterNode);
            negativeNode.value += clusterNode.value;
            negativeNode.metadata.commentCount += clusterNode.metadata.commentCount || 0;
        } else {
            neutralNode.children.push(clusterNode);
            neutralNode.value += clusterNode.value;
            neutralNode.metadata.commentCount += clusterNode.metadata.commentCount || 0;
        }
    });

    // Ajouter les nœuds principaux seulement s'ils ont des enfants
    if (positiveNode.children.length > 0) {
        hierarchicalData.children.push(positiveNode);
    }
    
    if (negativeNode.children.length > 0) {
        hierarchicalData.children.push(negativeNode);
    }
    
    if (neutralNode.children.length > 0) {
        hierarchicalData.children.push(neutralNode);
    }

    return hierarchicalData;
}

/**
 * Prépare les données pour un graphique treemap
 * @param {Object} hierarchicalData - Données hiérarchiques
 * @returns {Array} - Données formatées pour le treemap
 */
export function prepareTreemapData(hierarchicalData) {
    if (!hierarchicalData || !hierarchicalData.children || !Array.isArray(hierarchicalData.children)) {
        console.warn('Données hiérarchiques invalides pour le treemap');
        return [];
    }

    const treemapData = [];
    const processedGroups = new Set(); // Pour éviter les doublons
    
    // Ajouter les groupes principaux (opinions positives/négatives/neutres)
    hierarchicalData.children.forEach((mainCategory, categoryIndex) => {
        if (!mainCategory || !mainCategory.name || typeof mainCategory.value !== 'number' || mainCategory.value <= 0) {
            return; // Ignorer les catégories invalides
        }
        
        // Éviter les doublons
        if (processedGroups.has(mainCategory.name)) {
            return;
        }
        processedGroups.add(mainCategory.name);
        
        // Ajouter la catégorie principale (positif/négatif/neutre)
        treemapData.push({
            group: mainCategory.name,
            value: mainCategory.value,
            sentiment: mainCategory.metadata?.sentiment || 'neutre',
            score: mainCategory.metadata?.score || 0,
            commentCount: mainCategory.metadata?.commentCount || 0,
            level: 0
        });
        
        // Ajouter les opinions spécifiques dans chaque catégorie
        if (mainCategory.children && Array.isArray(mainCategory.children) && mainCategory.children.length > 0) {
            const processedOpinions = new Set(); // Pour éviter les doublons dans les opinions
            
            mainCategory.children.forEach((opinionGroup, opinionIndex) => {
                if (!opinionGroup || !opinionGroup.name || typeof opinionGroup.value !== 'number' || opinionGroup.value <= 0) {
                    return; // Ignorer les opinions invalides
                }
                
                // Éviter les doublons dans les opinions
                const opinionKey = `${mainCategory.name}:${opinionGroup.name}`;
                if (processedOpinions.has(opinionKey)) {
                    return;
                }
                processedOpinions.add(opinionKey);
                
                // Ajouter l'opinion spécifique
                treemapData.push({
                    group: opinionGroup.name,
                    parent: mainCategory.name,
                    value: opinionGroup.value,
                    sentiment: opinionGroup.metadata?.sentiment || mainCategory.metadata?.sentiment || 'neutre',
                    score: opinionGroup.metadata?.score || mainCategory.metadata?.score || 0,
                    commentCount: opinionGroup.metadata?.commentCount || 0,
                    level: 1
                });
                
                // Ajouter les sous-opinions si elles existent
                if (opinionGroup.children && Array.isArray(opinionGroup.children) && opinionGroup.children.length > 0) {
                    const processedSubOpinions = new Set(); // Pour éviter les doublons dans les sous-opinions
                    
                    opinionGroup.children.forEach((subOpinion, subIndex) => {
                        if (!subOpinion || !subOpinion.name || typeof subOpinion.value !== 'number' || subOpinion.value <= 0) {
                            return; // Ignorer les sous-opinions invalides
                        }
                        
                        // Éviter les doublons dans les sous-opinions
                        const subOpinionKey = `${mainCategory.name}:${opinionGroup.name}:${subOpinion.name}`;
                        if (processedSubOpinions.has(subOpinionKey)) {
                            return;
                        }
                        processedSubOpinions.add(subOpinionKey);
                        
                        // Ajouter la sous-opinion
                        treemapData.push({
                            group: subOpinion.name,
                            parent: opinionGroup.name,
                            grandparent: mainCategory.name,
                            value: subOpinion.value,
                            sentiment: subOpinion.metadata?.sentiment || opinionGroup.metadata?.sentiment || mainCategory.metadata?.sentiment || 'neutre',
                            score: subOpinion.metadata?.score || opinionGroup.metadata?.score || mainCategory.metadata?.score || 0,
                            level: 2
                        });
                    });
                }
            });
        }
    });
    
    return treemapData;
}

/**
 * Prépare les données pour un graphique imbriqué (nested)
 * @param {Object} hierarchicalData - Données hiérarchiques
 * @returns {Object} - Données formatées pour le graphique imbriqué
 */
export function prepareNestedData(hierarchicalData) {
    if (!hierarchicalData || !hierarchicalData.children) {
        return { datasets: [] };
    }
    
    // Transformer les données pour un graphique imbriqué (doughnut multi-niveau)
    const datasets = [];
    
    // Données pour le premier niveau (catégories principales: positif/négatif/neutre)
    const mainLabels = [];
    const mainValues = [];
    const mainColors = [];
    const mainHoverColors = [];
    const mainSentiments = [];
    
    // Données pour le deuxième niveau (opinions spécifiques dans chaque catégorie)
    const secondaryLabels = [];
    const secondaryValues = [];
    const secondaryColors = [];
    const secondaryHoverColors = [];
    const secondaryParents = [];
    const secondarySentiments = [];
    
    // Traiter les catégories principales (positif/négatif/neutre)
    hierarchicalData.children.forEach((mainCategory, categoryIndex) => {
        const categoryName = truncateText(mainCategory.name, 20);
        mainLabels.push(categoryName);
        mainValues.push(mainCategory.value);
        mainSentiments.push(mainCategory.metadata?.sentiment || 'neutre');
        
        // Déterminer la couleur de base pour cette catégorie
        let baseHue;
        const sentiment = mainCategory.metadata?.sentiment || 'neutre';
        switch(sentiment) {
            case 'positif': baseHue = 120; break; // Vert
            case 'négatif': baseHue = 0; break;   // Rouge
            default: baseHue = 200; break;        // Bleu pour neutre
        }
        
        // Ajouter une légère variation pour différencier les catégories de même sentiment
        const hueVariation = (categoryIndex * 10) % 30 - 15;
        const hue = (baseHue + hueVariation + 360) % 360;
        
        mainColors.push(`hsla(${hue}, 80%, 50%, 0.85)`);
        mainHoverColors.push(`hsla(${hue}, 80%, 45%, 0.95)`);
        
        // Traiter les opinions spécifiques dans cette catégorie
        if (mainCategory.children && Array.isArray(mainCategory.children)) {
            mainCategory.children.forEach((opinionGroup, opinionIndex) => {
                const opinionName = truncateText(opinionGroup.name, 20);
                secondaryLabels.push(opinionName);
                secondaryValues.push(opinionGroup.value);
                secondaryParents.push(categoryName);
                secondarySentiments.push(opinionGroup.metadata?.sentiment || sentiment);
                
                // Générer une couleur pour cette opinion spécifique
                // Utiliser la même teinte de base que la catégorie parente mais avec une variation
                const subHueVariation = (opinionIndex * 15) % 60 - 30;
                const subHue = (baseHue + subHueVariation + 360) % 360;
                
                // Ajuster la luminosité et la saturation pour créer une hiérarchie visuelle
                const saturation = 75 - (opinionIndex % 3) * 10;
                const lightness = 45 + (opinionIndex % 5) * 5;
                
                secondaryColors.push(`hsla(${subHue}, ${saturation}%, ${lightness}%, 0.85)`);
                secondaryHoverColors.push(`hsla(${subHue}, ${saturation}%, ${lightness - 5}%, 0.95)`);
            });
        }
    });
    
    // Dataset pour le premier niveau (catégories principales)
    datasets.push({
        data: mainValues,
        backgroundColor: mainColors,
        hoverBackgroundColor: mainHoverColors,
        labels: mainLabels,
        sentiments: mainSentiments
    });
    
    // Dataset pour le deuxième niveau (opinions spécifiques)
    datasets.push({
        data: secondaryValues,
        backgroundColor: secondaryColors,
        hoverBackgroundColor: secondaryHoverColors,
        labels: secondaryLabels,
        parents: secondaryParents,
        sentiments: secondarySentiments
    });
    
    return {
        datasets: datasets
    };
}

/**
 * Crée un graphique treemap pour visualiser les données hiérarchiques
 * @param {HTMLCanvasElement} ctx - Contexte du canvas
 * @param {HTMLElement} legendContainer - Conteneur pour la légende
 * @param {Array} opinionClusters - Clusters d'opinions
 * @param {Object} chartConfig - Configuration du graphique
 * @returns {Chart} - Instance du graphique
 */
export function createTreemapChart(ctx, legendContainer, opinionClusters, chartConfig) {
    if (!ctx || !opinionClusters || !Array.isArray(opinionClusters) || opinionClusters.length === 0) {
        console.error('Contexte ou données manquants pour le graphique treemap');
        return null;
    }
    
    // Transformer les données en format hiérarchique
    const hierarchicalData = transformToHierarchicalData(opinionClusters);
    const treemapData = prepareTreemapData(hierarchicalData);
    
    if (!treemapData || treemapData.length === 0) {
        console.warn('Aucune donnée valide pour le graphique treemap après transformation');
        return null;
    }
    
    // Options pour le treemap
    const options = {
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const item = context[0].raw;
                        if (!item) return '';
                        return item.parent ? `${item.parent} > ${item.group}` : item.group;
                    },
                    label: (context) => {
                        const item = context.raw || {};
                        const lines = [
                            `Votes: ${formatNumber(item.value || 0)}`,
                            `Sentiment: ${item.sentiment || 'neutre'}`
                        ];
                        
                        // Vérifier si score existe avant d'appeler toFixed
                        if (item.score !== undefined && item.score !== null) {
                            lines.push(`Score: ${Number(item.score).toFixed(1)}`);
                        } else {
                            lines.push(`Score: 0.0`);
                        }
                        
                        if (item.commentCount) {
                            lines.push(`Commentaires: ${item.commentCount}`);
                        }
                        return lines;
                    }
                }
            },
            legend: {
                display: false
            }
        }
    };
    
    // Créer le graphique
    const chart = new Chart(ctx, {
        type: 'treemap',
        data: {
            datasets: [{
                tree: treemapData,
                key: 'value',
                groups: ['level', 'group'],
                spacing: 2,
                borderWidth: 1,
                borderColor: '#fff',
                backgroundColor: (ctx) => {
                    const item = ctx.raw || {};
                    if (!item || !item.sentiment) {
                        return 'hsla(200, 80%, 50%, 0.8)'; // Bleu par défaut
                    }
                    
                    // Couleur principale basée sur le sentiment - respecter strictement les couleurs spécifiées
                    let baseHue;
                    switch(item.sentiment.toLowerCase()) {
                        case 'positif': baseHue = 120; break; // Vert
                        case 'négatif': baseHue = 0; break;   // Rouge
                        default: baseHue = 200; break;        // Bleu pour neutre
                    }
                    
                    // Variation de teinte basée sur le groupe pour différencier les rectangles
                    // Utiliser le hashCode du nom du groupe pour générer une variation unique
                    const getHashCode = (str) => {
                        if (!str || typeof str !== 'string') return 0;
                        let hash = 0;
                        for (let i = 0; i <str.length; i++) {
                            hash = ((hash << 5) - hash) + str.charCodeAt(i);
                            hash |= 0; // Convertir en entier 32 bits
                        }
                        return Math.abs(hash);
                    };
                    
                    // Ajouter une variation de teinte basée sur le nom du groupe
                    const groupHash = getHashCode(item.group || '');
                    const hueVariation = (groupHash % 60) - 30; // Variation de -30 à +30
                    const hue = (baseHue + hueVariation + 360) % 360;
                    
                    // Ajuster la saturation et la luminosité en fonction du niveau
                    const saturation = item.level === 0 ? 80 : 65;
                    const lightness = item.level === 0 ? 45 : 60;
                    const alpha = item.level === 0 ? 0.9 : 0.8;
                    
                    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                },
                hoverBackgroundColor: (ctx) => {
                    const item = ctx.raw || {};
                    if (!item || !item.sentiment) {
                        return 'hsla(200, 90%, 45%, 1.0)'; // Bleu par défaut au survol
                    }
                    
                    // Utiliser la même logique que backgroundColor mais avec plus de saturation et moins de luminosité
                    let baseHue;
                    switch(item.sentiment.toLowerCase()) {
                        case 'positif': baseHue = 120; break;
                        case 'négatif': baseHue = 0; break;
                        default: baseHue = 200; break;
                    }
                    
                    // Ajouter une variation basée sur l'index pour différencier les groupes
                    const getHashCode = (str) => {
                        if (!str || typeof str !== 'string') return 0;
                        let hash = 0;
                        for (let i = 0; i < str.length; i++) {
                            hash = ((hash << 5) - hash) + str.charCodeAt(i);
                            hash |= 0;
                        }
                        return Math.abs(hash);
                    };
                    
                    const groupHash = getHashCode(item.group || '');
                    const hueVariation = (groupHash % 60) - 30;
                    const hue = (baseHue + hueVariation + 360) % 360;
                    
                    // Plus saturé et plus sombre au survol
                    const saturation = item.level === 0 ? 90 : 75;
                    const lightness = item.level === 0 ? 40 : 55;
                    const alpha = 1.0; // Opacité complète au survol
                    
                    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                },
                captions: {
                    display: true,
                    align: 'center',
                    font: {
                        weight: 'bold',
                        size: (ctx) => {
                            const item = ctx.raw || {};
                            return item.level === 0 ? 14 : 12;
                        }
                    },
                    color: (ctx) => {
                        const item = ctx.raw || {};
                        // Utiliser une couleur de texte contrastée en fonction de la luminosité du fond
                        let lightness = 50;
                        
                        if (item && item.sentiment) {
                            // Estimer la luminosité en fonction du sentiment et du niveau
                            switch(item.sentiment.toLowerCase()) {
                                case 'positif': lightness = item.level === 0 ? 45 : 60; break;
                                case 'négatif': lightness = item.level === 0 ? 45 : 60; break;
                                default: lightness = item.level === 0 ? 45 : 60; break;
                            }
                        }
                        
                        return lightness > 50 ? '#333' : '#fff';
                    },
                    formatter: (ctx) => {
                        const item = ctx.raw || {};
                        if (!item || !item.group) return '';
                        
                        // Tronquer le texte en fonction de la taille du rectangle
                        const maxLength = item.level === 0 ? 18 : 14;
                        const text = item.group || '';
                        let displayText = '';
                        
                        if (text.length <= maxLength) {
                            displayText = text;
                        } else {
                            // Si le texte est trop long, le tronquer avec des points de suspension
                            displayText = text.substring(0, maxLength - 3) + '...';
                        }
                        
                        // Ajouter le nombre de votes pour les éléments de niveau 0 (principaux)
                        if (item.level === 0 && item.value) {
                            displayText += `\n(${formatNumber(item.value)})`;
                        }
                        
                        return displayText;
                    }
                }
            }]
        },
        options: options
    });
    
    // Créer la légende personnalisée
    if (legendContainer) {
        createTreemapLegend(chart, legendContainer, treemapData);
    }
    
    return chart;
}

/**
 * Crée un graphique imbriqué (nested) pour visualiser les données hiérarchiques
 * @param {HTMLCanvasElement} ctx - Contexte du canvas
 * @param {HTMLElement} legendContainer - Conteneur pour la légende
 * @param {Array} opinionClusters - Clusters d'opinions
 * @param {Object} chartConfig - Configuration du graphique
 * @returns {Chart} - Instance du graphique
 */
export function createNestedChart(ctx, legendContainer, opinionClusters, chartConfig) {
    if (!ctx || !opinionClusters) {
        console.warn('Contexte ou données manquants pour le graphique imbriqué');
        return null;
    }
    
    // Transformer les données en format hiérarchique
    const hierarchicalData = transformToHierarchicalData(opinionClusters);
    
    // Préparer les données pour le graphique imbriqué
    const nestedData = prepareNestedData(hierarchicalData);
    
    // Vérifier que nous avons des données valides
    if (!nestedData.datasets || nestedData.datasets.length === 0 || 
        !nestedData.datasets[0].data || nestedData.datasets[0].data.length === 0) {
        console.warn('Données insuffisantes pour créer un graphique imbriqué');
        return null;
    }
    
    // Configuration du graphique
    const config = {
        type: 'doughnut',
        data: {
            datasets: nestedData.datasets.map((dataset, index) => {
                // Calculer le rayon pour chaque niveau
                const radius = index === 0 ? '70%' : '90%';
                const innerRadius = index === 0 ? '40%' : '71%';
                
                return {
                    ...dataset,
                    weight: index === 0 ? 1.2 : 1,
                    radius: radius,
                    innerRadius: innerRadius,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 10
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '40%',
            layout: {
                padding: 20
            },
            plugins: {
                legend: {
                    display: false // Nous utiliserons une légende personnalisée
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            const datasetIndex = context.datasetIndex;
                            const index = context.dataIndex;
                            const dataset = nestedData.datasets[datasetIndex];
                            
                            let label = dataset.labels[index] || '';
                            const value = context.raw || 0;
                            
                            // Ajouter le parent si disponible (pour le niveau 2)
                            if (datasetIndex === 1 && dataset.parents && dataset.parents[index]) {
                                label = `${dataset.parents[index]} > ${label}`;
                            }
                            
                            // Ajouter le sentiment
                            const sentiment = dataset.sentiments && dataset.sentiments[index] || 'neutre';
                            
                            return `${label}: ${formatNumber(value)} votes (${sentiment})`;
                        }
                    }
                }
            }
        }
    };
    
    // Créer le graphique
    const chart = new Chart(ctx, config);
    
    // Créer une légende personnalisée
    if (legendContainer) {
        createNestedLegend(chart, legendContainer, nestedData);
    }
    
    return chart;
}

/**
 * Crée une légende personnalisée pour le graphique treemap
 * @param {Chart} chart - Instance du graphique
 * @param {HTMLElement} container - Conteneur pour la légende
 * @param {Array} data - Données du treemap
 */
function createTreemapLegend(chart, container, data) {
    if (!container || !data || !Array.isArray(data) || data.length === 0) {
        console.warn('Données ou conteneur manquants pour la légende du treemap');
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Ajouter un titre à la légende
    const legendTitle = document.createElement('div');
    legendTitle.className = 'legend-title';
    legendTitle.textContent = 'Opinions principales';
    container.appendChild(legendTitle);
    
    // Ajouter une explication des couleurs
    const colorExplanation = document.createElement('div');
    colorExplanation.className = 'legend-explanation';
    colorExplanation.innerHTML = '<span style="color: hsl(120, 70%, 50%);">■</span> Positif &nbsp; ' +
                                '<span style="color: hsl(0, 70%, 50%);">■</span> Négatif &nbsp; ' +
                                '<span style="color: hsl(200, 70%, 50%);">■</span> Neutre';
    container.appendChild(colorExplanation);
    
    // Créer un conteneur pour les éléments de légende
    const legendItems = document.createElement('div');
    legendItems.className = 'legend-items';
    container.appendChild(legendItems);
    
    // Collecter les informations de tous les datasets pour une meilleure organisation
    const allItems = [];
    
    data.datasets.forEach((dataset, datasetIndex) => {
        const sentiment = dataset.sentiment || 'neutre';
        const score = dataset.score || 0;
        
        // Pour chaque élément dans ce dataset
        dataset.data.forEach((value, index) => {
            if (index < data.labels.length) {
                allItems.push({
                    label: data.labels[index],
                    value: value,
                    sentiment: sentiment,
                    score: score,
                    backgroundColor: dataset.backgroundColor[index],
                    datasetIndex: datasetIndex,
                    index: index
                });
            }
        });
    });
    
    // Trier par valeur décroissante
    allItems.sort((a, b) => b.value - a.value);
    
    // Créer un élément de légende pour chaque élément
    allItems.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'legend-color';
        colorDiv.style.backgroundColor = item.backgroundColor;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'legend-text';
        
        // Ajouter le label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'legend-label';
        labelSpan.textContent = truncateText(item.label, 25);
        
        // Ajouter les informations (votes et pourcentage)
        const value = item.value;
        const percentage = item.value / chart.data.datasets[item.datasetIndex].data.reduce((sum, val) => sum + val, 0) * 100;
        
        const infoSpan = document.createElement('span');
        infoSpan.className = 'legend-info';
        infoSpan.textContent = `${formatNumber(value)} votes (${percentage.toFixed(2)}%)`;
        
        // Ajouter le sentiment
        const sentiment = item.sentiment || 'neutre';
        const sentimentSpan = document.createElement('span');
        sentimentSpan.className = `legend-sentiment sentiment-${sentiment}`;
        sentimentSpan.textContent = sentiment;
        
        textDiv.appendChild(labelSpan);
        textDiv.appendChild(infoSpan);
        textDiv.appendChild(sentimentSpan);
        
        legendItem.appendChild(colorDiv);
        legendItem.appendChild(textDiv);
        
        // Ajouter un événement de survol pour mettre en évidence l'élément correspondant
        legendItem.addEventListener('mouseover', () => {
            legendItem.classList.add('highlight');
            
            // Mettre en évidence le segment correspondant dans le graphique
            chart.setActiveElements([{
                datasetIndex: item.datasetIndex,
                index: item.index
            }]);
            
            chart.update();
        });
        
        legendItem.addEventListener('mouseout', () => {
            legendItem.classList.remove('highlight');
            chart.setActiveElements([]);
            chart.update();
        });
        
        // Ajouter un événement de clic pour afficher plus de détails
        legendItem.addEventListener('click', () => {
            // Créer ou mettre à jour un panneau de détails
            let detailsPanel = document.getElementById('treemap-details-panel');
            if (!detailsPanel) {
                detailsPanel = document.createElement('div');
                detailsPanel.id = 'treemap-details-panel';
                detailsPanel.className = 'treemap-details-panel';
                container.parentNode.appendChild(detailsPanel);
            }
            
            // Remplir le panneau avec les détails
            detailsPanel.innerHTML = `
                <div class="details-header">
                    <h3>${item.label}</h3>
                    <span class="close-button">&times;</span>
                </div>
                <div class="details-content">
                    <p>
                        <strong>Votes:</strong> ${formatNumber(item.value)}<br>
                        <strong>Sentiment:</strong> ${item.sentiment}<br>
                        <strong>Score:</strong> ${item.score.toFixed(2)}
                    </p>
                    <div class="details-chart-container">
                        <canvas id="details-mini-chart" width="300" height="150"></canvas>
                    </div>
                </div>
            `;
            
            // Afficher le panneau
            detailsPanel.style.display = 'block';
            
            // Ajouter un gestionnaire d'événements pour fermer le panneau
            detailsPanel.querySelector('.close-button').addEventListener('click', () => {
                detailsPanel.style.display = 'none';
            });
            
            // Créer un mini-graphique pour visualiser les données de cet élément
            const miniChartCtx = document.getElementById('details-mini-chart');
            if (miniChartCtx) {
                new Chart(miniChartCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Votes'],
                        datasets: [{
                            label: item.label,
                            data: [item.value],
                            backgroundColor: item.backgroundColor,
                            borderColor: 'white',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            },
                            tooltip: {
                                enabled: true
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        });
        
        legendItems.appendChild(legendItem);
    });
}

/**
 * Crée une légende personnalisée pour le graphique imbriqué
 * @param {Chart} chart - Instance du graphique
 * @param {HTMLElement} container - Conteneur pour la légende
 * @param {Object} data - Données du graphique imbriqué
 */
export function createNestedLegend(chart, container, data) {
    if (!chart || !container || !data || !data.datasets || data.datasets.length === 0) {
        console.warn('Données insuffisantes pour créer la légende du graphique imbriqué');
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer un titre pour la légende
    const legendTitle = document.createElement('h3');
    legendTitle.textContent = 'Répartition des opinions';
    legendTitle.className = 'legend-title';
    container.appendChild(legendTitle);
    
    // Créer une description pour la légende
    const legendDescription = document.createElement('p');
    legendDescription.textContent = 'Cliquez sur une catégorie pour voir les détails des opinions';
    legendDescription.className = 'legend-description';
    container.appendChild(legendDescription);
    
    // Créer un conteneur pour les éléments de la légende
    const legendItems = document.createElement('div');
    legendItems.className = 'nested-legend-items';
    container.appendChild(legendItems);
    
    // Créer les éléments de légende pour le premier niveau (catégories principales)
    const mainDataset = data.datasets[0];
    const mainLabels = mainDataset.labels || [];
    const mainValues = mainDataset.data || [];
    const mainColors = mainDataset.backgroundColor || [];
    const mainSentiments = mainDataset.sentiments || [];
    
    // Créer un conteneur pour les catégories principales
    const mainCategoriesContainer = document.createElement('div');
    mainCategoriesContainer.className = 'main-categories-container';
    legendItems.appendChild(mainCategoriesContainer);
    
    // Titre pour les catégories principales
    const mainCategoriesTitle = document.createElement('h4');
    mainCategoriesTitle.textContent = 'Catégories principales';
    mainCategoriesTitle.className = 'category-title';
    mainCategoriesContainer.appendChild(mainCategoriesTitle);
    
    // Calculer le total des votes pour les pourcentages
    const totalVotes = mainValues.reduce((sum, value) => sum + value, 0);
    
    // Créer les éléments de légende pour chaque catégorie principale
    mainLabels.forEach((label, index) => {
        const item = document.createElement('div');
        item.className = 'legend-item main-category';
        item.dataset.index = index;
        item.dataset.level = 0;
        
        // Créer l'indicateur de couleur
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'color-indicator';
        colorIndicator.style.backgroundColor = mainColors[index];
        item.appendChild(colorIndicator);
        
        // Créer le conteneur de texte
        const textContainer = document.createElement('div');
        textContainer.className = 'legend-text';
        
        // Ajouter le label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'legend-label';
        labelSpan.textContent = label;
        textContainer.appendChild(labelSpan);
        
        // Ajouter les informations (votes et pourcentage)
        const value = mainValues[index];
        const percentage = totalVotes > 0 ? Math.round((value / totalVotes) * 100) : 0;
        
        const infoSpan = document.createElement('span');
        infoSpan.className = 'legend-info';
        infoSpan.textContent = `${formatNumber(value)} votes (${percentage}%)`;
        textContainer.appendChild(infoSpan);
        
        // Ajouter le sentiment
        const sentiment = mainSentiments[index] || 'neutre';
        const sentimentSpan = document.createElement('span');
        sentimentSpan.className = `legend-sentiment sentiment-${sentiment}`;
        sentimentSpan.textContent = sentiment;
        textContainer.appendChild(sentimentSpan);
        
        item.appendChild(textContainer);
        
        // Ajouter un indicateur d'expansion
        const expandIndicator = document.createElement('span');
        expandIndicator.className = 'expand-indicator';
        expandIndicator.textContent = '+';
        item.appendChild(expandIndicator);
        
        // Ajouter l'élément à la légende
        mainCategoriesContainer.appendChild(item);
        
        // Créer un conteneur pour les sous-opinions de cette catégorie
        const subOpinionsContainer = document.createElement('div');
        subOpinionsContainer.className = 'sub-opinions-container hidden';
        subOpinionsContainer.dataset.parentIndex = index;
        mainCategoriesContainer.appendChild(subOpinionsContainer);
        
        // Ajouter un gestionnaire d'événement pour l'expansion/réduction
        item.addEventListener('click', () => {
            // Basculer la visibilité du conteneur de sous-opinions
            const isHidden = subOpinionsContainer.classList.contains('hidden');
            
            // Cacher tous les conteneurs de sous-opinions
            const allSubContainers = mainCategoriesContainer.querySelectorAll('.sub-opinions-container');
            allSubContainers.forEach(container => container.classList.add('hidden'));
            
            // Réinitialiser tous les indicateurs d'expansion
            const allExpandIndicators = mainCategoriesContainer.querySelectorAll('.expand-indicator');
            allExpandIndicators.forEach(indicator => indicator.textContent = '+');
            
            // Si le conteneur était caché, l'afficher et mettre à jour l'indicateur
            if (isHidden) {
                subOpinionsContainer.classList.remove('hidden');
                expandIndicator.textContent = '-';
                
                // Remplir le conteneur de sous-opinions si ce n'est pas déjà fait
                if (subOpinionsContainer.children.length === 0) {
                    // Récupérer les sous-opinions pour cette catégorie
                    const secondaryDataset = data.datasets[1];
                    const secondaryLabels = secondaryDataset.labels || [];
                    const secondaryValues = secondaryDataset.data || [];
                    const secondaryColors = secondaryDataset.backgroundColor || [];
                    const secondaryParents = secondaryDataset.parents || [];
                    const secondarySentiments = secondaryDataset.sentiments || [];
                    
                    // Titre pour les sous-opinions
                    const subOpinionsTitle = document.createElement('h5');
                    subOpinionsTitle.textContent = `Opinions dans "${label}"`;
                    subOpinionsTitle.className = 'sub-category-title';
                    subOpinionsContainer.appendChild(subOpinionsTitle);
                    
                    // Filtrer les sous-opinions qui appartiennent à cette catégorie
                    const categorySubOpinions = secondaryLabels
                        .map((subLabel, subIndex) => ({
                            label: subLabel,
                            value: secondaryValues[subIndex],
                            color: secondaryColors[subIndex],
                            parent: secondaryParents[subIndex],
                            sentiment: secondarySentiments[subIndex],
                            index: subIndex
                        }))
                        .filter(subOpinion => subOpinion.parent === label);
                    
                    // Trier par valeur décroissante
                    categorySubOpinions.sort((a, b) => b.value - a.value);
                    
                    // Créer les éléments de légende pour chaque sous-opinion
                    categorySubOpinions.forEach(subOpinion => {
                        const subItem = document.createElement('div');
                        subItem.className = 'legend-item sub-opinion';
                        subItem.dataset.index = subOpinion.index;
                        subItem.dataset.level = 1;
                        
                        // Créer l'indicateur de couleur
                        const subColorIndicator = document.createElement('span');
                        subColorIndicator.className = 'color-indicator';
                        subColorIndicator.style.backgroundColor = subOpinion.color;
                        subItem.appendChild(subColorIndicator);
                        
                        // Créer le conteneur de texte
                        const subTextContainer = document.createElement('div');
                        subTextContainer.className = 'legend-text';
                        
                        // Ajouter le label
                        const subLabelSpan = document.createElement('span');
                        subLabelSpan.className = 'legend-label';
                        subLabelSpan.textContent = subOpinion.label;
                        subTextContainer.appendChild(subLabelSpan);
                        
                        // Ajouter les informations (votes et pourcentage)
                        const subValue = subOpinion.value;
                        const subPercentage = value > 0 ? Math.round((subValue / value) * 100) : 0;
                        
                        const subInfoSpan = document.createElement('span');
                        subInfoSpan.className = 'legend-info';
                        subInfoSpan.textContent = `${formatNumber(subValue)} votes (${subPercentage}% de la catégorie)`;
                        subTextContainer.appendChild(subInfoSpan);
                        
                        // Ajouter le sentiment
                        const subSentiment = subOpinion.sentiment || 'neutre';
                        const subSentimentSpan = document.createElement('span');
                        subSentimentSpan.className = `legend-sentiment sentiment-${subSentiment}`;
                        subSentimentSpan.textContent = subSentiment;
                        subTextContainer.appendChild(subSentimentSpan);
                        
                        subItem.appendChild(subTextContainer);
                        
                        // Ajouter l'élément à la légende
                        subOpinionsContainer.appendChild(subItem);
                    });
                    
                    // Message si aucune sous-opinion
                    if (categorySubOpinions.length === 0) {
                        const noSubOpinionsMsg = document.createElement('p');
                        noSubOpinionsMsg.className = 'no-sub-opinions';
                        noSubOpinionsMsg.textContent = 'Aucune sous-opinion disponible pour cette catégorie';
                        subOpinionsContainer.appendChild(noSubOpinionsMsg);
                    }
                }
            }
        });
    });
    
    // Ajouter des styles CSS pour la légende
    const style = document.createElement('style');
    style.textContent = `
        .nested-legend-items {
            margin-top: 15px;
            max-height: 400px;
            overflow-y: auto;
        }
        .legend-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin: 5px 0;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .legend-item:hover {
            background-color: rgba(0, 0, 0, 0.05);
        }
        .main-category {
            font-weight: bold;
            background-color: rgba(0, 0, 0, 0.03);
        }
        .sub-opinion {
            margin-left: 20px;
            font-size: 0.95em;
        }
        .color-indicator {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 10px;
            flex-shrink: 0;
        }
        .legend-text {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        .legend-label {
            font-weight: 500;
        }
        .legend-info {
            font-size: 0.85em;
            color: #666;
        }
        .legend-sentiment {
            font-size: 0.8em;
            padding: 2px 6px;
            border-radius: 10px;
            display: inline-block;
            margin-top: 3px;
            width: fit-content;
        }
        .sentiment-positif {
            background-color: rgba(0, 200, 0, 0.15);
            color: #007700;
        }
        .sentiment-négatif {
            background-color: rgba(200, 0, 0, 0.15);
            color: #770000;
        }
        .sentiment-neutre {
            background-color: rgba(0, 0, 200, 0.15);
            color: #000077;
        }
        .expand-indicator {
            margin-left: 10px;
            font-weight: bold;
            color: #666;
            font-size: 1.2em;
        }
        .sub-opinions-container {
            margin-left: 15px;
            padding-left: 10px;
            border-left: 2px solid #eee;
            transition: max-height 0.3s ease-out;
            overflow: hidden;
        }
        .sub-opinions-container.hidden {
            display: none;
        }
        .sub-category-title {
            font-size: 0.9em;
            margin: 10px 0 5px;
            color: #555;
        }
        .no-sub-opinions {
            font-style: italic;
            color: #999;
            font-size: 0.9em;
            margin: 10px 0;
        }
    `;
    container.appendChild(style);
}
