(function () {

    'use strict';

    var mapboxgl = window.mapboxgl,
        d3 = window.d3,
        _ = window._,
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
                    'circle-color': 'Gold'
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


            var barEmptiedCallback = function (d) {
                console.log('emptied bar for year ' + d.year);

                // show cumulative features up to current year
                map.setFilter('points', ['<=', 'year', d.year]);

                // highlight this year's features
                map.setFilter('featured', ['==', 'year', d.year]);
                map.setFilter('featuredBorder', ['==', 'year', d.year]);
            };

            var barMouseDownCallback = function (d) {
                map.setFilter('featured', ['==', 'year', d.year]);
                map.setFilter('featuredBorder', ['==', 'year', d.year]);
            };

            var barMouseUpCallback = function () {
                // remove highlights
                map.setFilter('featured', ['==', 'year', 0]);
                map.setFilter('featuredBorder', ['==', 'year', 0]);
            };

            new Chart({
                barEmptiedCallback: barEmptiedCallback,
                barMouseDownCallback: barMouseDownCallback,
                barMouseUpCallback: barMouseUpCallback
            });

        });
    });

}());
