var publicLogic = require("./logic/public.js");
var privateLogic = require("./logic/private.js");
var request = require("./request.js");
var helper = require('./helper.js');

// callback for google request
var logicCallback = function(res, params, data) {
    if (params.debug == 'true') {
        res.send(data);
    } else {
        if (params.transport_type == 'private') {
            privateLogic.googlePrivate(data, res, params);
        } else if (params.transport_type == 'public') {
            publicLogic.googlePublic(data, res, params);
        }
    }
};

module.exports = {
    // Make Reponse for Private Transport
    getPrivate: function(req, res, params) {
        if (params.mock == 'true') {
            request.getMockGoogle(res, params, logicCallback);
        } else {
            request.getGooglePrivate(res, params, logicCallback);
        }
    },

    // Make Reponse for Public Transport
    getPublic: function(req, res, params) {
        if (params.mock == 'true') {
            request.getMockGoogle(res, params, logicCallback);
        } else {
            request.getGooglePublic(res, params, logicCallback);
        }
    },

    // Return Error
    returnError: function(req, res, params) {
        var status = "Null";
        var data = helper.setErrorJson(status, 3)
        res.send(data);
    }
};
