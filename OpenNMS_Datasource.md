## Using the world map panel with OpenNMS
To use the world map panel with OpenNMS, first import the OpenNMS datasource to grafana from https://grafana.com/plugins/opennms-datasource/installation

In the World Map tab select OpenNMS as the location data source

![Image](../master/src/images/worldMapOpenNMSWorldmapTabSettings.png)

OpenNMS does not generate geohashes but must be configured to include latitude and longitude data coordinates within node data sets. 
These coordinates can then be referenced by the world map panel.
To drive the world map panel, three data points must be defined with labels corresponding to $node.latitude, $node.longitude and $node.value.
Where $node is either the node id or foreignSource:foreignId of the node. 

As with other data sources, the value is used to drive the colour and size of of the circle drawn at the coordinates. If a time range is given to the OpenNMS query, a time ordered set of coordinates and values will be returned. However the circle will be drawn using the latest received coordinates within the set which correspond to values which are not NaN (not a number). (We do not aggregate the received values because this can be done by OpenNMS itself within a data source expression query).

Alternatively if you are using templates, the template should define the $node name as illustrated in the following screenshots.
You need 3 variables with labels ; $node.latitude, $node.longitude, $node.value.

![Image](../master/src/images/worldMapOpenNMSDatasourceSettings.png)

![Image](../master/src/images/worldMapOpenNMSTemplateSettings.png)

### Storing Latitude and Longitude data in OpenNMS time series data sets

In order to pass Latitude and Longitude data to grafana, they must be included in the OpenNMS time series data sets which the OpenNMS data source can reference.
There are two ways to do this.

Firstly, we can configure OpenNMS data collection to collect latitude and longitude data values if they are available from the data which OpenNMS is collecting. If these values are stored in the time series database (rrd or cassandra) then they will be available with the other collected values for display.

Alternatively if the source being collected does not have latitude and longitude data we can use the latitude and longitude values stored in the node asset table by configuring an OnmsNodeLatLon service for an interface on the node. This service copies the OpenNMS node's asset table latitude and longitude values into the time series database with each data collection so that they can be referenced along with time series data.

The following changes to the OpenNMS configuration will create a OnmsNodeLatLon service which can save node asset table latitude and longitude values in the time series performance database (RRD or Cassandra). Once defined, the OnmsNodeLatLon service can be configured on any node interface(through a provision requisition) so that data collected from that node will also have the node's latitude and longitude values.

This following configuration changes give you a starting point to define an OnmsNodeLatLon service however to understand how the XML Collector works, and how to configure it, please also check the following link: http://www.opennms.org/wiki/XML_Collector 

(in the following $opennms-home is the location of OpenNMS installation e.g. /opt/opennms in centos)

$opennms-home/etc/collectd-configuration.xml

```
    <package name="example1">
    ...
        <!-- service to save latitude and longitude of opennms node in time series data -->
        <service name="OnmsNodeLatLon" interval="300000" user-defined="false" status="on">
            <parameter key="collection" value="xml-onms-node-latlon" />
        </service>
    </package>

    <collector service="OnmsNodeLatLon" class-name="org.opennms.protocols.xml.collector.XmlCollector"/>

```
$opennms-home/etc/xml-datacollection-config.xml
```
<xml-datacollection-config rrdRepository="/opt/opennms/share/rrd/snmp/" xmlns="http://xmlns.opennms.org/xsd/config/xml-datacollection">
....

  <!-- collection for opennms node latitude and longitude -->
  <xml-collection name="xml-onms-node-latlon">
    <rrd step="300">
      <rra>RRA:AVERAGE:0.5:1:2016</rra>
      <rra>RRA:AVERAGE:0.5:12:1488</rra>
      <rra>RRA:AVERAGE:0.5:288:366</rra>
      <rra>RRA:MAX:0.5:288:366</rra>
      <rra>RRA:MIN:0.5:288:366</rra>
    </rrd>
    <!-- admin:admin - change to opennms rest account / password -->
    <xml-source url="http://admin:admin@127.0.0.1:8980/opennms/rest/nodes/{foreignSource}:{foreignId}/assetRecord">
      <import-groups>xml-datacollection/xml-onms-node-latlon.xml</import-groups>
    </xml-source>
  </xml-collection>
</xml-datacollection-config>
```
$opennms-home/etc/xml-datacollection/xml-onms-node-latlon.xml

```
<xml-groups>
  <xml-group name="device" resource-type="node" resource-xpath="/assetRecord">
    <xml-object name="latitude" type="GAUGE" xpath="latitude" />
    <xml-object name="longitude" type="GAUGE" xpath="longitude" />
  </xml-group>
</xml-groups>
```
If you want to see an opennms graph of the latitude/longitude add the following graph definition
$opennms-home/etc/snmp-graph.properties.d/onms-node-latlon.properties
```
reports=opennms.asset.latitude, \
opennms.asset.longitude

## latitude and longitude for OnmsNodeLatLon service
## <xml-object name="latitude" type="GAUGE" xpath="latitude" />
report.opennms.asset.latitude.name=latitude
report.opennms.asset.latitude.columns=latitude
report.opennms.asset.latitude.type=nodeSnmp
report.opennms.asset.latitude.command=--title="latitude" \
 DEF:v1={rrd1}:latitude:AVERAGE \
 LINE2:v1#ff0000:"latitude" \
 GPRINT:v1:AVERAGE:"    Avg\\: %8.2lf %s" \
 GPRINT:v1:MIN:"Min\\: %8.2lf %s" \
 GPRINT:v1:MAX:"Max\\: %8.2lf %s\\n"

## <xml-object name="latitude" type="GAUGE" xpath="longitude" />
report.opennms.asset.longitude.name=longitude
report.opennms.asset.longitude.columns=longitude
report.opennms.asset.longitude.type=nodeSnmp
report.opennms.asset.longitude.command=--title="longitude" \
 DEF:v1={rrd1}:longitude:AVERAGE \
 LINE2:v1#ff0000:"longitude" \
 GPRINT:v1:AVERAGE:"    Avg\\: %8.2lf %s" \
 GPRINT:v1:MIN:"Min\\: %8.2lf %s" \
 GPRINT:v1:MAX:"Max\\: %8.2lf %s\\n"

```


