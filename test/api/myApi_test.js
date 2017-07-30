var request = require('supertest');
var helper = require('../../controllers/helper.js');
var assert = require('assert');



describe('My Api Testing', function() {
    var server;

    before(function() {
        server = require('../../index.js');
    });

    after(function(done) {
        server.close(done);
        console.log("Connection Closed");
    });

    describe('Route: Stats', function() {

        it('should respond 200 for GET /stats', function testSlash(done) {
            request(server)
                .get('/stats')
                .expect(200, done);
        });

    });

    describe('GET /api/updateTime', function() {

        var tests = [{
                args: ["public", "future"],
                status: "Ok"
            },
            {
                args: ["public", "past"],
                status: "ERROR"
            },
            {
                args: ["private", "future"],
                status: "Ok"
            },
            {
                args: ["private", "past"],
                status: "ERROR"
            }
        ];

        var locations = [{
                to: "Fairways Green, Dublin, Ireland",
                from: "Tolka Estate, Dublin, Ireland"
            },
            {
                to: "National College of Ireland, Dublin, Ireland",
                from: "Heuston Station, Dublin, Ireland"
            },
            {
                to: "Barry Green, Dublin, Ireland",
                from: "Connelly Station, Dublin, Ireland"
            },
            {
                to: "Liffey Valley, Dublin, Ireland",
                from: "Blackrock, Dublin, Ireland"
            },
            {
                to: "Blanchardstown, Dublin, Ireland",
                from: "Ravens Court, Dublin, Ireland"
            },
            {
                to: "Dunboyne, Meath, Ireland",
                from: "Clune Road, Dublin, Ireland"
            },
            {
                to: "Bettystown, Meath, Ireland",
                from: "Three Arena, Dublin, Ireland"
            }
        ];

        tests.forEach(function(test) {

            locations.forEach(function(location) {


                var url = "/api/updatetime/" +
                    test.args[0] + "?" +
                    "time=" + helper.getTime(test.args[1]) + "&" +
                    "to=" + location.to + "&" +
                    "from=" + location.from

                describe('Request Params: ' + test.args + ' with Locations To: ' + location.to + ' From: ' + location.from, function() {
                    it('should respond 200', function(done) {
                        request(server)
                            .get(url)
                            .expect(200, done);
                    });

                    it('should respond with JSON', function(done) {
                        request(server)
                            .get(url)
                            .expect('Content-Type', /json/, done);
                    });

                    it('should respond with status: ' + test.status, function(done) {
                        request(server)
                            .get(url)
                            .expect(res => {
                                assert(res.body.status, test.status);
                            })
                            .end((err, res) => {
                                if (err) return done(err);
                                done();
                            });

                    });

                    if (test.status == 'ERROR') {
                        it('should return an error code', function(done) {
                            request(server)
                                .get(url)
                                .expect(res => {
                                    if (!res.body.error_code) {
                                        assert.fail(res.body.error_code, "Error Code Present", "Error Code Not Present")
                                    }
                                })
                                .end((err, res) => {
                                    if (err) return done(err);
                                    done();
                                });
                        });
                    } else {
                        it('should return a new time stamp', function(done) {
                            request(server)
                                .get(url)
                                .expect(res => {
                                    if (!res.body.newTimeStamp) {
                                        assert.fail(res.body.newTimeStamp, "New Time Stamp Present", "New Time Stamp Not Present")
                                    }
                                })
                                .end((err, res) => {
                                    if (err) return done(err);
                                    done();
                                });
                        });
                    }

                });

            });
        });
    });


});
