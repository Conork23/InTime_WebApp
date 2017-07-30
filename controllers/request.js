var config = require('yaml-config');
var settings = config.readConfig('./config/app.yml');
var request = require('request');
var parse = require('csv-parse');
var fs = require("fs");
var helper = require('./helper.js');
var googleMaps = require('@google/maps').createClient({
    key: settings.Google.Key
});

module.exports = {

    // Make Request to Real Time Passenger Information
    getRTPI: function(type, step, callback) {

      if(type == 'BUS'){
        var query = {
            routeid: step.transit_details.name,
            stopid:  step.transit_details.stopId,
            format: 'json'
          };
      }
      else{
          var query = {
            stopid: step.transit_details.stopId,
            format: 'json'
          };
        }

        var options = {
            url: settings.RTPI + 'realtimebusinformation',
            method: 'GET',
            qs: query,
            rejectUnauthorized: false,
      };

      request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (type == 'LUAS') {
            body = helper.getLuasDirection(body, step);
          }else if (type == 'DART') {
            body = helper.getDartDirection(body, step);
          }
            callback(null, body);
          } else {
            callback(4, error);
          }
      });

    },

    // Make Google Directions Request for private transport
    getGooglePrivate: function(res, params, callback) {
        googleMaps.directions({
            origin: params.from,
            destination: params.to,
            mode: "driving",
            language: "en-GB",
            units: "metric",
            departure_time: params.dateTime,
        }, function(err, data) {
            if (!err) {
                callback(res, params, data);
            }
        });
    },

    // Make Google Directions Request for public transport
    getGooglePublic: function(res, params, callback) {

        googleMaps.directions({
            origin: params.from,
            destination: params.to,
            language: "en-GB",
            mode: "transit",
            units: "metric",
            departure_time: (params.dateTime) / 1000,
            transit_mode: params.transport_mode

        }, function(err, data) {
            if (!err) {
                callback(res, params, data);
            }
        });

    },

    // Get Mock Google data from CSV files
    getMockGoogle: function(res, params, callback) {
        var base = "./resources/mock_";
        var path = (params.transport_type == 'public') ? base + "publicGoogle.json" : base + "privateGoogle.json";
        fs.readFile(path, function(err, data) {
            if (!err) {
                var data = JSON.parse(data);
                callback(res, params, data);
            }
        });
    },

    // Get Mock RTPI data from CSV files
    getMockRTPI: function(res, callback) {
        var path = "./resources/mock_RTPI_"+res+".json";
        fs.readFile(path, function(err, data) {
            if (!err) {
                // var data = JSON.parse(data);
                callback(null, data);
            }
        });
    },

    // Get Stop id from CSV file.
    getStopID: function(type, step, returnCb) {
        readCSV(type,step, returnCb);

    }

};

// Read CSV file
function readCSV(type, step, callback){
  var path = '';
  var latIndex = 0;
  var lngIndex = 0;
  var idIndex = 0;
  var decimal = 0;

  if (type == 'BUS') {
    path = "./resources/busStops.csv";
    latIndex = 0;
    lngIndex = 2;
    idIndex = 3;
    decimal = 6;
  }
  else if (type == 'LUAS') {
    path = "./resources/luasStops.csv";
    latIndex = 2;
    lngIndex = 3;
    idIndex = 0;
    decimal = 3;
  }
  else if (type == 'DART') {
    path = "./resources/dartStops.csv";
    latIndex = 2;
    lngIndex = 3;
    idIndex = 0;
    decimal = 2;
  }

  fs.readFile(path, function(err, data) {
      if (!err) {
          parseCSV(type ,data, step, callback,  decimal, latIndex, lngIndex, idIndex );
      }
  });
}

// Parse CSV file
function parseCSV(type, data, step, callback,  decimal, latIndex, lngIndex, idIndex ){
  parse(data, {
      comment: '#'
  }, function(err, output) {
      busStopID = helper.getStopNumber(type,output, step, decimal, latIndex, lngIndex, idIndex );
      callback(null, busStopID);
  });

}
