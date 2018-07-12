import path from 'path';

import del from 'del';
import webpack from 'webpack';
import MemoryFS from 'memory-fs';

const module = (config) => {
  return {
    rules: config.rules
      ? config.rules
      : [
          {
            test: (config.loader && config.loader.test) || /\.css$/,
            use: {
              loader: path.resolve(__dirname, '../../src'),
              options: (config.loader && config.loader.options) || {},
            },
          },
          {
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
            use: {
              loader: 'url-loader',
            },
          },
        ],
  };
};

const plugins = (config) => [].concat(config.plugins || []);

const output = (config) => {
  return {
    path: path.resolve(
      __dirname,
      `../outputs/${config.output ? config.output : ''}`
    ),
    filename: '[name].bundle.js',
  };
};

export default function(fixture, config = {}, options = {}) {
  // webpack Config
  // eslint-disable-next-line no-param-reassign
  config = {
    mode: 'development',
    devtool: config.devtool || 'sourcemap',
    context: path.resolve(__dirname, '..', 'fixtures'),
    entry: `./${fixture}`,
    output: output(config),
    module: module(config),
    plugins: plugins(config),
    optimization: {
      runtimeChunk: true,
    },
  };

  // Compiler Options
  // eslint-disable-next-line no-param-reassign
  options = Object.assign({ output: false }, options);

  if (options.output) {
    del.sync(config.output.path);
  }

  const compiler = webpack(config);

  if (!options.output) {
    compiler.outputFileSystem = new MemoryFS();
  }

  return new Promise((resolve, reject) =>
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }

      return resolve(stats);
    })
  );
}
