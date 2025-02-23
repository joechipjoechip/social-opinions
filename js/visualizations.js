export class Visualizations {
    createOpinionClusterChart(data) {
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };

        // Nettoyer le conteneur
        d3.select("#sentimentChart").html("");

        // Créer le SVG
        const svg = d3.select("#sentimentChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Créer l'échelle pour les clusters
        const y = d3.scaleBand()
            .domain(data.opinionClusters.map(d => d.opinion))
            .range([margin.top, height - margin.bottom])
            .padding(0.1);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data.opinionClusters, d => d.totalVotes)])
            .range([margin.left, width - margin.right]);

        // Créer les barres
        svg.selectAll("rect")
            .data(data.opinionClusters)
            .enter()
            .append("rect")
            .attr("x", margin.left)
            .attr("y", d => y(d.opinion))
            .attr("width", d => x(d.totalVotes) - margin.left)
            .attr("height", y.bandwidth())
            .attr("fill", "#FF4500")
            .attr("opacity", d => 0.4 + (d.avgScore / d3.max(data.opinionClusters, d => d.avgScore)) * 0.6);

        // Ajouter les axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        // Ajouter les labels
        svg.selectAll(".score-label")
            .data(data.opinionClusters)
            .enter()
            .append("text")
            .attr("class", "score-label")
            .attr("x", d => x(d.totalVotes) + 5)
            .attr("y", d => y(d.opinion) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d.totalVotes);
    }

    createConsensusChart(data) {
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const radius = Math.min(width, height) / 2 - margin.top;

        // Nettoyer le conteneur
        d3.select("#topicsChart").html("");

        // Créer le SVG
        const svg = d3.select("#topicsChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width/2},${height/2})`);

        // Créer l'échelle de couleurs
        const color = d3.scaleSequential()
            .domain([0, 1])
            .interpolator(d3.interpolateRdYlGn);

        // Créer le pie layout
        const pie = d3.pie()
            .value(d => d.totalVotes)
            .sort(null);

        // Créer l'arc
        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        // Créer les segments
        const segments = svg.selectAll("path")
            .data(pie(data.consensusPoints))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.agreementLevel))
            .attr("stroke", "white")
            .style("stroke-width", "2px");

        // Ajouter les labels
        const arcLabel = d3.arc()
            .innerRadius(radius * 0.8)
            .outerRadius(radius * 0.8);

        svg.selectAll("text")
            .data(pie(data.consensusPoints))
            .enter()
            .append("text")
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .text(d => d.data.topic.substring(0, 20) + "...");
    }

    createFrictionChart(data) {
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };

        // Nettoyer le conteneur
        d3.select("#scoresChart").html("");

        // Créer le SVG
        const svg = d3.select("#scoresChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Préparer les données
        const frictionData = data.frictionPoints.map(point => ({
            topic: point.topic,
            opinion1Votes: point.opinion1.votes,
            opinion2Votes: point.opinion2.votes,
            intensity: point.intensityScore
        }));

        // Créer les échelles
        const x = d3.scaleBand()
            .domain(frictionData.map(d => d.topic))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([
                -d3.max(frictionData, d => Math.max(d.opinion1Votes, d.opinion2Votes)),
                d3.max(frictionData, d => Math.max(d.opinion1Votes, d.opinion2Votes))
            ])
            .range([height - margin.bottom, margin.top]);

        // Créer les barres
        svg.selectAll(".opinion1")
            .data(frictionData)
            .enter()
            .append("rect")
            .attr("class", "opinion1")
            .attr("x", d => x(d.topic))
            .attr("y", d => y(d.opinion1Votes))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => y(0) - y(d.opinion1Votes))
            .attr("fill", "#FF4500")
            .attr("opacity", d => 0.4 + d.intensity * 0.6);

        svg.selectAll(".opinion2")
            .data(frictionData)
            .enter()
            .append("rect")
            .attr("class", "opinion2")
            .attr("x", d => x(d.topic) + x.bandwidth() / 2)
            .attr("y", d => y(d.opinion2Votes))
            .attr("width", x.bandwidth() / 2)
            .attr("height", d => y(0) - y(d.opinion2Votes))
            .attr("fill", "#0079D3")
            .attr("opacity", d => 0.4 + d.intensity * 0.6);

        // Ajouter les axes
        svg.append("g")
            .attr("transform", `translate(0,${y(0)})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));
    }

    createVoteDistributionChart(data) {
        const width = 600;
        const height = 400;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };

        // Nettoyer le conteneur
        d3.select("#controversyChart").html("");

        // Créer le SVG
        const svg = d3.select("#controversyChart")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Créer le treemap layout
        const root = d3.hierarchy({children: data.voteDistribution})
            .sum(d => d.totalVotes);

        const treemap = d3.treemap()
            .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
            .padding(1);

        treemap(root);

        // Créer l'échelle de couleurs
        const color = d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateYlOrRd);

        // Créer les rectangles
        const cell = svg.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0 + margin.left},${d.y0 + margin.top})`);

        cell.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.data.percentageOfTotal));

        cell.append("text")
            .attr("x", 5)
            .attr("y", 15)
            .text(d => d.data.opinionGroup.substring(0, 15) + "...")
            .attr("font-size", "12px")
            .attr("fill", "white");

        cell.append("text")
            .attr("x", 5)
            .attr("y", 30)
            .text(d => d.data.percentageOfTotal.toFixed(1) + "%")
            .attr("font-size", "10px")
            .attr("fill", "white");
    }
}
