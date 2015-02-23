module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        bt: {
            dist: 'dist',
            uglify: {
                files: {
                    'dist/youtube-video.js': ['src/youtube-video.js']
                }
            },
            browserify: {
                options: {
                    browserifyOptions: {
                        standalone: 'Video'
                    }
                },
                files: {
                    'dist/youtube-video-min.js': ['dist/youtube-video.js']
                }
            },
            tests: {
                qunit: {
                    src: ['tests/*.js']
                }
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