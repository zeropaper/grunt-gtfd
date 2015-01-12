module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.task.loadTasks('./tasks');

  grunt.initConfig({
    whatsupdoc: {
      options: {

      },

      project: {
        files: [
          'tasks/**/*.js'
        ]
      }
    }
  });

  grunt.registerTask('default', ['whatsupdoc']);
};
