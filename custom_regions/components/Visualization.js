/*
 * Copyright (C) Zoomdata, Inc. 2012-2016. All rights reserved.
 */
/* global controller */
console.log('zoomdata object: ', zd);
userVariables = controller.scope.userVariables;
console.log('user variables:',userVariables);
// create a div for the map and add the leaflet map
var uuid = new Date().getTime();
var mapId = 'map-' + uuid;

var div = $(controller.element).append('<div id="' + mapId +
'" style="width:100%; height:100%" />').find(mapId).first();

$(div).addClass('map');

var map = L.map('map-' + uuid).setView(userVariables.initialExtent.centerPoint, 
                                       userVariables.initialExtent.zoomLevel);

// TODO: here the tile service is set.  If you want a different tile service 
//  make the change here, either using the leaflet provider extension or a
//  custom tile server
userVariables.tileLayer.addTo(map);

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
console.log(controller.element);

controller.update = function(data, progress) {
    // Called when new data arrives
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


