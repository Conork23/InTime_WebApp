var express = require('express');
var app = express();
var config = require('yaml-config');
var settings = config.readConfig('./config/app.yml');
var api = require('./routes/api');
var stats = require('./routes/stats');

// Setting View Engine
app.set('view engine', 'pug');

// Route to Home Page
app.get('/', function(req, res) {
    res.render('pages/home', {
        title: 'In Time',
        home: true
    });
});

// Setting routes
app.use(express.static('public'));
app.use(express.static('lib'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/api', api);
app.use('/stats', stats);

// making server object
var server = app.listen(settings.port, function() {
    console.log('Listening on port ' + settings.port + "...");
});

// Starting server
module.exports = server;
