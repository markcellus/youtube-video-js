const { createDefaultConfig } = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = (config) => {
    config.set(
        merge(createDefaultConfig(config), {
            files: [
                {
                    pattern: config.grep ? config.grep : 'tests/**/*.ts',
                    type: 'module',
                },
            ],

            esm: {
                nodeResolve: true,
                fileExtensions: ['.ts'],
                babel: true,
            },
            coverageIstanbulReporter: {
                thresholds: {
                    global: {
                        statements: 60,
                        lines: 60,
                        branches: 50,
                        functions: 70,
                    },
                },
            },
        })
    );
    return config;
};
