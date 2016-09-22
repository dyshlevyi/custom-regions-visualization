/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
 */
/* global controller */
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

// Used when the view changes (zooming) to detect what region set to use
function regionInZoomRange(region) {
    var result = false;
    var zoomLevel = map.getZoom();
    var minZoomLevel = region.minZoomLevel || 0;
    var maxZoomLevel = region.maxZoomLevel || 18; //18 is the default max zoom for leaflet TileLayer
    if(zoomLevel >= minZoomLevel && zoomLevel <= maxZoomLevel) {
        result = true;
    }
    return(result);
}

// Given a zoom level set the currently visible layer
//and associated grouping in Zoomdata query
//TODO: filtering based on parent layer in view, like we do with states
function setCurrentLayer() {
    userVariables.regionsConfig.forEach(function(currRegion) {
        if(regionInZoomRange(currRegion)) {
            currRegion.visible = true;
            currRegion.mapLayer.addTo(map);
            var currGroup = controller.dataAccessors.region.getGroup();
            currGroup.name = currRegion.groupName;
            currGroup.limit = currRegion.regionData.features.length;
console.log('Changed group to ', currGroup);
            controller.dataAccessors.region.setGroup((currRegion.groupName, currGroup));
        } else {
            map.removeLayer(currRegion.mapLayer);
            currRegion.visible = false;
        }
    });
}

function getVisibleLayer() {
    var result = userVariables.regionsConfig.find(function(currRegion) {
        if(currRegion.visible === undefined) {
            return false;
        }
        return currRegion.visible;
    });
    return result;
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
 
    if (dataLookup && id in dataLookup) {
        fillColor = getMetrics().Color.color(dataLookup[id]);
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

function createCustomRegionLayers(customRegions, map, style) {
    customRegions.forEach(function(region) {
        region.mapLayer = L.geoJson(region.regionData, {
            style: style,
            onEachFeature: onEachFeature
        });
console.log('region ', region.groupName, ' has ', region.regionData, ' element');
    });
}

createCustomRegionLayers(userVariables.regionsConfig, map, style);
setCurrentLayer();

map.on('moveend', function(e) {
    //console.log('map moved, ', e);
});

map.on('zoomend', function(e) {
    setCurrentLayer();
});

function highlightFeature(e) {
    var layer = e.target;
    var feature = e.target.feature;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

    currRegion = getVisibleLayer();
    featureId = feature.properties[currRegion.regionField];
    if (!(featureId in dataLookup)) {
        return;
    }

    var data = dataLookup[featureId];
    controller.tooltip.show({
        event: e.originalEvent,
        data: function() {
            return data;
        },
        color: function() {
            if (!(featureId in dataLookup)) {
                return;
            }
            return getMetrics().Color.color(dataLookup[featureId]);
        }
    });
}

function resetHighlight(e) {
    getVisibleLayer().mapLayer.resetStyle(e.target);
    controller.tooltip.hide();
}

function featureDetails(e) {
    var feature = e.target.feature;

    if (!(currRegion.regionField in dataLookup)) {
        return;
    }

    controller.menu.show({
        event: e.originalEvent,
        data: function() {
            return dataLookup[currRegion.regionField];
        }
    });
}

function onEachFeature(feature, layer) {
    layer.on({
        mousemove: highlightFeature,
        mouseout: resetHighlight,
        click: featureDetails
    });
}

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


