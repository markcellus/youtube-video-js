module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        bt: {
            dist: 'dist',
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

    grunt.registerTask('build', [
        'bt:build'
    ]);

};