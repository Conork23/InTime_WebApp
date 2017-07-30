var helper = require('../../controllers/helper.js');
var assert = require('assert');

describe('Helper Js', function() {
    describe('Convert Duration', function() {
        it('should convert duration string to timestamp: 10 mins', function() {
            assert.equal(600000, helper.convertDuration("10 mins"));
        });
        it('should convert duration string to timestamp: e mins', function() {
            assert.equal('error', helper.convertDuration("e mins"));
        });
        it('should convert duration string to timestamp: 0 mins', function() {
            assert.equal(0, helper.convertDuration("0 mins"));
        });
        it('should convert duration string to timestamp: 1 hour 10 mins', function() {
            assert.equal(4200000, helper.convertDuration("1 hour 10 mins"));
        });
    });

    describe('Calculate New Time', function() {
        it('should add two timestamps together: 10 mins', function() {
            assert.equal(1200000, helper.calculateNewTime(600000, "10 mins"));
        });
        it('should add two timestamps together: er mins', function() {
            assert.equal('error', helper.calculateNewTime(600000, "er mins"));
        });
        it('should add two timestamps together: 0 mins', function() {
            assert.equal(600000, helper.calculateNewTime(600000, "0 mins"));
        });
        it('should add two timestamps together: 1 hour 10 mins', function() {
            assert.equal(4260000, helper.calculateNewTime(600000, "1 hour 1 min"));
        });
    });

    describe('Drop Decimals', function() {
        it('should drop the decimals of a float: 2 decimals ', function() {
            assert.equal("1.12", helper.dropDecimals(1.123456, 2));
        });
        it('should drop the decimals of a float: 0 decimals ', function() {
            assert.equal("1", helper.dropDecimals(1.123456, 0));
        });
        it('should drop the decimals of a float: more decimals', function() {
            assert.equal("1.123456", helper.dropDecimals(1.123456, 10));
        });
        it('should drop the decimals of a float: less decimals ', function() {
            assert.equal("1000", helper.dropDecimals(1000, 2));
        });
    });
});
