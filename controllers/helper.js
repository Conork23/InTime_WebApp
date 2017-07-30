var moment = require('moment');
var config = require('yaml-config');
var settings = config.readConfig('./config/app.yml');


module.exports = {

    // converting duration retuned, as text, by google to timestamp
    convertDuration: function(duration) {
        var regex = /^[0-9]+\s[hourmins]+\s?[0-9]*\s?[hourmins]*$/;
        if (duration.match(regex)) {
            var split_duration = duration.split(" ");
            var time;
            if (split_duration.length == 2) {
                time = (split_duration[0] * 60 * 1000);
            } else if (split_duration.length == 4) {
                var hour = (split_duration[0] * 60);
                var min = split_duration[2];
                time = ((Number(hour) + Number(min)) * 60 * 1000);
            }
            return time;
        } else {
            return "error";
        }

    },

    // Convert String Transport modes to array
    convertTransportModes: function(tmodes){
      var modes = [];

      if (tmodes != undefined &&   tmodes != "") {
        if (tmodes.match(/bus/i)) {
          modes.push('bus');
        }
        if (tmodes.match(/train/i)) {
          modes.push('train');
        }
        if (tmodes.match(/tram/i)) {
          modes.push('tram');
        }
      }

      if (modes.length == 0) {
        modes = ['bus','train','tram'];
      }
      return modes;
    },

    // Adding duration timestamp to original alarm timestamp
    calculateNewTime: function(old, duration) {
        var error = false;
        var durTime = this.convertDuration(duration);
        if (durTime == "error") {
            error = true;
        } else {
            var newTime = Number(old) + Number(durTime);
        }
        return (error) ? "error" : newTime;
    },

    // Coverting UNIX ms Timestamp
    dateTimeFormat: function(timestamp) {
        return moment(timestamp).format(settings.dateTimeFormat);
    },

    // Extracts only needed data from steps object in google reponse
    cleanSteps: function(steps) {
        var cleaned = [];

        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var data = {
                'duration': step.duration.text,
                'travel_mode': step.travel_mode
            }

            if (data.travel_mode == "TRANSIT" || data.travel_mode == "MOCK" ) {
                data.transit_details = {
                    'type': step.transit_details.line.vehicle.name,
                    'name': step.transit_details.line.name || step.transit_details.line.short_name,
                    'from': step.transit_details.departure_stop.name,
                    'headsign': step.transit_details.headsign,
                    'location': step.transit_details.departure_stop.location
                }
            }

            cleaned[i] = data;
        }

        return cleaned;

    },

    // Sets the Error Data to be Returned
    setErrorJson: function(status, error) {
        // error codes:
        //    1 == Convert Duration Error (time regex no match)
        //    2 == Google response not OK
        //    3 == Departure Date is older than now
        //    4 == Error making request to RTPI

        var message = "Null";
        if (error == 1 || error == 2) {
            message = "An Error while has occured making a request to google directions API";
        } else if (error == 3) {
            message = "Departure time was in the past. It must be in the future.";
        } else if (error == 4) {
            message = "An Error occured while make a request to RTPI";
        }

        var data = {
            'status': "ERROR",
            'error_code': error,
            'external_status': status,
            'message': message
        }

        return data;
    },

    // Sets the Data to be returned
    setDataJson: function(response, calcDur, ot, nt, type) {

        var data = {
            'status': 'OK',
            'origin': {
                'address': response.json.routes[0].legs[0].start_address,
                'lat': response.json.routes[0].legs[0].start_location.lat,
                'lng': response.json.routes[0].legs[0].start_location.lng,
            },
            'destination': {
                'address': response.json.routes[0].legs[0].end_address,
                'lat': response.json.routes[0].legs[0].end_location.lat,
                'lng': response.json.routes[0].legs[0].end_location.lng,
            },
            'distance': response.json.routes[0].legs[0].distance.text,
            // 'duration': response.json.routes[0].legs[0].duration.text,
            'calculated_duration': calcDur,
            'original_time': this.dateTimeFormat(ot),
            'timeStamp': ot,
            'approx_arrival': this.dateTimeFormat(nt),
            'newTimeStamp': nt,
            'type': type
        }

        return data;
    },

    // Gets Stop number from CSV file
    getStopNumber: function(type, csvData, step, decimalCount, latIndex, lngIndex, idIndex ){
      var lat = this.dropDecimals(step.transit_details.location.lat, decimalCount);
      var lng = this.dropDecimals(step.transit_details.location.lng, decimalCount);
      var stopId = -1;

      for (var i = 0; i < csvData.length; i++) {
          var csvLat = this.dropDecimals(csvData[i][latIndex], decimalCount)
          var csvLng = this.dropDecimals(csvData[i][lngIndex], decimalCount)

          if (csvLat == lat && csvLng == lng) {
              stopId = (type == 'BUS')? csvData[i][idIndex].slice(-4) : csvData[i][idIndex];
              break;
          }
      }

      return (type == 'BUS')? Number(stopId) : stopId;
    },

    // Get the direction of the luas
    getLuasDirection: function(body, step){
      var inboundLocations = "Connelly, The Point, Stephens Green";
      var isInbound = false;
      if(inboundLocations.includes(step.transit_details.headsign)){
        isInbound = true;
      }
      body = JSON.parse(body);
      var filtered = []
      body.results.forEach((result)=>{
        if(isInbound && result.direction == "Inbound"){
          filtered.push(result);
        }else if(!isInbound && result.direction == "Outbound"){
          filtered.push(result);
        }
      });
      body.results = filtered;
      return JSON.stringify(body);
    },

    //  Get the direction of the Dart
    getDartDirection: function(body, step){
      var northboudLocations = "Howth, Malahide, Portmarnock, Clongriffin";
      var isNorthbound = false;
      var headsign = step.transit_details.headsign.split(" ");
      if(northboudLocations.includes(headsign[0])){
        isNorthbound = true;
      }
      body = JSON.parse(body);
      var filtered = []
      body.results.forEach((result)=>{
        if(isNorthbound && result.direction == "Northbound"){
          filtered.push(result);
        }else if(!isNorthbound && result.direction == "Southbound"){
          filtered.push(result);
        }
      });
      body.results = filtered;
      return JSON.stringify(body);
    },

    // Drops x Decimals from a Float
    dropDecimals: function(number, amount) {
        number = number + "";
        var point = number.indexOf('.');
        if (point == -1) {
            return number;
        }
        return (amount == 0) ? number.slice(0, point) : number.slice(0, point + (amount + 1));

    },

    // Gets the Waiting time.
    calcWaitingTime: function(json, minTilActivation) {
        var wait = 0;
        var json = JSON.parse(json);
        var results = json.results;
        // console.log(results);
        // console.log(json.stopid);
        for (var i = 0; i < results.length; i++) {
            var due = results[i].duetime;
            if (due == "Due") { due = 0;}
            console.log( "Due in: "+due +" | Mins until Arrival at Stop: "+ minTilActivation);
            if (due >= minTilActivation) {
                wait = Number(due) - Number(minTilActivation);
                console.log( "Waiting Time: "+ wait);
                break;
            }
        }

        return wait;
    },

    // Updates the time in the Data
    updateDataTime: function(data, travel_time) {
        data.calculated_duration = travel_time + " mins";
        var newTime = this.calculateNewTime(data.timeStamp, data.calculated_duration);
        data.newTimeStamp = newTime;
        data.approx_arrival = this.dateTimeFormat(newTime);
        return data;
    },

    // Gets a time either in the past or future (Used for testing)
    getTime: function(when) {
        var now = new Date();
        var time = new Date(now);

        if (when == "future") {
            time.setHours(now.getHours() + 1);
        } else if (when == "past") {
            time.setHours(now.getHours() - 1);
        }

        time = moment(time).format("YYYY-MM-DD HH:mm:ss")
        return time;
    }

};
