(function () {

    'use strict';

    // utility function to clean up URLs shown in map pop-up
    // based on http://stackoverflow.com/a/23945027/1024811
    function extractDomain(url) {
        var domain;
        //find & remove protocol (http, ftp, etc.) and get domain
        if (url.indexOf('://') > -1) {
            domain = url.split('/')[2];
        }
        else {
            domain = url.split('/')[0];
        }

        //find & remove port number
        domain = domain.split(':')[0];

        // also remove 'www.' -@techieshark
        if (domain.indexOf('www.') > -1) {
            domain = domain.split('www.')[1];
        }

        return domain;
    }

    var mapboxgl = window.mapboxgl,
        d3 = window.d3,
        _ = window._,
        $ = window.$,
        Chart = window.Chart;

    mapboxgl.accessToken = 'pk.eyJ1IjoidGVjaGllc2hhcmsiLCJhIjoiY2lrcTUxZmJvMTkweHRubTZlOGt5MnZzeiJ9.CxxVSVIPSsgFFL3Dx-QTbA';

    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/techieshark/cikw6xfu100d098kmu3ogo74t', // light copy
        center: [-94.50, 35], //usa
        zoom: 3 // usa
    });
    window.mapboxMap = map;

    map.on('style.load', function () {

        var source = './data/Fracking_Calendar.geojson';
        d3.json(source, function(err, data) {

            if (err) {
                console.error('Error acquiring map data source ' + source + ': ' + err);
                return;
            }

            // Create a year property used to filter against.
            data.features = data.features.map(function(d) {
                d.properties.year = new Date(d.properties['Full Date']).getFullYear();
                return d;
            });

            map.addSource('locations', {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                'id': 'points',
                'interactive': true,
                'type': 'circle',
                'source': 'locations',
                'paint': {
                    'circle-radius': 5,
                    // 'circle-color': 'rgba(55,148,179,0.8)'
                    // 'circle-color': 'hsla(0, 0%, 0%, 1)'
                    // 'circle-color': 'yellow'
                    'circle-color': 'DarkSlateGray'
                }
            });

            map.addLayer({
                'id': 'featuredBorder',
                'type': 'circle',
                'source': 'locations',
                'paint': {
                    'circle-radius': 7,
                    'circle-color': 'red'
                }
            });
            map.addLayer({
                'id': 'featured',
                'type': 'circle',
                'source': 'locations',
                'paint': {
                    'circle-radius': 5,
                    'circle-color': 'black'
                    // 'circle-color': 'hsla(0, 0%, 50%, 1)'
                }
            });


            map.setFilter('points', ['<', 'year', 2000]);
            map.setFilter('featured', ['==', 'year', 0]); // initally, feature none
            map.setFilter('featuredBorder', ['==', 'year', 0]); // initally, feature none

            var chart;

            var animateFeaturePoints = function (d) {
                console.log('emptied bar for year ' + d.year);

                // show cumulative features up to current year
                map.setFilter('points', ['<', 'year', d.year]);

                // get final screen positions of each feature

                var currentFeatures = _.filter(data.features, function(feature) {
                    return feature.properties.year === d.year;
                });

                var xyPairs = _.map(currentFeatures, function(f) {
                    var mapPos = map.project(f.geometry.coordinates);
                    // Point {x,y} = map.project(each LngLat);
                    // update map position to include offset from d3 chart
                    mapPos.x = mapPos.x - chart.margin.left;
                    mapPos.y = mapPos.y - chart.margin.top - $(chart.svgContainer[0][0]).offset().top;
                    return mapPos;
                });

                // Get x,y of top center of bar: barTopX, barTopY
                var startXY = { x: chart.getBarCenterX(d), y: chart.getBarTopY(d) };

                // draw points at the top of the bar
                var points = chart.svg.selectAll('circle.y-' + d.year)
                    .data(xyPairs)
                    .enter()
                    .append('circle');

                // var transitionDelay = 100; // ms
                var transitionDuration = 1000; // ms

                // transition between point at top of bar and feature location
                var transitions = 0;
                points
                    .attr('class', 'y-' + d.year)
                    .attr('cx', startXY.x)
                    .attr('cy', startXY.y)
                    .attr('r', 5)
                  .transition()
                    // .delay(function (x, i) { return i * transitionDelay; })
                    .duration(transitionDuration).ease('ease-out')
                    .attr('cx', function (xy) { return xy.x; })
                    .attr('cy', function (xy) { return xy.y; })
                  .each( 'start', function() {
                        transitions++;
                  }).each( 'end', function() {
                        if( --transitions === 0 ) {
                            // only when all points have arrived at their destination do we
                            // swap in mapbox's features for them

                            //callbackWhenAllIsDone(); (http://stackoverflow.com/a/24942273/1024811)

                            // highlight this year's features
                            map.setFilter('featured', ['==', 'year', d.year]);
                            map.setFilter('featuredBorder', ['==', 'year', d.year]);

                            points.remove();
                        }
                  });
            };

            var highlightThisYearsFeatures = function (d) {
                map.setFilter('featured', ['==', 'year', d.year]);
                map.setFilter('featuredBorder', ['==', 'year', d.year]);
            };

            var hideFeatureHighlights = function () {
                // remove highlights
                map.setFilter('featured', ['==', 'year', 0]);
                map.setFilter('featuredBorder', ['==', 'year', 0]);
            };

            chart = new Chart({
                barBulgeEndCallback: animateFeaturePoints,
                barMouseDownCallback: highlightThisYearsFeatures,
                barMouseUpCallback: hideFeatureHighlights
            });

        });
    });

    // pop-up stuff, based on https://www.mapbox.com/mapbox-gl-js/example/popup-on-click/
    var popup = new mapboxgl.Popup();

    // When a click event occurs near a marker icon, open a popup at the location of
    // the feature, with description HTML from its properties.
    map.on('click', function (e) {
        console.log('click event');
        console.log(e);
        map.featuresAt(e.point, {
            radius: 7, // Half the marker size (14px).
            includeGeometry: true,
            layer: 'points'
        }, function (err, features) {

            if (err || !features.length) {
                if (err) {
                    console.log('error: ' + err);
                }
                popup.remove();
                return;
            }

            var feature = features[0];

            var when = new Date(feature.properties['Full Date']);
            var year = when.getFullYear();
            var day = when.getDate();
            var month = feature.properties.Month;
            var whenString = day + ' ' + month + ', ' + year;


            var src = feature.properties['Source 1'];

            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(feature.geometry.coordinates)
                .setHTML('<div class="map-popup-title">' + feature.properties['Incident Type'] + '</div>' +
                         '<p>' + feature.properties['Incident Description'] + '</p>' +
                         '<div class="incident-date">' + whenString + '</div>' +
                         '<div class="incident-location">' + feature.properties.Location + ', ' + feature.properties.State + '</div>' +
                         '<div class="incident-source"><a href="' + src + '">' + extractDomain(src) + '</a></div>'
                         )
                .addTo(map);
        });
    });

    // Use the same approach as above to indicate that the symbols are clickable
    // by changing the cursor style to 'pointer'.
    map.on('mousemove', function (e) {
        map.featuresAt(e.point, {
            radius: 7, // Half the marker size (14px).
            layer: 'points'
        }, function (err, features) {
            map.getCanvas().style.cursor = (!err && features.length) ? 'pointer' : '';
        });
    });

}());
