module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        bt: {

            dist: 'dist',
            build: {
                files: {
                    'dist/youtube-video-min.js': ['src/youtube-video.js']
                },
                browserifyOptions: {
                    standalone: 'Video'
                }
            },
            min: {
                files: {
                    'dist/youtube-video.js': ['src/youtube-video.js']
                }
            },
            banner: {
                files: ['dist/*']
            },
            tests: {
                qunit: {
                    src: ['tests/*.js']
                }
            }
        }
    });

    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt, {pattern: ['build-tools', 'grunt-*']});

    grunt.registerTask('test', [
        'bt:test'
    ]);

};