/**
 * Données de test pour le développement de l'interface utilisateur
 * Ces données simulent le format de réponse de l'API Gemini
 */
const TEST_DATA = {
    overview: {
        totalComments: 1243,
        mainOpinion: "La reconversion est positive pour l'économie et les individus",
        averageSentiment: 0.65
    },
    opinionClusters: [
        {
            opinion: "La reconversion est positive pour l'économie et les individus",
            totalVotes: 458,
            percentageOfTotal: 36.8
        },
        {
            opinion: "Le marché du travail est trop rigide pour les reconversions",
            totalVotes: 312,
            percentageOfTotal: 25.1
        },
        {
            opinion: "L'école 42 est une bonne alternative aux formations traditionnelles",
            totalVotes: 187,
            percentageOfTotal: 15.0
        },
        {
            opinion: "La reconversion est possible mais difficile après 40 ans",
            totalVotes: 142,
            percentageOfTotal: 11.4
        },
        {
            opinion: "Les formations en ligne sont insuffisantes pour une vraie reconversion",
            totalVotes: 89,
            percentageOfTotal: 7.2
        },
        {
            opinion: "Le gouvernement devrait mieux soutenir les personnes en reconversion",
            totalVotes: 55,
            percentageOfTotal: 4.5
        }
    ],
    consensusPoints: [
        {
            topic: "Importance de la formation continue",
            consensusPercentage: 87,
            totalMentions: 342,
            agreementLevel: 0.87
        },
        {
            topic: "Nécessité d'acquérir de nouvelles compétences",
            consensusPercentage: 82,
            totalMentions: 278,
            agreementLevel: 0.82
        },
        {
            topic: "Valeur de l'expérience pratique",
            consensusPercentage: 76,
            totalMentions: 203,
            agreementLevel: 0.76
        },
        {
            topic: "Importance du réseau professionnel",
            consensusPercentage: 71,
            totalMentions: 187,
            agreementLevel: 0.71
        },
        {
            topic: "Adaptation aux nouvelles technologies",
            consensusPercentage: 68,
            totalMentions: 154,
            agreementLevel: 0.68
        }
    ],
    frictionPoints: [
        {
            topic: "Âge et reconversion professionnelle",
            intensityScore: 8.7,
            opinion1: {
                text: "La reconversion est possible à tout âge",
                votes: 245
            },
            opinion2: {
                text: "Après 40 ans, la reconversion est très difficile",
                votes: 198
            }
        },
        {
            topic: "Formations en ligne vs présentielles",
            intensityScore: 7.9,
            opinion1: {
                text: "Les formations en ligne sont suffisantes",
                votes: 176
            },
            opinion2: {
                text: "Les formations présentielles sont indispensables",
                votes: 203
            }
        },
        {
            topic: "Rôle de l'État dans la reconversion",
            intensityScore: 7.5,
            opinion1: {
                text: "L'État devrait financer davantage les reconversions",
                votes: 187
            },
            opinion2: {
                text: "La reconversion est une responsabilité individuelle",
                votes: 165
            }
        },
        {
            topic: "Valeur des diplômes vs compétences",
            intensityScore: 6.8,
            opinion1: {
                text: "Les compétences pratiques sont plus importantes que les diplômes",
                votes: 234
            },
            opinion2: {
                text: "Les diplômes restent essentiels pour la crédibilité",
                votes: 143
            }
        },
        {
            topic: "Durée idéale d'une reconversion",
            intensityScore: 5.4,
            opinion1: {
                text: "Une reconversion rapide (< 1 an) est préférable",
                votes: 156
            },
            opinion2: {
                text: "Une reconversion de qualité prend plusieurs années",
                votes: 178
            }
        }
    ],
    controversyScore: 68,
    topComments: [
        {
            text: "J'ai fait une reconversion à 35 ans dans le développement web après 10 ans dans la restauration. Meilleure décision de ma vie, même si les 6 premiers mois ont été très difficiles.",
            votes: 245,
            sentiment: 0.82
        },
        {
            text: "Les formations comme l'École 42 sont excellentes car elles se concentrent sur la pratique et les projets concrets plutôt que sur la théorie.",
            votes: 187,
            sentiment: 0.75
        },
        {
            text: "Le problème c'est que beaucoup d'entreprises veulent des profils juniors avec 5 ans d'expérience... Comment faire quand on se reconvertit ?",
            votes: 156,
            sentiment: -0.45
        },
        {
            text: "J'ai essayé plusieurs MOOC et formations en ligne, mais rien ne remplace un vrai bootcamp en présentiel avec des mentors disponibles.",
            votes: 134,
            sentiment: 0.12
        },
        {
            text: "À plus de 45 ans, j'ai trouvé presque impossible de me reconvertir malgré mes efforts. Les recruteurs ne me donnaient même pas une chance d'entretien.",
            votes: 112,
            sentiment: -0.78
        }
    ],
    sentimentDistribution: {
        positive: 58,
        neutral: 24,
        negative: 18
    }
};
