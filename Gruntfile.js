module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        bt: {
            dist: 'dist',
            src: ['src/youtube-video.js'],
            tests: {
                qunit: ['tests/*.js']
            }
        }
    });

    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt);

    grunt.registerTask('build', [
        'bt:build'
    ]);

    grunt.registerTask('test', [
        'bt:test'
    ]);

};