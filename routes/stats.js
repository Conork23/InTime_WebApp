var express = require('express');
var bodyParser = require('body-parser');
var config = require('yaml-config');
var statistics = require("../controllers/logic/stats.js");
var settings = config.readConfig('./config/app.yml');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var db;

router.use(bodyParser.json());

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/" + settings.dbName, function(err, database) {
    if (!err) {
        db = database;
        console.log("Connection Success");
    }
});

// Route to get stats page
router.get('/', function(req, res) {
    db.collection(settings.dbEvalCollection).find().toArray((err, result) => {
        if (err) return console.log(err);
        // if (req.query.raw == "true") {
        //     res.json(result)
        // }
        var stats = statistics.calcAccuracy(result);
        stats.mean = stats.mean.toFixed(2);
        res.render('pages/stats', {
            title: 'Stats',
            result: result,
            accuracy: stats,
        });
    })
});

// Route to send statistic
router.post('/', function(req, res) {
    if(( req.body.arrivedOnTime == true || req.body.arrivedOnTime == false )
    && req.body.to && req.body.from && (req.body.isPublic == true || req.body.isPublic == false )){
      var json = {
        'arrivedOnTime': req.body.arrivedOnTime,
        'from': req.body.from,
        'isPublic': req.body.isPublic,
        'to':req.body.to
      }

      db.collection(settings.dbStatsCollection).insert(json, (err, result) => {
          if (err) return console.log(err);
          res.redirect('/stats');
      });

    }else{
      res.redirect('/stats');
    }

});

// This get request is used incase a post is made to /stats/eval over http and nginx redirects
router.get('/eval', function(req, res){
    res.redirect('/stats');
});

// Route to send evaluation object
router.post('/eval', function(req, res) {
  if(req.body.actual && req.body.estimated && req.body.to && req.body.from && (req.body.isPublic == true || req.body.isPublic == false ) && req.body.time){
    var json = {
      'actual': req.body.actual,
      'estimated':req.body.estimated ,
      'from': req.body.from,
      'isPublic': req.body.isPublic,
      'time': req.body.time,
      'to':req.body.to
    }

    db.collection(settings.dbEvalCollection).insert(json, (err, result) => {
        if (err) return console.log(err);
        res.redirect('/stats');
    });

  }else{
    res.redirect('/stats');
  }
});

// Route to get Statistics
router.get('/ajax/', function(req, res){

  var search_term = {};
  var options = {_id: false}
  var to= req.query.to || ""
  var from = req.query.from || ""
  search_term = {'from': new RegExp(from, 'i'),
                  'to': new RegExp(to, 'i')};

  if(req.query.distinct){
    var type = "";
    if (to != "") {
      type = "to";
    }else if (from != "") {
      type = "from";
    }
    db.collection(settings.dbStatsCollection).distinct(type,search_term,(err, result) =>{
      if (err) return console.log(err);
      // json = [];
      // for (var loc in result) {
      //   json.push({"location":result[loc]});
      // }
      res.json(result);
    });
  }else{
    db.collection(settings.dbStatsCollection).find(search_term,options).toArray((err, result) =>{
      if (err) return console.log(err);
      res.json(result);
    });
  }

});

module.exports = router;
