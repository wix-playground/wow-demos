import progress from 'rollup-plugin-progress';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

const config = {
    input: 'index.js',
    output: {
        name: 'vgl',
        file: 'build.js',
        format: 'umd',
        sourcemap: false
    },
    plugins: [
        resolve(),
        commonjs({
            include: /node_modules/
        }),
        globals(),
        builtins(),
        progress({
            clearLine: false
        })
    ]
};

export default config;
