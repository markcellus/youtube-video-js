module.exports = function(config) {
    config.set({
        files: ['tests/**/*.js'],

        preprocessors: {
            'tests/**/*.js': ['rollup']
        },

        rollupPreprocessor: {
            output: {
                format: 'umd',            // Helps prevent naming collisions.
                sourcemap: 'inline'        // Sensible for testing.
            }
        },
        reporters: ['progress'],
        frameworks: ['mocha'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless'],
        autoWatch: true,
        singleRun: true,
        concurrency: Infinity
    });
};