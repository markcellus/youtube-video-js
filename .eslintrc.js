module.exports = {
    extends: ['eslint:recommended', 'plugin:testcafe/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'eslint-plugin-testcafe'],
    parserOptions: {
        sourceType: 'module',
    },
    env: {
        browser: true,
        node: true,
        es6: true,
        mocha: true,
    },
    globals: {
        YT: true,
        Chai: 'readonly',
    },
};
