var lib = require('./../lib');

module.exports = function (grunt) {
  grunt.registerMultiTask('whatsupdoc', 'Generates documentation', function () {
    var defaults = {};
    var options = this.options(defaults);

    console.info('whatsupdoc', [[arguments]]);
  });
};
