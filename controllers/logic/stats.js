var helper = require('../helper.js');

module.exports = {
  // Calculate accuracy
    calcAccuracy: function(data) {
        var all = [];
        var result = 0;

        for (var i = 0; i < data.length; i++) {
            var estimated = helper.convertDuration(data[i].estimated);
            var actual = helper.convertDuration(data[i].actual);
            if (actual === 0) {
                actual = 1*1000*60;
            }

            var diff = Math.abs(estimated - actual);
            var accuracy = (diff/actual)*100
            accuracy = 100 - accuracy;
            all.push(accuracy);
        }

        for (var i = 0; i < all.length; i++) {
            result = result + all[i];
        }
        result = result / all.length;
        return { 'mean':result, 'all': all};

    }
};
