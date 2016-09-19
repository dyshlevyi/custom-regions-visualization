/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
 */
'use strict';

/* global controller, Zoomdata, L, d3, $, _, statesData, countiesData, zipcodesData, gju, topojson */
var stateVariable = {
    "name":"state",
    "limit":400,
    "sort":{"dir":"desc","name":"count"},
    "label":"State",
    "type":"ATTRIBUTE"
}
controller.variables.State = JSON.stringify(stateVariable);
console.log("variables:",controller.variables);
var getDimensions = function(name, metricCallback) {

    var dimensions = {};
    var dataAccessors = controller.dataAccessors;

    _.forOwn(dataAccessors, function(value, key) {
        if (value.TYPE === value.TYPES.DIMENSION ||
            value.TYPE === value.TYPES.GROUP) {
            dimensions = value;
        }
    });

    return dimensions;
};

var getMetrics = function() {
    var dataAccessors = controller.dataAccessors;
    var metrics = {};

    _.forOwn(dataAccessors, function(value, key) {
        if (value.TYPE === value.TYPES.METRIC ||
            value.TYPE === value.TYPES.MULTI_METRIC) {
            metrics[key] = value;
        }
    });

    return metrics;
};

var stateAttribute = getDimensions().getGroup(0).name;
var countyAttribute = controller.variables.County;
var zipcodeAttribute = controller.variables['Zip Code'];
var linearScale = d3.scale.linear();
var quantileScale = d3.scale.quantile();
var level = 'states';
var style;
var centeredStateName;
var firstZoomLevel = 7;
var secondZoomLevel = 9;
var dataLookup = {};

controller.update = function(data, progress) {
    dataLookup = {};
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        dataLookup[item.group] = item;
    }

    geoJson.setStyle(style);
};

controller.eventDispatcher.on('Zoom:State', zoomByState);

function zoomByState(state) {
    var layers = geoJson.getLayers();
    var currentLayer = _.find(layers, function(layer) {
        return layer.feature.properties.name.toLowerCase() ===
            state.toLowerCase();
    });

    var layerCenter = currentLayer.getBounds().getCenter();
    var zoomLevel = state === 'Alaska' ? 4 : 6;

    map.setView([layerCenter.lat, layerCenter.lng], zoomLevel);
}

controller.clear = function() {
    dataLookup = {};
};

var uuid = new Date().getTime();
var mapId = 'map-' + uuid;

var div = $(controller.element).append('<div id="' + mapId +
'" style="width:100%; height:100%" />').find(mapId).first();

$(div).addClass('map');

var map = L.map('map-' + uuid).setView([37.8, -96], 4);


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

controller.resize = function(newWidth, newHeight, size) {
    if (size === 'small') {
        firstZoomLevel = 6;
        secondZoomLevel = 8;
    } else {
        firstZoomLevel = 7;
        secondZoomLevel = 9;
    }
    map.invalidateSize();
};

var stateBounds = {};
for (var i = 0; i < statesData.features.length; i++) {
    var feature = statesData.features[i];
    var coordinates = feature.geometry.coordinates;
    stateBounds[feature.properties.name] = coordinates;
}

var filter = null;

map.on('zoomstart', function() {
    controller.menu.hide();
});

