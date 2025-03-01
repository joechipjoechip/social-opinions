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
            intensityScore: 0.87,
            opinion1: {
                stance: "La reconversion est possible à tout âge",
                votes: 245,
                keyArguments: ["L'expérience est un atout", "Les compétences sont transférables"]
            },
            opinion2: {
                stance: "Reconversion difficile après 40 ans",
                votes: 198,
                keyArguments: ["Préjugés des recruteurs", "Difficulté d'adaptation"]
            }
        },
        {
            topic: "Formations en ligne vs présentielles",
            intensityScore: 0.79,
            opinion1: {
                stance: "Pour les formations en ligne",
                votes: 176,
                keyArguments: ["Flexibilité horaire", "Coût réduit"]
            },
            opinion2: {
                stance: "Contre les formations en ligne",
                votes: 203,
                keyArguments: ["Manque d'encadrement", "Motivation difficile à maintenir"]
            }
        },
        {
            topic: "Rôle de l'État dans la reconversion",
            intensityScore: 0.75,
            opinion1: {
                stance: "Pour le financement public",
                votes: 187,
                keyArguments: ["Bénéfice collectif", "Réduction des inégalités"]
            },
            opinion2: {
                stance: "Pour la responsabilité individuelle",
                votes: 165,
                keyArguments: ["Meilleure motivation", "Allocation efficace des ressources"]
            }
        },
        {
            topic: "Valeur des diplômes vs compétences",
            intensityScore: 0.68,
            opinion1: {
                stance: "Pour les compétences pratiques",
                votes: 234,
                keyArguments: ["Adaptabilité au marché", "Résultats concrets"]
            },
            opinion2: {
                stance: "Pour l'importance des diplômes",
                votes: 143,
                keyArguments: ["Crédibilité professionnelle", "Fondements théoriques solides"]
            }
        },
        {
            topic: "Durée idéale d'une reconversion",
            intensityScore: 0.54,
            opinion1: {
                stance: "Pour une reconversion rapide (<1 an)",
                votes: 156,
                keyArguments: ["Retour rapide à l'emploi", "Moins de perte financière"]
            },
            opinion2: {
                stance: "Pour une formation longue et approfondie",
                votes: 178,
                keyArguments: ["Meilleure maîtrise", "Compétences plus solides"]
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
