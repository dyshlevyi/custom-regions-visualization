/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
 */
/* global controller */
console.log('zoomdata object: ', zd);
userVariables = controller.scope.userVariables;

var dataLookup = {}; //this will contain the results from Zoomdata

// create a div for the map and add the leaflet map
var uuid = new Date().getTime();
var mapId = 'map-' + uuid;

var div = $(controller.element).append('<div id="' + mapId +
'" style="width:100%; height:100%" />').find(mapId).first();

$(div).addClass('map');

var map = L.map('map-' + uuid).setView(userVariables.initialExtent.centerPoint, 
                                       userVariables.initialExtent.zoomLevel);

userVariables.tileLayer.addTo(map);

function regionInZoomRange(region) {
    var result = false;
    var zoomLevel = map.getZoom();
    if(value >= region.minZoomLevel && zoomLevel <= region.maxZoomLevel) {
        result = true;
    }
    return(result);
}

function getMetrics()  {
    var dataAccessors = controller.dataAccessors;
    var metrics = {};

    _.forOwn(dataAccessors, function(value, key) {
        if (value.TYPE === value.TYPES.METRIC ||
            value.TYPE === value.TYPES.MULTI_METRIC) {
            metrics[key] = value;
        }
    });

    return metrics;
}

function style(feature) {
console.log('styling ', feature);
    var id;
    var fillColor = 'rgb(245,245,245)'; //default to light grey
    
    //Figure out which variable to use for the rendering
    //TODO: is there a more efficient way to do this, check to find which array has that field
    for(var i=0; i < userVariables.regionsConfig.length; i++) {
        currRegion = userVariables.regionsConfig[i];
        if(feature.properties[currRegion.regionField] !== undefined) {
            id = feature.properties[currRegion.regionField];
            break;
        }
    }
 
console.log('style id is ', id);
    if (dataLookup && id in dataLookup) {
console.log('setting fill color for ', dataLookup[id]);
        fillColor = getMetrics().Color.color(dataLookup[id]);
console.log('Fill color for ', id, ' is ', fillColor, ' for value ', dataLookup[id])
    }

    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        fillColor: fillColor
    };
}

function addCustomRegionsToMap(customRegions, map, style) {
    console.log('adding custom regions to map', customRegions);
    customRegions.forEach(function(region) {
        region.mapLayer = L.geoJson(region.regionData, {
            style: style
        }).addTo(map);
    });
}

addCustomRegionsToMap(userVariables.regionsConfig, map, style);

map.on('moveend', function(e) {
    console.log('map moved, ', e);
});

map.on('zoomend', function(e) {
    console.log('map zoomed, ', e);
});

// Functions specific to the Zoomdata custom visualization
controller.selection = function(selected) {
    if (selected) {
        map.dragging.enable();
        map.touchZoom.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.boxZoom.enable();
    } else {
        map.dragging.disable();
        map.touchZoom.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.boxZoom.disable();
    }
};

controller.update = function(data, progress) {
    // Called when new data arrives
    console.log('new data from Zoomdata: ', data);
    dataLookup = {};
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        dataLookup[item.group] = item;
    }
    
    userVariables.regionsConfig.forEach(function(region) {
        if(region.mapLayer !== undefined) {
            region.mapLayer.setStyle(style);
        }
    });
};

controller.resize = function(width, height, size) {
    // Called when the widget is resized
    map.invalidateSize();
};

controller.createAxisLabel({
    picks: 'Color',
    orientation: 'horizontal',
    position: 'bottom',
    popoverTitle: 'Color'
});


