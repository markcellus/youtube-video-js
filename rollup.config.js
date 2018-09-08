const formats = [
    {format: 'esm', extension: 'js'},
    {format: 'umd', extension: 'umd.js'},
];

const configs = formats.map(({format, extension}) => {
    const filePath = 'youtube-video';
    return {
        input: `src/${filePath}.js`,
        output: {
            name: 'YoutubeVideo ',
            format,
            external: ['resource-manager-js'],
            file: `dist/${filePath}.${extension}`
        }
    };
});

export default configs;