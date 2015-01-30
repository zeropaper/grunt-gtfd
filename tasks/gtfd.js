var FilesCollection = require('./../lib');

module.exports = function (grunt) {
  grunt.registerMultiTask('gtfd', 'Generates documentation', function () {
    var defaults = {};
    var options = this.options(defaults);

    this.files.forEach(function (files, num) {

      options.destination = files.dest || options.destination;
      options.cwd = files.orig.cwd || '';

      grunt.verbose.writeln('Processing documentation (num ' + num + ') destination ' +
                            options.destination + ' with ' + files.src.length + ' files.');

      var collection = new FilesCollection([], options);
      /*
      collection.on('all', function (evtName) {
        grunt.verbose.writeln('Documentation event ' + evtName + '...');
      });
      */
      collection.on('add', function (model) {
        grunt.verbose.writeln('Added ' + model.filepath + ' ' +
                              (model.isFile && !model.isDir ? 'file' : 'directory') +
                              ' to the documentation');
      });

      collection.on('change', function (model) {
        grunt.verbose.writeln('Changes on ' + model.filepath);
      });

      collection.on('writefile', function (model, destination) {
        grunt.verbose.oklns('Writing ' + model.filepath + ' documentation in ' + destination);
      });

      collection.on('copyasset', function (assetpath) {
        grunt.verbose.oklns('Copying ' + assetpath + ' asset');
      });

      collection.reset(FilesCollection.expand(files.src));
      collection.writeFiles();
    });
  });
};
