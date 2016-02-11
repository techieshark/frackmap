// ;(function () {
    var d3 = window.d3;

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 760 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var y = d3.scale.linear()
        .range([height, 0]);

    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");
        
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var getYear = function (d) { return "" + d.year; }
    
    d3.tsv("frack-data.tsv", type, function(error, data) {
        if (error) throw error;
        
        var barOuterPad = .2;
        var barPad = .1;
        var x3 = d3.scale.ordinal()
            .domain(data.map(getYear))
            .rangeRoundBands([0, width], barPad, barOuterPad);
        
        var xAxis = d3.svg.axis()
            .scale(x3)
            .orient("bottom");
        
        y.domain([0, d3.max(data, function(d) { return d.frequency; })]);
        
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (height+2) + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 12)
            // .attr("dy", "0em")
            .style("text-anchor", "end")
            .text("Frequency");

        svg.append('rect')
            .data(data)
            .enter().append('rect')
                .attr('x', function(d) { x3(getYear(d)) })
                .attr('width', x3.rangeBand());

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { 
                    return x3(getYear(d)); 
                 })
                .attr("width", x3.rangeBand())
            .attr("y", function(d) { 
                return y(d.frequency); })
            .attr("height", function(d) { 
                return height - y(d.frequency); });
    });

    function type(d) {
        d.frequency = +d.frequency;
        d.year = +d.year;
        return d;
    }
                
// }());