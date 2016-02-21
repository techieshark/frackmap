var addChart;

;(function () {

    'use strict';

    var d3 = window.d3;

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 760 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var y = d3.scale.linear()
        .range([height, 0]);


    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left');

    var svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
    .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var getYear = function (d) { return '' + d.year; };

    function type(d) {
        d.frequency = +d.frequency;
        d.year = +d.year;
        return d;
    }


    // bar: the group to append to
    // y: y value for top of rectangle
    var bulgeBar = function (bar, barWidth, barHeight, yTop) {

        var bulgeDuration = 250; // milliseconds

        var svgRect = `
                M 0,${yTop} ${barWidth},${yTop}
                C ${barWidth},${yTop} ${barWidth},${yTop + barHeight} ${barWidth},${yTop + barHeight}
                l -${barWidth},0
                C 0,${yTop + barHeight} 0,${yTop} 0,${yTop}
                Z`;
        var bulgeWidth = .25 * barWidth;
        var bulgedSvgRect = `
                M 0,${yTop} ${barWidth},${yTop}
                C ${barWidth + bulgeWidth},${yTop + (.3 * barHeight)} ${barWidth + bulgeWidth},${yTop + (.7 * barHeight)} ${barWidth},${yTop + barHeight}
                l -${barWidth},0
                C ${0 - bulgeWidth},${yTop + (.7 * barHeight)} ${0 - bulgeWidth},${yTop + (.3 * barHeight)} 0,${yTop}
                Z`;


        // var shortSvgBar = `
        //         M 0,${yTop} ${barWidth},${yTop}
        //         C ${barWidth},${yTop} ${barWidth},${yTop+1} ${barWidth},${yTop+1}
        //         l -${barWidth},0
        //         C 0,${yTop+1} 0,${yTop} 0,${yTop}
        //         Z`;

        // a short bar at the top of the screen,
        // so the bars are sent flying toward the map
        var shortSvgBar = `
                M 0,0 ${barWidth},0
                C ${barWidth},0 ${barWidth},1 ${barWidth},1
                l -${barWidth},0
                C 0,1 0,0 0,0
                Z`;

        return bar.append('path')
            .attr('class', 'bulge')
            .attr('d', svgRect)
            .transition().delay(0).duration(bulgeDuration)
            .attr('d', bulgedSvgRect)
            .transition().duration(bulgeDuration)
            .ease('elastic')
            .attr('d', svgRect)
            .transition().ease('cubic-out').duration(1000) // lou
            .attr('d', shortSvgBar)
            .style('fill-opacity', 0.5)
            .remove();
    };

    addChart = function (barEmptiedCallback) {

        d3.tsv('data/frack-data.tsv', type, function(error, data) {
            if (error) { throw error; }

            var barOuterPad = .2;
            var barPad = .1;
            var x3 = d3.scale.ordinal()
                .domain(data.map(getYear))
                .rangeRoundBands([0, width], barPad, barOuterPad);

            var xAxis = d3.svg.axis()
                .scale(x3)
                .orient('bottom');

            y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + (height + 2) + ')')
                .call(xAxis);

            svg.append('g')
                .attr('class', 'y axis')
                .call(yAxis)
                .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 12)
                // .attr('dy', '0em')
                .style('text-anchor', 'end')
                .text('Frequency');

            svg.selectAll('.bar')
                .data(data)
                .enter().append('g')
                .attr('transform', function(d) { return 'translate(' + x3(getYear(d)) + ',0)'; })
                .attr('class', 'bar');

            var bar = svg.selectAll('.bar');
            var getBarHeight = function (d) { return height - y(d.frequency); };
            var getTopY = function (d) { return y(d.frequency); };

            bar.append('rect')
                    .attr('width', x3.rangeBand())
                    .attr('y', height)
                    .attr('height', 0)
                    .transition()
                    .duration(300)
                    // .duration(3000)
                    .delay(function (d, i) {
                        return i * 1000; // 500 lou
                    })
                    .attr('y', getTopY)
                    .attr('height', getBarHeight)
                    .each('end', function (d) {
                        var thisBar = d3.select(this.parentNode);
                        bulgeBar(thisBar, x3.rangeBand(), getBarHeight(d), getTopY(d));
                        thisBar.transition().delay(400).attr('class', 'bar emptied').each('end', function(d) {
                        // thisBar.transition().delay(2000).attr('class', 'bar emptied').each('end', function(d) {
                            barEmptiedCallback(d);

                        })
                    });

            bar.append('text')
                    .text(function(d) { return d.frequency; })
                    .attr('x', function() {
                        // center text on bar
                        var textWidth = this.getBBox().width;
                        return x3.rangeBand() / 2 - (textWidth / 2);
                    })
                    .attr('y', function(d) {
                        // put text a bit above bars. (if put below bar, text may not fit on short bars)
                        var textHeight = this.getBBox().height;
                        return y(d.frequency) - (textHeight);
                        })
                    .attr('dy', '.75em');

        });
    };

}());

