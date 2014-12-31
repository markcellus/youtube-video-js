"use strict";

// set config options
require.config({
    'baseUrl': '../',
    'paths': {
        qunit: 'tests/qunit-require',
        sinon: 'libs/sinon/sinon',
        'underscore': 'libs/underscore/underscore',
        'test-utils': 'tests/test-utils'
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