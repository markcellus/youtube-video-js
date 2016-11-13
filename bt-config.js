'use strict';

var transforms = [
    [
        "babelify",
        {
            "presets": [
                "es2015"
            ],
            "plugins": [
                [
                    "transform-runtime",
                    {
                        "polyfill": true
                    }
                ]
            ]
        }
    ]
];

module.exports = {
    dist: 'dist',
    build: {
        files: {
            'dist/youtube-video.js': ['src/youtube-video.js']
        },
        browserifyOptions: {
            standalone: 'YoutubeVideo',
            transform: transforms,
        },
        minifyFiles: {
            'dist/youtube-video-min.js': ['dist/youtube-video.js']
        },
        bannerFiles: ['dist/*']
    },
    tests: {
        mocha: {
            src: ['tests/*.js']
        },
        browserifyOptions: {
            transform: transforms,
        },
    }
};
