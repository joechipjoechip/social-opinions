export class Visualizations {
    constructor() {
        this.colors = {
            primary: '#FF4500',
            secondary: '#0079D3',
            background: ['rgba(255, 69, 0, 0.8)', 'rgba(0, 121, 211, 0.8)'],
            text: '#333333',
            agreement: {
                low: '#ff4d4d',
                medium: '#ffeb3b',
                high: '#4caf50'
            }
        };

        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        Chart.defaults.color = this.colors.text;

        // Configuration par défaut des graphiques
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        };
    }

    getAgreementColor(level) {
        if (level < 0.4) return this.colors.agreement.low;
        if (level < 0.7) return this.colors.agreement.medium;
        return this.colors.agreement.high;
    }

    createOpinionClusterChart(data) {
        if (!data?.opinionClusters?.length) return;

        const ctx = document.getElementById('sentimentChart').getContext('2d');
        
        // Calculer la hauteur nécessaire en fonction du nombre d'opinions
        const minHeight = 400;
        const heightPerItem = 60;
        const totalHeight = Math.max(minHeight, data.opinionClusters.length * heightPerItem);
        ctx.canvas.parentNode.style.height = `${totalHeight}px`;

        // Trier les données par nombre de votes décroissant
        const sortedData = [...data.opinionClusters].sort((a, b) => b.totalVotes - a.totalVotes);
        
        const chartData = {
            labels: sortedData.map(d => d.opinion),
            datasets: [{
                data: sortedData.map(d => d.totalVotes),
                backgroundColor: this.colors.primary,
                barThickness: 20,
                minBarLength: 4
            }]
        };

        const options = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: (tooltipItems) => {
                            const opinion = sortedData[tooltipItems[0].dataIndex].opinion;
                            return opinion;
                        },
                        label: (context) => {
                            return `${context.raw} votes`;
                        },
                        afterBody: (tooltipItems) => {
                            const opinion = sortedData[tooltipItems[0].dataIndex];
                            return [`Exemple: ${opinion.representativeComment}`];
                        }
                    }
                }
            },
            
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 12,
                        font: {
                            size: 13
                        },
                        // Formater les labels pour qu'ils tiennent dans l'espace disponible
                        callback: function(value, index) {
                            // S'assurer que nous avons une chaîne de caractères
                            const text = String(sortedData[index].opinion);
                            const maxWidth = 250; // Largeur maximale en pixels
                            const ctx = this.chart.ctx;
                            ctx.font = '13px ' + Chart.defaults.font.family;
                            
                            const words = text.split(' ');
                            const lines = [];
                            let currentLine = words[0];
                            
                            for (let i = 1; i < words.length; i++) {
                                const word = words[i];
                                const width = ctx.measureText(currentLine + ' ' + word).width;
                                
                                if (width < maxWidth) {
                                    currentLine += ' ' + word;
                                } else {
                                    lines.push(currentLine);
                                    currentLine = word;
                                }
                            }
                            lines.push(currentLine);
                            
                            return lines;
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Nombre de votes',
                        font: {
                            size: 14,
                            weight: '500'
                        },
                        padding: {
                            top: 16
                        }
                    }
                }
            },
            
            layout: {
                padding: {
                    left: 16,
                    right: 24,
                    top: 16,
                    bottom: 16
                }
            }
        };

        if (this.opinionChart) {
            this.opinionChart.destroy();
        }

        this.opinionChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options
        });
    }

    createConsensusChart(data) {
        if (!data?.consensusPoints?.length) return;

        const ctx = document.getElementById('topicsChart').getContext('2d');
        
        const chartData = {
            labels: data.consensusPoints.map(d => ''), // Labels vides car on les affiche avec datalabels
            datasets: [{
                data: data.consensusPoints.map(d => d.totalVotes),
                backgroundColor: data.consensusPoints.map(d => 
                    this.getAgreementColor(d.agreementLevel)
                ),
                borderColor: 'white',
                borderWidth: 2
            }]
        };

        const options = {
            ...this.defaultOptions,
            cutout: '60%',
            layout: {
                padding: {
                    top: 50 // Espace pour les labels
                }
            },
            plugins: {
                ...this.defaultOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const point = data.consensusPoints[context.dataIndex];
                            return [
                                `Sujet: ${point.topic}`,
                                `${context.raw} votes`,
                                `Niveau d'accord: ${Math.round(point.agreementLevel * 100)}%`,
                                `Position consensuelle: ${point.consensusStance}`
                            ];
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: this.colors.text,
                    font: {
                        weight: 'bold',
                        size: 12
                    },
                    formatter: (value, context) => {
                        const point = data.consensusPoints[context.dataIndex];
                        return [
                            point.topic,
                            `${Math.round(point.agreementLevel * 100)}% d'accord`
                        ];
                    },
                    textAlign: 'center',
                    anchor: 'end',
                    offset: 10,
                    align: 'top'
                },
                legend: {
                    display: false // Cacher la légende car nous avons les labels
                }
            }
        };

        if (this.consensusChart) {
            this.consensusChart.destroy();
        }
        this.consensusChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: options,
            plugins: [ChartDataLabels]
        });
    }

    createScoresChart(data) {
        if (!data?.frictionPoints?.length) return;

        const ctx = document.getElementById('scoresChart').getContext('2d');
        ctx.canvas.parentNode.style.height = '300px';

        // Fonction utilitaire pour diviser le texte
        const splitText = (text, maxWidth, ctx) => {
            const safeText = String(text || '').trim();
            if (!safeText) return [''];
            
            const words = safeText.split(' ');
            const lines = [];
            let currentLine = words[0];
            
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + ' ' + word).width;
                
                if (width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            
            return lines;
        };

        // Préparer les données en s'assurant qu'elles sont valides
        const validPoints = data.frictionPoints.filter(point => {
            return point && 
                   point.opinion1?.stance && 
                   point.opinion2?.stance && 
                   typeof point.opinion1?.votes === 'number' &&
                   typeof point.opinion2?.votes === 'number';
        });

        if (!validPoints.length) return;

        const chartData = {
            labels: validPoints.map(point => [point.opinion1.stance, point.opinion2.stance]),
            datasets: [
                {
                    label: 'Position 1',
                    data: validPoints.map(point => -point.opinion1.votes),
                    backgroundColor: this.colors.primary,
                    borderWidth: 0,
                    barPercentage: 0.8
                },
                {
                    label: 'Position 2',
                    data: validPoints.map(point => point.opinion2.votes),
                    backgroundColor: this.colors.secondary,
                    borderWidth: 0,
                    barPercentage: 0.8
                }
            ]
        };

        const options = {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'start',
                    labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 13
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        title: (tooltipItems) => {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const point = validPoints[dataIndex];
                            return tooltipItems[0].dataset.label === 'Position 1' 
                                ? point.opinion1.stance
                                : point.opinion2.stance;
                        },
                        label: (context) => {
                            return `${Math.abs(context.raw)} votes`;
                        },
                        afterBody: (tooltipItems) => {
                            const dataIndex = tooltipItems[0].dataIndex;
                            const point = validPoints[dataIndex];
                            const keyArgs = tooltipItems[0].dataset.label === 'Position 1'
                                ? point.opinion1.keyArguments || []
                                : point.opinion2.keyArguments || [];
                            
                            if (keyArgs.length > 0) {
                                return ['Arguments clés:', ...keyArgs];
                            }
                            return [];
                        }
                    }
                }
            },
            
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: value => Math.abs(value),
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Nombre de votes',
                        font: {
                            size: 14,
                            weight: '500'
                        },
                        padding: {
                            top: 16
                        }
                    }
                },
                y: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        padding: 12,
                        font: {
                            size: 13
                        },
                        callback: function(value, index) {
                            if (!validPoints[index]) return '';
                            
                            const point = validPoints[index];
                            const maxWidth = 200;
                            const ctx = this.chart.ctx;
                            ctx.font = '13px ' + Chart.defaults.font.family;
                            
                            const opinion1Lines = splitText(point.opinion1.stance, maxWidth, ctx);
                            const opinion2Lines = splitText(point.opinion2.stance, maxWidth, ctx);
                            
                            // Ajouter le sujet comme titre
                            const topicLines = point.topic ? splitText(point.topic, maxWidth, ctx) : [];
                            
                            return [...topicLines, ...opinion1Lines, 'vs', ...opinion2Lines];
                        }
                    }
                }
            },
            
            layout: {
                padding: {
                    left: 24,
                    right: 24,
                    top: 20,
                    bottom: 16
                }
            }
        };

        if (this.scoresChart) {
            this.scoresChart.destroy();
        }

        this.scoresChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }
}
