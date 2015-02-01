module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        bt: {
            uglifyFiles: {
                'dist/video.min.js': ['dist/video.js']
            },
            testRequireConfig: {
                'paths': {
                    'underscore': 'libs/underscore/underscore',
                    'element-kit': 'libs/element-kit/element-kit'
                }
            }
        }
    });

    // Load grunt tasks from node modules
    require("load-grunt-tasks")(grunt);

};