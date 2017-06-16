import _ from 'lodash';
import decodeGeoHash from './geohash';

export default class DataFormatter {
  constructor(ctrl, kbn) {
    this.ctrl = ctrl;
    this.kbn = kbn;
  }

  setValues(data) {
    if (this.ctrl.series && this.ctrl.series.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      this.ctrl.series.forEach((serie) => {
        const lastPoint = _.last(serie.datapoints);
        const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;
        const location = _.find(this.ctrl.locations, (loc) => { return loc.key.toUpperCase() === serie.alias.toUpperCase(); });

        if (!location) return;

        if (_.isString(lastValue)) {
          data.push({key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0});
        } else {
          const dataValue = {
            key: serie.alias,
            locationName: location.name,
            locationLatitude: location.latitude,
            locationLongitude: location.longitude,
            value: serie.stats[this.ctrl.panel.valueName],
            valueFormatted: lastValue,
            valueRounded: 0
          };

          if (dataValue.value > highestValue) highestValue = dataValue.value;
          if (dataValue.value < lowestValue) lowestValue = dataValue.value;

          dataValue.valueRounded = this.kbn.roundValue(dataValue.value, parseInt(this.ctrl.panel.decimals, 10) || 0);
          data.push(dataValue);
        }
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }

  setGeohashValues(dataList, data) {
    if (!this.ctrl.panel.esGeoPoint || !this.ctrl.panel.esMetric) return;

    if (dataList && dataList.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      dataList[0].datapoints.forEach((datapoint) => {
        const encodedGeohash = datapoint[this.ctrl.panel.esGeoPoint];
        const decodedGeohash = decodeGeoHash(encodedGeohash);

        const dataValue = {
          key: encodedGeohash,
          locationName: this.ctrl.panel.esLocationName ? datapoint[this.ctrl.panel.esLocationName] : encodedGeohash,
          locationLatitude: decodedGeohash.latitude,
          locationLongitude: decodedGeohash.longitude,
          value: datapoint[this.ctrl.panel.esMetric],
          valueFormatted: datapoint[this.ctrl.panel.esMetric],
          valueRounded: 0
        };

        if (dataValue.value > highestValue) highestValue = dataValue.value;
        if (dataValue.value < lowestValue) lowestValue = dataValue.value;

        dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }
  
  setOpenNMSValues(dataList, data) {
    if (dataList && dataList.length > 0) {
      
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;
      
      // find the datapoint names
      const dataNames = [];
      for (var x = 0; x < dataList.length; x++){
        if(dataList[x].target){
          var pos = dataList[x].target.lastIndexOf(".latitude");
          if (pos > 0 ) {
            var name = dataList[x].target.substring(0, pos);
            dataNames.push(name);
          }
        }
      }
      // fill in the values for the datapoint names
      for (var i = 0; i < dataNames.length; i++){
        let latvar;
        let lonvar;
        let valvar;
        for (let y = 0; y < dataList.length; y++){
          if(dataList[y].target && dataList[y].target.includes(dataNames[i])){
            let datapoints = dataList[y].datapoints;
            let dp;
            let num;
            if (datapoints && datapoints.length!=0){
              let z=datapoints.length-1;
              // find last value in list which is a number
              do {
                dp = datapoints[z]; 
                num = dp[0]; // dp[o] = value dp[1] = timestamp 
                if (! isNaN(num) ) break;
                z--;
              } while (z>0);
              if (! isNaN(num) ){
                if(dataList[y].target.includes("latitude")){
                  latvar=num;
                } else if(dataList[y].target.includes("longitude")) {
                  lonvar=num;
                } else if(dataList[y].target.includes("value")){ 
                  valvar=num;
                }
              }
            }
          }
        }
        if(latvar && lonvar && valvar) { // if we have all 3 numbers create a datapoint
          const dataValue = {
            key: dataNames[i],
            locationName: dataNames[i],
            locationLatitude: latvar,
            locationLongitude: lonvar,
            value: valvar,
            valueFormatted: valvar,
            valueRounded: valvar
          };
          
          if (dataValue.value > highestValue) highestValue = dataValue.value;
          if (dataValue.value < lowestValue) lowestValue = dataValue.value;

          dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
          
          data.push(dataValue);
        }
      }

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    } 
    
  }

  
  static tableHandler(tableData) {
    const datapoints = [];

    if (tableData.type === 'table') {
      const columnNames = {};

      tableData.columns.forEach((column, columnIndex) => {
        columnNames[columnIndex] = column.text;
      });

      tableData.rows.forEach((row) => {
        const datapoint = {};

        row.forEach((value, columnIndex) => {
          const key = columnNames[columnIndex];
          datapoint[key] = value;
        });

        datapoints.push(datapoint);
      });
    }

    return datapoints;
  }

  setTableValues(tableData, data) {
    if (tableData && tableData.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      tableData[0].forEach((datapoint) => {
        if (!datapoint.geohash) {
          return;
        }

        const encodedGeohash = datapoint.geohash;
        const decodedGeohash = decodeGeoHash(encodedGeohash);

        const dataValue = {
          key: encodedGeohash,
          locationName: datapoint[this.ctrl.panel.tableLabel] || 'n/a',
          locationLatitude: decodedGeohash.latitude,
          locationLongitude: decodedGeohash.longitude,
          value: datapoint.metric,
          valueFormatted: datapoint.metric,
          valueRounded: 0
        };

        if (dataValue.value > highestValue) highestValue = dataValue.value;
        if (dataValue.value < lowestValue) lowestValue = dataValue.value;

        dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }
}
