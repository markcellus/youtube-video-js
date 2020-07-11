module.exports = function (config) {
    config.set({
        files: [{ pattern: 'tests/**/*.ts', type: 'module' }],

        plugins: [require.resolve('@open-wc/karma-esm'), 'karma-*'],

        esm: {
            nodeResolve: true,
            fileExtensions: ['.ts'],
            babel: true,
        },

        reporters: ['progress'],
        frameworks: ['esm', 'mocha'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['ChromeHeadless'],
        autoWatch: true,
        singleRun: true,
        concurrency: Infinity,
    });
};
