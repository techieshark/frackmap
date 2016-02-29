(function () {

    'use strict';

    var d3 = window.d3;

    // options:
    // container: d3 selector to add the svg.chart to, e.g 'body'
    // width (chart width)
    // height (chart height)
    var Chart = function (options) {
        // initialize based on options or defaults
        this.container = options.container || 'body';
        this.totalWidth = options.width || 760;
        this.totalHeight = options.height || 250;
        this.barBulgeEndCallback = options.barBulgeEndCallback || function () {};
        this.barEmptiedCallback = options.barEmptiedCallback || function() {};
        this.barMouseDownCallback = options.barMouseDownCallback || function () {};
        this.barMouseUpCallback = options.barMouseUpCallback || function () {};

        // calculate margins and inner width
        var margin = {top: 20, right: 20, bottom: 30, left: 40};
        this.margin = margin;
        this.width = this.totalWidth - margin.left - margin.right;
        this.height = this.totalHeight - margin.top - margin.bottom;

        // initialize d3 scales, etc
        this.y = d3.scale.linear()
            .range([this.height, 0]);

        this.yAxis = d3.svg.axis()
            .scale(this.y)
            .orient('left');

        // add to page
        this.render();

    };
    window.Chart = Chart;

    // Add the chart to the page
    Chart.prototype.render = function () {
        this.svgContainer = d3.select(this.container)
                .append('svg')
                    .attr('class', 'chart')
                    .attr('width', this.totalWidth)
                    .attr('height', this.totalHeight);
        this.svg = this.svgContainer.append('g')
                .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.buildChart();
    };


    var getYear = function (d) { return '' + d.year; };

    function type(d) {
        d.frequency = +d.frequency;
        d.year = +d.year;
        return d;
    }


    // bar: the group to append to
    // y: y value for top of rectangle
    Chart.prototype.bulgeBar = function (bar, d) { //barWidth, barHeight, yTop) {

        var bulgeDuration = 250; // milliseconds

        var thisChart = this;

        var barWidth = this.x3.rangeBand();
        var barHeight = this.getBarHeight(d);
        var yTop = this.getBarTopY(d);

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
        // var shortSvgBar = `
        //         M 0,0 ${barWidth},0
        //         C ${barWidth},0 ${barWidth},1 ${barWidth},1
        //         l -${barWidth},0
        //         C 0,1 0,0 0,0
        //         Z`;

        return bar.append('path')
            .attr('class', 'bulge')
            .attr('d', svgRect)
            .transition().delay(0).duration(bulgeDuration)
            .attr('d', bulgedSvgRect).each('end', function () {
                thisChart.barBulgeEndCallback(d);
            })
            .transition().duration(bulgeDuration)
            .ease('elastic')
            .attr('d', svgRect)
            // .transition().ease('cubic-out').duration(1000) // lou
            // .attr('d', shortSvgBar)
            // .style('fill-opacity', 0.5)
            .remove();
    };

    // the heavy lifting of building the chart
    Chart.prototype.buildChart = function () {

        var svg = this.svg;
        var y = this.y;
        var yAxis = this.yAxis;
        var height = this.height;
        var barMouseDownCallback = this.barMouseDownCallback;
        var barMouseUpCallback = this.barMouseUpCallback;
        var barEmptiedCallback = this.barEmptiedCallback;
        var thisChart = this;

        d3.tsv('data/frack-data.tsv', type, function(error, data) {
            if (error) { throw error; }

            thisChart.data = data;

            var barOuterPad = .2;
            var barPad = .1;
            var x3 = thisChart.x3 = d3.scale.ordinal()
                .domain(data.map(getYear))
                .rangeRoundBands([0, thisChart.width], barPad, barOuterPad);

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
                .attr('class', 'bar')
                .on('mouseover', barMouseDownCallback)
                .on('mousedown', barMouseDownCallback)
                .on('mouseup', barMouseUpCallback);


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
                        thisChart.bulgeBar(thisBar, d);
                        thisBar.transition().delay(400).attr('class', 'bar emptied').each('end', function(barData) {
                        // thisBar.transition().delay(2000).attr('class', 'bar emptied').each('end', function(d) {
                            barEmptiedCallback(barData);

                        });
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

    Chart.prototype.getBarTopY = function (d) {
        return this.y(d.frequency);
    };
    Chart.prototype.getBarCenterX = function (d) {
        return this.x3(d.year) + this.x3.rangeBand() / 2;
    };
    Chart.prototype.getBarHeight = function (d) {
        return this.height - this.y(d.frequency);
    };

}());

