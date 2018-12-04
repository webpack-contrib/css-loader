const loader = require('../index');

it('validation', () => {
  const validate = (options) =>
    loader.call(
      Object.assign(
        {},
        {
          query: options,
          loaders: [],
          remainingRequest: 'file.css',
          currentRequest: 'file.css',
          async: () => (error) => {
            if (error) {
              throw error;
            }
          },
        }
      ),
      'a { color: red; }'
    );

  expect(() => validate({ url: true })).not.toThrow();
  expect(() => validate({ url: false })).not.toThrow();
  expect(() => validate({ url: 'true' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ import: true })).not.toThrow();
  expect(() => validate({ import: false })).not.toThrow();
  expect(() => validate({ import: 'true' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ modules: true })).not.toThrow();
  expect(() => validate({ modules: false })).not.toThrow();
  expect(() => validate({ modules: 'global' })).not.toThrow();
  expect(() => validate({ modules: 'local' })).not.toThrow();
  expect(() => validate({ modules: 'true' })).toThrowErrorMatchingSnapshot();
  expect(() => validate({ modules: 'globals' })).toThrowErrorMatchingSnapshot();
  expect(() => validate({ modules: 'locals' })).toThrowErrorMatchingSnapshot();

  expect(() =>
    validate({ localIdentName: '[path][name]__[local]--[hash:base64:5]' })
  ).not.toThrow();
  expect(() =>
    validate({ localIdentName: true })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ localIdentRegExp: 'page-(.*)\\.js' })).not.toThrow();
  expect(() => validate({ localIdentRegExp: /page-(.*)\.js/ })).not.toThrow();
  expect(() =>
    validate({ localIdentRegExp: true })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ context: 'context' })).not.toThrow();
  expect(() => validate({ context: true })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ hashPrefix: 'hash' })).not.toThrow();
  expect(() => validate({ hashPrefix: true })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ getLocalIdent: () => {} })).not.toThrow();
  expect(() =>
    validate({ getLocalIdent: true })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ sourceMap: true })).not.toThrow();
  expect(() => validate({ sourceMap: false })).not.toThrow();
  expect(() => validate({ sourceMap: 'true' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ camelCase: true })).not.toThrow();
  expect(() => validate({ camelCase: false })).not.toThrow();
  expect(() => validate({ camelCase: 'dashes' })).not.toThrow();
  expect(() => validate({ camelCase: 'only' })).not.toThrow();
  expect(() => validate({ camelCase: 'dashesOnly' })).not.toThrow();
  expect(() =>
    validate({ camelCase: 'unknown' })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ importLoaders: 0 })).not.toThrow();
  expect(() => validate({ importLoaders: 1 })).not.toThrow();
  expect(() => validate({ importLoaders: 2 })).not.toThrow();
  expect(() => validate({ importLoaders: '1' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ exportOnlyLocals: true })).not.toThrow();
  expect(() => validate({ exportOnlyLocals: false })).not.toThrow();
  expect(() =>
    validate({ exportOnlyLocals: 'true' })
  ).toThrowErrorMatchingSnapshot();
});
