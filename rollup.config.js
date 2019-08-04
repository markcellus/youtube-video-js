import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';

export default {
    input: 'src/youtube-video.ts',
    output: {
        format: 'esm',
        file: 'dist/youtube-video.js',
    },
    plugins: [resolve(), typescript()],
    watch: {
        include: 'src/**',
    },
};
