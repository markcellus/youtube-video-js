module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        bt: {

            dist: 'dist',
            build: {
                files: {
                    'dist/youtube-video-min.js': ['dist/youtube-video.js']
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
        },
        copy: {
            lib: {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components/element-kit/src',
                        src: ['**/*'],
                        dest: 'src/libs/element-kit/'
                    },
                    {
                        src: 'bower_components/underscore/underscore.js',
                        dest: 'src/libs/underscore/underscore.js'
                    }
                ]
            }
        }
    });

    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt, {pattern: ['build-tools', 'grunt-*']});

    grunt.registerTask('build', [
        'copy',
        'bt:build'
    ]);

    grunt.registerTask('test', [
        'bt:test'
    ]);

};