var request = require('../request.js');
var helper = require('../helper.js');

module.exports = {
  // parsing Google Data and returning result for private travel
    googlePrivate: function(response, res, params) {
        var error = 0;

        if (response.json.status == "OK") {
            var original_time = params.dateTime;
            var duration_in_traffic = response.json.routes[0].legs[0].duration_in_traffic.text;
            var newTimeStamp = helper.calculateNewTime(params.dateTime, duration_in_traffic);
            error = (newTimeStamp == "error") ? 1 : 0;

            var data = helper.setDataJson(
                response,
                duration_in_traffic,
                original_time,
                newTimeStamp,
                params.transport_type);

        } else {
            error = 2
        }

        if (error > 0) {
            var data = helper.setErrorJson(response.json.status, error);
        }

        res.send(data);
    }
};
