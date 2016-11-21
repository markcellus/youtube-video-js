module.exports = {
    build: {
        files: {
            'dist/youtube-video.js': ['src/youtube-video.js']
        },
        browserifyOptions: {
            standalone: 'YoutubeVideo',
            transform: [
                [
                    "babelify",
                    {
                        "plugins": [
                            ["add-module-exports"]
                        ]
                    }
                ]
            ],
        },
        minifyFiles: {
            'dist/youtube-video-min.js': ['dist/youtube-video.js']
        },
        bannerFiles: ['dist/*']
    },
    tests: {
        mocha: {
            files: ['tests/*.js']
        },
    }
};
