export class Visualizations {
    constructor() {
        this.width = 700;
        this.height = 200;
        this.margin = { top: 20, right: 80, bottom: 30, left: 120 };
    }

    getContainerDimensions(containerId) {
        const container = document.getElementById(containerId);
        const rect = container.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }

    wrapText(text, width, element) {
        const words = text.split(/\s+/).reverse();
        let word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1,
            y = element.attr("y"),
            dy = parseFloat(element.attr("dy")),
            tspan = element.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = element.append("tspan")
                    .attr("x", 0)
                    .attr("y", y)
                    .attr("dy", ++lineNumber * lineHeight + dy + "em")
                    .text(word);
            }
        }
    }

    createOpinionClusterChart(data) {
        d3.select("#sentimentChart").html("");
        
        const svg = d3.select("#sentimentChart")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const chartWidth = this.width - this.margin.left - this.margin.right;
        const chartHeight = this.height - this.margin.top - this.margin.bottom;

        const y = d3.scaleBand()
            .domain(data.opinionClusters.map(d => d.opinion))
            .range([0, chartHeight])
            .padding(0.2);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data.opinionClusters, d => d.totalVotes)])
            .range([0, chartWidth]);

        svg.selectAll("rect")
            .data(data.opinionClusters)
            .enter()
            .append("rect")
            .attr("y", d => y(d.opinion))
            .attr("x", 0)
            .attr("width", d => x(d.totalVotes))
            .attr("height", y.bandwidth())
            .attr("fill", "#FF4500")
            .attr("opacity", 0.7);

        const yAxis = svg.append("g")
            .call(d3.axisLeft(y));

        yAxis.selectAll(".tick text")
            .call(text => this.wrapText(text.text(), this.margin.left - 10, text));

        svg.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x));

        svg.selectAll(".value-label")
            .data(data.opinionClusters)
            .enter()
            .append("text")
            .attr("class", "value-label")
            .attr("x", d => x(d.totalVotes) + 5)
            .attr("y", d => y(d.opinion) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d.totalVotes);
    }

    createConsensusChart(data) {
        d3.select("#topicsChart").html("");

        const radius = Math.min(this.width - this.margin.left - this.margin.right, 
                              this.height - this.margin.top - this.margin.bottom) / 2;

        const svg = d3.select("#topicsChart")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.width/2},${this.height/2})`);

        const color = d3.scaleSequential()
            .domain([0, 1])
            .interpolator(d3.interpolateRdYlGn);

        const pie = d3.pie()
            .value(d => d.totalVotes)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius);

        const outerArc = d3.arc()
            .innerRadius(radius * 1.1)
            .outerRadius(radius * 1.1);

        const segments = svg.selectAll("path")
            .data(pie(data.consensusPoints))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.agreementLevel))
            .attr("stroke", "white")
            .style("stroke-width", "2px");

        svg.selectAll("polyline")
            .data(pie(data.consensusPoints))
            .enter()
            .append("polyline")
            .attr("points", d => {
                const pos = outerArc.centroid(d);
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 1.1 * (midAngle < Math.PI ? 1 : -1);
                return [arc.centroid(d), outerArc.centroid(d), pos];
            })
            .style("fill", "none")
            .style("stroke", "#999");

        svg.selectAll("text")
            .data(pie(data.consensusPoints))
            .enter()
            .append("text")
            .attr("transform", d => {
                const pos = outerArc.centroid(d);
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                pos[0] = radius * 1.2 * (midAngle < Math.PI ? 1 : -1);
                return `translate(${pos})`;
            })
            .style("text-anchor", d => {
                const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
                return midAngle < Math.PI ? "start" : "end";
            })
            .text(d => this.truncateText(d.data.topic, 30))
            .append("tspan")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .style("font-size", "0.8em")
            .text(d => `${Math.round(d.data.agreementLevel * 100)}% accord`);
    }

    createFrictionChart(data) {
        d3.select("#scoresChart").html("");

        const svg = d3.select("#scoresChart")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const chartWidth = this.width - this.margin.left - this.margin.right;
        const chartHeight = this.height - this.margin.top - this.margin.bottom;

        const y = d3.scaleBand()
            .domain(data.frictionPoints.map(d => d.topic))
            .range([0, chartHeight])
            .padding(0.2);

        const maxVotes = d3.max(data.frictionPoints, d => 
            Math.max(d.opinion1.votes, d.opinion2.votes));

        const x = d3.scaleLinear()
            .domain([-maxVotes, maxVotes])
            .range([0, chartWidth]);

        const yAxis = svg.append("g")
            .call(d3.axisLeft(y));

        yAxis.selectAll(".tick text")
            .call(text => this.wrapText(text.text(), this.margin.left - 10, text));

        svg.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(x));

        svg.selectAll(".opinion1")
            .data(data.frictionPoints)
            .enter()
            .append("rect")
            .attr("class", "opinion1")
            .attr("y", d => y(d.topic))
            .attr("x", d => x(-d.opinion1.votes))
            .attr("width", d => x(0) - x(-d.opinion1.votes))
            .attr("height", y.bandwidth())
            .attr("fill", "#FF4500")
            .attr("opacity", 0.7);

        svg.selectAll(".opinion2")
            .data(data.frictionPoints)
            .enter()
            .append("rect")
            .attr("class", "opinion2")
            .attr("y", d => y(d.topic))
            .attr("x", x(0))
            .attr("width", d => x(d.opinion2.votes) - x(0))
            .attr("height", y.bandwidth())
            .attr("fill", "#0079D3")
            .attr("opacity", 0.7);

        svg.selectAll(".value-label-1")
            .data(data.frictionPoints)
            .enter()
            .append("text")
            .attr("class", "value-label")
            .attr("x", d => x(-d.opinion1.votes) - 5)
            .attr("y", d => y(d.topic) + y.bandwidth() / 2)
            .attr("text-anchor", "end")
            .attr("dy", "0.35em")
            .text(d => d.opinion1.votes);

        svg.selectAll(".value-label-2")
            .data(data.frictionPoints)
            .enter()
            .append("text")
            .attr("class", "value-label")
            .attr("x", d => x(d.opinion2.votes) + 5)
            .attr("y", d => y(d.topic) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d.opinion2.votes);
    }

    createVoteDistributionChart(data) {
        d3.select("#controversyChart").html("");

        const svg = d3.select("#controversyChart")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        const chartWidth = this.width - this.margin.left - this.margin.right;
        const chartHeight = this.height - this.margin.top - this.margin.bottom;

        const treemap = d3.treemap()
            .size([chartWidth, chartHeight])
            .padding(1)
            .round(true);

        const root = d3.hierarchy({children: data.voteDistribution})
            .sum(d => d.totalVotes);

        treemap(root);

        const color = d3.scaleSequential()
            .domain([0, 100])
            .interpolator(d3.interpolateYlOrRd);

        const cell = svg.selectAll("g")
            .data(root.leaves())
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0 + this.margin.left},${d.y0 + this.margin.top})`);

        cell.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.data.percentageOfTotal));

        const cellPadding = 4;
        
        cell.append("text")
            .attr("x", cellPadding)
            .attr("y", cellPadding)
            .selectAll("tspan")
            .data(d => {
                const lines = [
                    this.truncateText(d.data.opinionGroup, 30),
                    `${d.data.percentageOfTotal.toFixed(1)}%`,
                    `${d.data.totalVotes} votes`
                ];
                return lines;
            })
            .enter()
            .append("tspan")
            .attr("x", cellPadding)
            .attr("dy", (d, i) => i ? "1.2em" : 0)
            .attr("fill", "white")
            .style("font-size", (d, i) => i ? "0.8em" : "1em")
            .text(d => d);
    }
}
