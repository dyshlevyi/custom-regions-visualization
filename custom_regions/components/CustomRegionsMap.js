/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
 */
/* global controller */

(function() {
var userVariables = {};
//Set the initial map extent.  This is what part of the world will be shown
//when the user first opens the visualization.  The extent consists of a 
//center point lat/lon and a zoom level.  Zoom level is an integer between 0 and X, where
//0 is the whole world and X is the most detailed level as defined by the tile layer selected
//Some examples:
// United States (contiguous): 
userVariables.initialExtent = {centerPoint: {lat:37.8, lon:-96}, zoomLevel: 4};
// Europe: 
//userVariables.initialExtent = {centerPoint: {lat:53.87, lon:15.55}, zoomLevel: 4};
// Australia:
//userVariables.initialExtent = {centerPoint: {lat: -25.08, lon: 134.26}, zoomLevel: 4};


//Specify the tile layer to show in the background of the map using either the
//provider from leaflet-extras or by setting the parameters yourself

//Using leaflet provider, as described at https://github.com/leaflet-extras/leaflet-providers
userVariables.tileLayer = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');

//Example setting the parameters manually, in this case for OpenStreetMap Mapnik
//userVariables.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//	maxZoom: 19,
//	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//});

//Load and configure the regions to use for data display.  Regions must be in 
//GeoJSON format.  Multiple regions can be set to show data at different zoom
//levels with different join fields.  This array must contain at least one element.
userVariables.regionsConfig = [{
    //The geoJSON containing the regions.  You _could_ put the whole geoJSON payload
    //here, but that might make things a bit difficult to read
    regionData: test_region_level1,
    //The chart needs 2 fields to render the data.  First, the field in the data
    //source containing the region name/id
    groupName: 'region_name1',
    //next, the name of the field in the geoJSON containing the same name/id
    regionField: 'name_1',
    //optionally you can set the min/max zoom levels for this layer
    //minZoomLevel not set, so will be shown out to global
    //if zoom levels overlap only the first one hit will be shown
    maxZoomLevel: 4 //won't show when zoomed in past level 10
},{
    regionData: test_region_level2,
    groupName: 'region_name2',
    regionField: 'name_2',
    minZoomLevel: 5,
    maxZoomLevel: 7
},{
    regionData: test_region_level3,
    groupName: 'region_name3',
    regionField: 'name_3',
    minZoomLevel: 8
    //maxZoomLevel not set, so will be shown all the way to most detailed
}];

/*
****************
End User Customization Section
Everything from here down is visualization logic
****************
*/

var dataLookup = {}; //this will contain the results from Zoomdata

// create a div for the map and add the leaflet map
var uuid = new Date().getTime();
var mapId = 'map-' + uuid;

var div = $(controller.element).append('<div id="' + mapId +
'" style="width:100%; height:100%" />').find(mapId).first();

$(div).addClass('map');

if(map !== undefined) {console.log('Map exists ', map);}
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
}());
