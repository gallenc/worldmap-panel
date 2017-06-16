## Using the world map panel with OpenNMS
To use the world map panel with OpenNMS, first import the OpenNMS datasource to grafana from https://grafana.com/plugins/opennms-datasource/installation

In the World Map tab select OpenNMS as the location data source

![Image](../master/src/images/worldMapOpenNMSWorldmapTabSettings.png)

OpenNMS does not generate geohashes but can be configured to include latitude and longitude data values within node data sets. There are two ways to do this.

Firstly, we can configure OpenNMS data collection to collect data values with latitude and longitude. If these values are stored in the time series database (rrd or cassandra) then they will be available with the other collected values for display.

Alternatively we can configure an OnmsNodeLatLon service for an interface on the node. This service copies the OpenNMS node's asset table latitude and longitude values into the time series database so that they can be referenced with time series data. 

To drive the world map panel, three data points must be defined with labels corresponding to $node.latitude, $node.longitude and $node.value.

If you are using templates, the template should define the $node name as illustrated in the following screenshots.

![Image](../master/src/images/worldMapOpenNMSDatasourceSettings.png)

![Image](../master/src/images/worldMapOpenNMSTemplateSettings.png)

