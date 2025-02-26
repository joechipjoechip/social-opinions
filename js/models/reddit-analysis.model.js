/**
 * Modèle de données pour l'analyse des opinions Reddit
 */

export class RedditAnalysis {
    constructor(data = {}) {
        this.overview = new Overview(data.overview || {});
        this.opinionClusters = (data.opinionClusters || []).map(c => new OpinionCluster(c));
        this.consensusPoints = (data.consensusPoints || []).map(p => new ConsensusPoint(p));
        this.frictionPoints = (data.frictionPoints || []).map(p => new FrictionPoint(p));
        this.voteDistribution = (data.voteDistribution || []).map(d => new VoteDistribution(d));
        this.metadata = new Metadata(data.metadata || {});
    }

    /**
     * Retourne l'opinion la plus populaire
     * @returns {OpinionCluster|null}
     */
    getMostPopularOpinion() {
        if (!this.opinionClusters.length) return null;
        return this.opinionClusters.reduce((prev, current) => 
            (prev.totalVotes > current.totalVotes) ? prev : current);
    }

    /**
     * Retourne le point de friction le plus intense
     * @returns {FrictionPoint|null}
     */
    getMostIntenseFrictionPoint() {
        if (!this.frictionPoints.length) return null;
        return this.frictionPoints.reduce((prev, current) => 
            (prev.intensityScore > current.intensityScore) ? prev : current);
    }

    /**
     * Calcule le score de polarisation global (0-1)
     * @returns {number}
     */
    getPolarizationScore() {
        if (!this.frictionPoints.length) return 0;
        
        const avgIntensity = this.frictionPoints.reduce((sum, point) => 
            sum + point.intensityScore, 0) / this.frictionPoints.length;
            
        return avgIntensity;
    }

    /**
     * Convertit l'instance en objet simple
     * @returns {Object}
     */
    toJSON() {
        return {
            overview: this.overview,
            opinionClusters: this.opinionClusters,
            consensusPoints: this.consensusPoints,
            frictionPoints: this.frictionPoints,
            voteDistribution: this.voteDistribution,
            metadata: this.metadata
        };
    }

    /**
     * Crée une instance à partir d'un objet JSON
     * @param {Object} json 
     * @returns {RedditAnalysis}
     */
    static fromJSON(json) {
        return new RedditAnalysis(json);
    }
}

export class Overview {
    constructor(data = {}) {
        this.totalComments = data.totalComments || 0;
        this.mainOpinion = data.mainOpinion || '';
        this.consensusLevel = data.consensusLevel || 0;
    }
}

export class OpinionCluster {
    constructor(data = {}) {
        this.opinion = data.opinion || '';
        this.totalVotes = data.totalVotes || 0;
        this.commentCount = data.commentCount || 0;
        this.avgScore = data.avgScore || 0;
        this.representativeComment = data.representativeComment || '';
        this.relatedOpinions = data.relatedOpinions || [];
    }
}

export class ConsensusPoint {
    constructor(data = {}) {
        this.topic = data.topic || '';
        this.agreementLevel = data.agreementLevel || 0;
        this.totalVotes = data.totalVotes || 0;
        this.keyEvidence = data.keyEvidence || [];
    }
}

export class FrictionPoint {
    constructor(data = {}) {
        this.topic = data.topic || '';
        this.opinion1 = new Opinion(data.opinion1 || {});
        this.opinion2 = new Opinion(data.opinion2 || {});
        this.intensityScore = data.intensityScore || 0;
    }
}

export class Opinion {
    constructor(data = {}) {
        this.stance = data.stance || '';
        this.votes = data.votes || 0;
        this.keyArguments = data.keyArguments || [];
    }
}

export class VoteDistribution {
    constructor(data = {}) {
        this.opinionGroup = data.opinionGroup || '';
        this.totalVotes = data.totalVotes || 0;
        this.percentageOfTotal = data.percentageOfTotal || 0;
        this.topComments = data.topComments || [];
    }
}

export class Metadata {
    constructor(data = {}) {
        this.createdAt = data.createdAt || new Date().toISOString();
        this.postUrl = data.postUrl || '';
        this.postTitle = data.postTitle || '';
        this.commentCount = data.commentCount || 0;
        this.analysisVersion = data.analysisVersion || '1.0';
    }
}