map.on('moveend', function(e) {
    //Counties or Zip Codes
    var curAttribute;

    if (map.getZoom() >= firstZoomLevel) {
        var newCenteredStateName;
        var inBounds;
        var mapCenterLatLng = map.getCenter();

        for (var stateName in stateBounds) {
            if (stateBounds.hasOwnProperty(stateName)) {
                var boundsForState = stateBounds[stateName];

                for (var i = 0; i < boundsForState.length; i++) {
                    var bounds = boundsForState[i];
                    if (boundsForState.length === 1) {
                        bounds = [bounds];
                    }
                    inBounds = gju.pointInPolygon({
                        'type': 'Point',
                        'coordinates': [mapCenterLatLng.lng,
                            mapCenterLatLng.lat]
                    }, {
                        'type': 'Polygon',
                        'coordinates': bounds
                    });

                    if (inBounds) {
                        newCenteredStateName = stateName;
                        break;
                    }
                }
                if (inBounds && newCenteredStateName) {
                    break;
                }
            }
        }

        //Test if centered on a state
        if (!newCenteredStateName) {
            return;
        }

        //Counties
        if (map.getZoom() >= firstZoomLevel &&
            map.getZoom() <= secondZoomLevel) {
            if (level === 'counties' &&
                newCenteredStateName === centeredStateName) {
                return;
            } else if (level === 'zipcodes') {
                map.removeLayer(geoJson);
            }
            level = 'counties';
            if (centeredStateName &&
                newCenteredStateName !== centeredStateName) {
                map.removeLayer(geoJson);
            }
            centeredStateName = newCenteredStateName;

            curAttribute = controller.dataAccessors.State.getGroup();
            controller.dataAccessors.State
                .setGroup((curAttribute.name = countyAttribute, curAttribute));

            if (filter) {
                controller.query.filters.removeFilters(filter);
            }

            filter = {
                path: stateAttribute,
                value: [stateName],
                operation: 'IN'
            };
            controller.query.filters.addFilters(filter);

            map.removeLayer(geoJson);
            dataLookup = {};

            var countiesShapes = topojson.feature(countiesData[stateName],
                countiesData[stateName].objects.counties);
            geoJson = L.geoJson(countiesShapes, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

            //Zip Codes
        } else {
            if (level === 'zipcodes' &&
                newCenteredStateName === centeredStateName) {
                return;
            } else if (level === 'counties' || level === 'states') {
                map.removeLayer(geoJson);
            }
            level = 'zipcodes';
            if (centeredStateName &&
                newCenteredStateName !== centeredStateName) {
                map.removeLayer(geoJson);
            }
            centeredStateName = newCenteredStateName;

            curAttribute = controller.dataAccessors.State.getGroup();
            controller.dataAccessors.State
                .setGroup((curAttribute.name = zipcodeAttribute, curAttribute));

            if (filter) {
                controller.query.filters.removeFilters(filter);
            }

            filter = {
                path: stateAttribute,
                value: [stateName],
                operation: 'IN'
            };
            controller.query.filters.addFilters(filter);

            map.removeLayer(geoJson);
            dataLookup = {};

            var zipcodeShapes = topojson.feature(zipcodesData[stateName],
                zipcodesData[stateName].objects.zipcodes);
            geoJson = L.geoJson(zipcodeShapes, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);
        }

    } else if (map.getZoom() < firstZoomLevel && centeredStateName) {
        map.removeLayer(geoJson);

        if (filter) {
            controller.query.filters.removeFilters(filter);
            filter = null;
        }

        curAttribute = controller.dataAccessors.State.getGroup();
        controller.dataAccessors.State
            .setGroup((curAttribute.name = stateAttribute, curAttribute));

        level = 'states';

        centeredStateName = null;

        geoJson = L.geoJson(statesData, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    }
});

function style(feature) {
    var fillColor = 'rgb(245,245,245)';
    var id = level === 'states' ? feature.properties.name : feature.id;

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

    var featureId;
    if (level === 'states' && feature.properties.name) {
        featureId = feature.properties.name;
    } else if (level === 'counties' && feature.id) {
        featureId = feature.id;
    } else if (level === 'zipcodes' && feature.id) {
        featureId = feature.id;
    }

    if (!(featureId in dataLookup)) {
        return;
    }

    var data = dataLookup[featureId];
    controller.tooltip.show({
        event: e.originalEvent,
        data: function() {

            if (level === 'counties') {
                var newData = _.clone(data, true);
                newData.group[0] = feature.properties.name;
                return newData;
            }

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
    geoJson.resetStyle(e.target);
    controller.tooltip.hide();
}

function featureDetails(e) {
    var feature = e.target.feature;
    var featureId;
    if (level === 'states' && feature.properties.name) {
        featureId = feature.properties.name;
    } else if ((level === 'counties' || level === 'zipcodes') &&
        'id' in feature) {
        featureId = feature.id;
    }

    if (!(featureId in dataLookup)) {
        return;
    }

    controller.menu.show({
        event: e.originalEvent,
        data: function() {
            return dataLookup[featureId];
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

var geoJson = L.geoJson(statesData, {
    style: style,
    onEachFeature: onEachFeature
}).addTo(map);

controller.createAxisLabel({
    picks: 'Color',
    orientation: 'horizontal',
    position: 'bottom',
    popoverTitle: 'Color'
});
