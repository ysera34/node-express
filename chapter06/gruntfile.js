module.exports = function(grunt){

  // plugin loading
  [
    'grunt-cafe-mocha',
    'grunt-contrib-jshint',
    'grunt-exec',
  ].forEach(function(task){
    grunt.loadNpmTasks(task);
  });

  //plugin configuration
  grunt.initConfig({
    cafemocha: {
      all: { src:'qa/tests-*.js', options:{ui:'tdd'}, }
    },
    jshint: {
      app: ['index.js', '/public/js/**/*.js', 'lib/**/*.js'],
      qa: ['gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
    },
    exec: {
      linkchecker:
      { cmd: 'linkchecker http://localhost:3000' }
    },
  });

  //register task
  grunt.registerTask('default', ['cafemocha', 'jshint', 'exec']);
};
