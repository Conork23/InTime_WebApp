var request = require('../request.js');
var r = require('request');
var helper = require('../helper.js');
var async = require("async");

module.exports = {
  // parsing Google Data and returning result for public travel
    googlePublic: function(response, res, params) {
        var error = 0;
        if (response.json.status == "OK") {
            var original_time = params.dateTime;
            var duration = response.json.routes[0].legs[0].duration.text;
            var newTimeStamp = helper.calculateNewTime(params.dateTime, duration);
            error = (newTimeStamp == "error") ? 1 : 0;

            var data = helper.setDataJson(
                response,
                duration,
                original_time,
                newTimeStamp,
                params.transport_type);

            var steps = helper.cleanSteps(response.json.routes[0].legs[0].steps);
            data['steps'] = steps;

        } else {
            error = 2
        }

        if (error > 0) {
            var data = helper.setErrorJson(response.json.status, error);
            res.send(data);
        } else {
            addStopNumbers(res, data);
        }
    }
};

// Getting public transport Stop Number
function getStopNumber(step, callback) {

    if (step.travel_mode == "TRANSIT" && step.transit_details.type == "Tram") {
        request.getStopID('LUAS',step, callback);
    }
    else if (step.travel_mode == "TRANSIT" && step.transit_details.type == "Bus") {
        request.getStopID('BUS',step, callback);
    }
    else if (step.travel_mode == "TRANSIT" && step.transit_details.type == "Train" && step.transit_details.name == "Dart") {
        request.getStopID('DART',step, callback);
    }
    else if (step.travel_mode == "MOCK" ) {
        callback(null, -2);
    }
    else {
        callback(null, -1);
    }
}

// Adding public stop number to data
function addStopNumbers(res, data) {
    var steps = data.steps;

    async.map(steps, getStopNumber, function(err, results) {
        if (!err) {
            for (var i = 0; i < results.length; i++) {
                if (data.steps[i].transit_details) {
                    data.steps[i].transit_details['stopId'] = results[i];
                }
            }
            addWaitingTime(res, data);
        }
    });
}

// Getting Waiting times for public transport
function getWaitingTime(step, callback) {

    if (step.travel_mode == "TRANSIT" && step.transit_details.type == "Tram") {
        request.getRTPI('LUAS', step, callback);
    }
    else if (step.travel_mode == "TRANSIT" && step.transit_details.type == "Bus") {
        request.getRTPI('BUS', step, callback);
    }
    else if (step.travel_mode == "TRANSIT" && step.transit_details.type == "Train" && step.transit_details.name == "Dart") {
        request.getRTPI('DART',step, callback);
    }
    else if (step.travel_mode == "MOCK" && step.transit_details.type == "Tram") {
        request.getMockRTPI('luas', callback);
    }
    else if (step.travel_mode == "MOCK" && step.transit_details.type == "Bus") {
        request.getMockRTPI('bus', callback);
    }
    else {
        callback(null, -1);
    }
}

// Calculating new travel time that includes waiting times
function addWaitingTime(res, data) {

    var now = new Date();
    var minTilActivation = Math.round((data.timeStamp - now.getTime()) / 1000 / 60);
    var steps = data.steps;
    if (steps[0].travel_mode == 'MOCK') {
      minTilActivation = 20;
    }
    var travel_time = 0;

    async.map(steps, getWaitingTime, function(err, results) {
        if (!err) {
          console.log("=============================================");
          console.log("===========Calculating Travel Time===========");
          console.log("=============================================");


            for (var i = 0; i < results.length; i++) {
                var duration = helper.convertDuration(steps[i].duration) / 1000 / 60
                if (results[i] == -1) {
                    console.log("Walking");
                    console.log("Mins Before: " +minTilActivation);
                    travel_time += Number(duration);
                    minTilActivation += Number(duration);
                    console.log("Duration: "+ duration);
                    console.log("Mins After: " +minTilActivation);
                    console.log("---------------------------------------------");
                } else {
                  console.log("Transit");
                  console.log("Mins Before " +minTilActivation);
                    var waiting_time = helper.calcWaitingTime(results[i], minTilActivation);
                    travel_time += (Number(waiting_time) + Number(duration));
                    minTilActivation += (Number(waiting_time) + Number(duration));
                    console.log("Duration: "+ duration);
                    console.log("Min After: " +minTilActivation);
                    console.log("---------------------------------------------");
                    data.steps[i].transit_details['waiting_time'] = waiting_time + " mins";
                }
            }
            console.log("Travel Time from Activation: "+travel_time);
            console.log("Travel Time from Now: "+ minTilActivation);
            console.log("=============================================");


            data = helper.updateDataTime(data, travel_time);
        } else {
            console.log(results);
            data = helper.setErrorJson(err, results);
        }
        sendResponse(res, data);
    });
}

// Return data
function sendResponse(res, data) {
    res.send(data);
}
