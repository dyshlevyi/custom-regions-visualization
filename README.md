**Custom Regions Map Visualziations**

Custom Regions is a map visualization for use in [Zoomdata](http://www.zoomdata.com).  This visualization allows administrators to create a new chart with map regions to match their organization's data, area, and business processes.

As of version 2.3 the map visualizations in Zoomdata are only available for global countries, or for U.S. data at state, county, and zip code level.  The underlying data must have fields with names and values that match the existing code.  Administrators can use Chart Studio to create their own map visualization.  This sample does that, abstracting the region configuration information to make it easy to specify new regions.

# Installation #

## Zoomdata versions supported ##
This visualization has been tested against the following Zoomdata versions:
* 2.2.10


# Configuration #
A user with access to Chart Studio in Zoomdata edits the code to configure the custom regions.

1. Open Chart Studio
2. Find the new custom chart and click 'Edit' in the table
3. Add variables <TODO>
4. Add libraries containing the regions <TODO>
5. Update user_configuration.js <TODO>

The custom chart must be associated with any data sources that contain regional data.

# Usage #
Once the chart has been configured users can add it to dashboards just like any other chart.

# For More Information #
Contact [Zoomdata](http://www.zoomdata.com).
