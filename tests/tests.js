"use strict";

// set config options
require.config({
    'baseUrl': '../',
    'paths': {
        qunit: 'libs/qunit/qunit-require',
        sinon: 'libs/sinon/sinon',
        'underscore': 'libs/underscore/underscore-min',
        'test-utils': 'libs/test-utils',
        'element-kit': 'libs/element-kit/element-kit.min'
    },
    shim: {
        sinon: {exports: 'sinon'}
    }
});

// require each test
require([
    'tests/youtube-player-tests'
], function() {
    QUnit.config.requireExpects = true;
    QUnit.start();
});