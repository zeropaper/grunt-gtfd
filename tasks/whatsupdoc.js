var lib = require('./../lib');

module.exports = function (grunt) {
  grunt.registerMultiTask('whatsupdoc', 'Generates documentation', function () {
    var defaults = {};
    var options = this.options(defaults);

    this.files.forEach(function (files) {
      lib.writeProjectDocumentation(files.src, files.dest, options);
    });
  });
};
