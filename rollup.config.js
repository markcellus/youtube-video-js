import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import serve from 'rollup-plugin-serve';

export default {
    input: 'src/youtube-video.ts',
    output: {
        format: 'esm',
        file: 'dist/youtube-video.js',
    },
    plugins: [
        resolve(),
        typescript(),
        process.env.ROLLUP_WATCH &&
            serve({
                historyApiFallback: true,
                contentBase: '',
                port: 3139,
            }),
    ],
    watch: {
        include: 'src/**',
    },
};
