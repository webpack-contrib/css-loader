/* eslint-disable */

const path = require('path');

module.exports = (config) => {
  return {
    target: 'node',
    devtool: 'source-map',
    context: path.join(__dirname, 'configs'),
    entry: `./${config.file}.js`,
    output: {
      path: path.join(__dirname, 'builds'),
      filename: `${config.file}.test.js`,
      sourceMapFilename: `${config.file}.map.js`
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: path.resolve('dist', 'cjs.js'),
              options: config.options || {},
            }
          ]
        },
        {
          test: /\.png$/,
          use: [
            { loader: 'url-loader', options: { limit: 2000 } }
          ]
        }
      ]
    }
  };
};
