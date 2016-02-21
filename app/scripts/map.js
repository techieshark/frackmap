;(function () {
        
    'use strict';

    var mapboxgl = window.mapboxgl;

    mapboxgl.accessToken = 'pk.eyJ1IjoidGVjaGllc2hhcmsiLCJhIjoiY2lrcTUxZmJvMTkweHRubTZlOGt5MnZzeiJ9.CxxVSVIPSsgFFL3Dx-QTbA';

    var map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/techieshark/cikw6xfu100d098kmu3ogo74t', // light copy
        center: [-94.50, 40], //usa
        zoom: 3 // usa
    });

    map.on('style.load', function () {

        d3.json('/data/Fracking_Calendar.geojson', function(err, data) {

            // Create a year property used to filter against.
            data.features = data.features.map(function(d) {
                d.properties.year = new Date(d.properties["Full Date"]).getFullYear();
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
                    'circle-color': 'rgba(55,148,179,0.8)'
                },
            });

            map.setFilter('points', ['<', 'year', 2000]);

            addChart(function barEmptiedCallback(d) {
                console.log('emptied bar for year ' + d.year);
                map.setFilter('points', ['<=', 'year', d.year]);
            });

        });
    });

}());