import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';

const { ROLLUP_WATCH } = process.env;

export default function (commandOptions) {
    const basePath = commandOptions.dev ? 'examples/dist' : 'dist';
    return {
        input: 'src/youtube-video.ts',
        output: {
            format: 'esm',
            file: `${basePath}/youtube-video.js`,
        },
        plugins: [
            resolve(),
            typescript(),
            ROLLUP_WATCH &&
                serve({
                    historyApiFallback: true,
                    contentBase: '',
                    port: 3139,
                }),
            !ROLLUP_WATCH && terser(),
        ],
        watch: {
            include: 'src/**',
        },
    };
}
