'use strict';

module.exports = {
    build: {
        files: {
            'dist/youtube-video.js': ['src/youtube-video.js']
        },
        browserifyOptions: {
            standalone: 'YoutubeVideo'
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
