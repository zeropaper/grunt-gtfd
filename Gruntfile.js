module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.task.loadTasks('./tasks');

  grunt.initConfig({
    whatsupdoc: {
      options: {

      },

      project: {
        files: [
          {
            src: [
              'lib/**/*.js',
              'resources/themes/default/assets/scripts/*.src.js',
              'resources/themes/default/assets/styles/*.css',
              'tasks/**/*.js'
            ],
            dest: 'docs'
          }
        ]
      }
    }
  });

  grunt.registerTask('default', ['whatsupdoc']);
};
