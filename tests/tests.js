"use strict";

// set config options
require.config({
    'baseUrl': '../',
    'paths': {
        qunit: 'tests/libs/qunit/qunit-require',
        sinon: 'tests/libs/sinon/sinon',
        'underscore': 'src/libs/underscore/underscore-min',
        'element-kit': 'src/libs/element-kit/dist/element-kit.min'
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