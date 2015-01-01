"use strict";

// set config options
require.config({
    'baseUrl': '../',
    'paths': {
        qunit: 'tests/qunit-require',
        sinon: 'libs/sinon/sinon',
        'underscore': 'libs/underscore/underscore',
        'test-utils': 'tests/test-utils',
        'element-kit': 'libs/element-kit/element-kit'
    },
    shim: {
        sinon: {exports: 'sinon'}
    }
});

// require each test
require([
    'tests/youtube-video-tests'
], function() {
    QUnit.config.requireExpects = true;
    QUnit.start();
});