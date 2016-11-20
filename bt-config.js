var transforms = [
    [
        "babelify",
        {
            "presets": [
                "es2015"
            ],
            "plugins": [
                [
                    "add-module-exports"
                ],
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
    build: {
        files: {
            'dist/youtube-video.js': ['src/youtube-video.js']
        },
        browserifyOptions: {
            standalone: 'YoutubeVideo',
            transform: transforms
        },
        minifyFiles: {
            'dist/youtube-video-min.js': ['dist/youtube-video.js']
        },
        bannerFiles: ['dist/*']
    },
    tests: {
        mocha: {
            files: ['tests/*.js'],
            browserifyOptions: {
                transform: transforms
            },
        },
    }
};
