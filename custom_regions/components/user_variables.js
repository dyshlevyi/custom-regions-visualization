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


//Specify the tile layer to show in the background of the map.  Use the provider
//function of Leaflet, which points to the major provider, or specify a tile
//layer not available in the provider object
//userVariables.tileLayer = L.tileLayer.provider('OpenStreetMap.BlackAndWhite')
//OpenStreetMap Mapnik
userVariables.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
//Example of specifying a tile layer that is not in provider, in this case
//a MapBox source:
/*
var mapboxURL = '<your URL here>';
userVariables.tileLayer = L.tileLayer(mapboxURL, {id: 'mapbox.streets', attribution: 'Mapbox Test Layer'});
*/

controller.scope.userVariables = userVariables;