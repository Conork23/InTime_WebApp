var express = require('express');
var router = express.Router();
var result = require("../controllers/result.js");
var helper = require("../controllers/helper.js");

router.get('/', function(req, res) {
    res.redirect('/');
});

// Request to get estimated travel_time
// Date input format is be yyyy-MM-dd HH:mm:ss
// Example Query for private travel from barry green to tolka estate at 7:30 11/12/2016 (mock data is enabled)
// http://localhost:3000/api/updatetime/private?time=2016-12-11%2007:30:00&to=tolka%20estate,%20dublin,%20ireland&from=%20barry%20green,ireland&mock=true&debug=false
router.get('/updateTime/:transport', (function(req, res) {
    var params = {
        dateTime: new Date(req.query.time).getTime(),
        to: req.query.to,
        from: req.query.from,
        debug: req.query.debug,
        mock: req.query.mock,
        transport_type: req.params.transport,
        transport_mode: helper.convertTransportModes(req.query.tmodes)
    };

    if(params.to == "mock" & params.from == "mock"){
      params.mock = 'true';
    }

    if (params.dateTime < (new Date().getTime())) {
        result.returnError(req, res, params);
    } else if (req.params.transport == "private") {
        result.getPrivate(req, res, params);
    } else if (req.params.transport == "public") {
        result.getPublic(req, res, params);
    }
}));

module.exports = router;
