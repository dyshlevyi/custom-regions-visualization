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

controller.scope.userVariables = userVariables;