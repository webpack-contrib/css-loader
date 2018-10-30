import path from 'path';

import postcss from 'postcss';
import stripAnsi from 'strip-ansi';

function normalizeErrors(errors) {
  return errors.map((error) => {
    // eslint-disable-next-line no-param-reassign
    error.message = stripAnsi(error.message)
      .replace(/\(from .*?\)/, '(from `replaced original path`)')
      .replace(/at(.*?)\(.*?\)/g, 'at$1(`replaced original path`)');

    return error;
  });
}

function normalizeModule(module) {
  return module.map((m) => {
    if (m[3]) {
      // eslint-disable-next-line no-param-reassign
      m[3].sources = m[3].sources.map(() => '/replaced/original/path/');
    }

    return m;
  });
}

function runPostcss(input, plugins) {
  return (
    postcss(plugins)
      // eslint-disable-next-line no-undefined
      .process(input, { from: undefined })
      .then((result) => result)
  );
}

function generateRulesWithSourceMap(enableSourceMap, sourceMap) {
  return {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: path.resolve(__dirname, '../../src'),
            options: {
              sourceMap: enableSourceMap,
            },
          },
          {
            loader: path.resolve(__dirname, '../fixtures/source-map-loader.js'),
            options: {
              sourceMap,
            },
          },
        ],
      },
    ],
  };
}

export {
  normalizeErrors,
  normalizeModule,
  runPostcss,
  generateRulesWithSourceMap,
};
