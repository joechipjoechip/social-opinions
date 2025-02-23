export class Visualizations {
    constructor() {
        this.margin = { top: 20, right: 20, bottom: 30, left: 40 };
        this.width = 300 - this.margin.left - this.margin.right;
        this.height = 200 - this.margin.top - this.margin.bottom;
    }

    createSentimentDonut(data) {
        const container = d3.select('#sentimentChart');
        container.selectAll("*").remove();

        const radius = Math.min(this.width, this.height) / 2;
        const svg = container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.width/2 + this.margin.left},${this.height/2 + this.margin.top})`);

        const color = d3.scaleOrdinal()
            .domain(["positive", "negative", "neutral"])
            .range(["#4CAF50", "#f44336", "#9E9E9E"]);

        const pieGenerator = d3.pie()
            .value(d => d[1]);

        const data_ready = pieGenerator(Object.entries(data));

        const arcGenerator = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        svg.selectAll('slices')
            .data(data_ready)
            .join('path')
            .attr('d', arcGenerator)
            .attr('fill', d => color(d.data[0]))
            .attr("stroke", "white")
            .style("stroke-width", "2px");

        svg.selectAll('labels')
            .data(data_ready)
            .join('text')
            .text(d => `${d.data[0]}: ${Math.round(d.data[1])}%`)
            .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
            .style('text-anchor', 'middle')
            .style('font-size', '12px');
    }

    createTopicsBarChart(data) {
        const container = d3.select('#topicsChart');
        container.selectAll("*").remove();

        const svg = container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const x = d3.scaleBand()
            .range([0, this.width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([this.height, 0]);

        x.domain(data.map(d => d.name));
        y.domain([0, d3.max(data, d => d.count)]);

        svg.selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.name))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.count))
            .attr("height", d => this.height - y(d.count))
            .attr("fill", d => {
                switch(d.sentiment) {
                    case "positive": return "#4CAF50";
                    case "negative": return "#f44336";
                    default: return "#9E9E9E";
                }
            });

        svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");

        svg.append("g")
            .call(d3.axisLeft(y));
    }

    createScoreDistributionChart(data) {
        const container = d3.select('#scoresChart');
        container.selectAll("*").remove();

        const svg = container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const x = d3.scaleBand()
            .range([0, this.width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .range([this.height, 0]);

        x.domain(data.map(d => d.range));
        y.domain([0, d3.max(data, d => d.count)]);

        svg.selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.range))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.count))
            .attr("height", d => this.height - y(d.count))
            .attr("fill", "#2196F3");

        svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));
    }

    createControversyChart(data) {
        const container = d3.select('#controversyChart');
        container.selectAll("*").remove();

        const svg = container.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        const x = d3.scaleLinear()
            .domain([0, 10])
            .range([0, this.width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.topic))
            .range([0, this.height])
            .padding(0.1);

        svg.selectAll(".bar")
            .data(data)
            .join("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => y(d.topic))
            .attr("width", d => x(d.intensity))
            .attr("height", y.bandwidth())
            .attr("fill", "#FF9800");

        svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));
    }
}
