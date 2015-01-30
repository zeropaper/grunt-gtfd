// # Gruntfile.js
// This file is used by [grunt](http://gruntjs.com) to perform tasks on the
// projects.
module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.task.loadTasks('./tasks');

  var sources = [
    'node_modules/ampersand-{state,model,collection}/ampersand-{state,model,collection}.js',
    'node_modules/ampersand-{state,model,collection}/{README,DOCUMENTATION}.md',
    'node_modules/{files-collection,faceted-search}/*.{css,js}',
    'node_modules/{files-collection,faceted-search}/{README,DOCUMENTATION}.md',

    'README.md', // will become `index.html`
    '{resources,test,tasks,lib}/**/{README,DOCUMENTATION}.md',
    'Gruntfile.js',
    'lib/**/*.js',
    'resources/themes/default/**/*.{jst,src.js,css}',
    'tasks/**/*.js'
  ];

  grunt.initConfig({
    docsDestination: 'docs',

    // ## gtfd task
    // Generates The Fine Documentation using [grunt-gtfd](http://github.com/zeropaper/grunt-gtfd)
    // (this project).
    gtfd: {
      project: {
        files: [
          {
            src: sources,
            dest: '<%= docsDestination %>'
          }
        ]
      },
      example: {
        files: [
          {
            cwd: 'resources/test',
            src: ['**/*'],
            dest: '<%= docsDestination %>/example'
          }
        ]
      }
    },

    // ## mochacli task configuration
    // Is used to run the test [mocha](http://mochajs.org) using grunt as if they were runned
    // using the CLI of mocha.
    mochacli: {
      options: {
        require: ['expect.js'],
        reporter: 'spec',
        bail: true
      },
      project: ['test/*Spec.js']
    },

    // ## clean task configuration
    // Remove files and directories before builds
    clean: ['docs'],

    // ## watch task configuration
    // Watches some project files and performs tasks when they change.
    watch: {
      options: {
        livereload: false,
      },

      project: {
        files: sources,
        tasks: ['build']
      },

      test: {
        files: ['test/**/*'],
        tasks: ['mochacli']
      },

      docs: {
        options: {
          livereload: 8281
        },
        files: ['<%= docsDestination %>/**/*'],
        tasks: []
      }
    },

    // ## connect task configuration
    // Serves the documentation with a small static files server and
    // injects a snippet (for livereload) in served HTML files.
    connect: {
      server: {
        options: {
          port: 8280,
          hostname: '0.0.0.0',
          livereload: 8281,
          base: '<%= docsDestination %>'
        }
      }
    }
  });

  // ## build task
  // Is the [grunt default task](#default-task) (can be fired using `grunt` only).
  // Is aimed to run the _clean_, _gtfd_ and _mochacli_ tasks in order to build
  // the project.
  grunt.registerTask('build', ['clean', 'gtfd', 'mochacli']);

  // ## dev-server task
  // Starts a [connect](#connect-task-configuration) (with livereloading)
  // and [watches](#watch-task-configuration) for changes
  grunt.registerTask('dev-server', ['build', 'connect', 'watch']);

  // ## default task
  // Is an alias for the [build](build-task)
  grunt.registerTask('default', ['build']);
};
