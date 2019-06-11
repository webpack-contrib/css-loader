import loader from '../src/cjs';

it('validate options', () => {
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
  expect(() => validate({ url: () => {} })).not.toThrow();
  expect(() => validate({ url: 'true' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ import: true })).not.toThrow();
  expect(() => validate({ import: false })).not.toThrow();
  expect(() => validate({ import: () => {} })).not.toThrow();
  expect(() => validate({ import: 'true' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ modules: true })).not.toThrow();
  expect(() => validate({ modules: false })).not.toThrow();
  expect(() => validate({ modules: 'global' })).not.toThrow();
  expect(() => validate({ modules: 'local' })).not.toThrow();
  expect(() => validate({ modules: { mode: 'local' } })).not.toThrow();
  expect(() => validate({ modules: { mode: 'global' } })).not.toThrow();
  expect(() => validate({ modules: 'true' })).toThrowErrorMatchingSnapshot();
  expect(() => validate({ modules: 'globals' })).toThrowErrorMatchingSnapshot();
  expect(() => validate({ modules: 'locals' })).toThrowErrorMatchingSnapshot();
  expect(() =>
    validate({ modules: { mode: true } })
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    validate({ modules: { mode: 'true' } })
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    validate({ modules: { mode: 'locals' } })
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    validate({ modules: { mode: 'globals' } })
  ).toThrowErrorMatchingSnapshot();

  expect(() =>
    validate({
      modules: { localIdentName: '[path][name]__[local]--[hash:base64:5]' },
    })
  ).not.toThrow();
  expect(() =>
    validate({ modules: { localIdentName: true } })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ modules: { context: 'context' } })).not.toThrow();
  expect(() =>
    validate({ modules: { context: true } })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ modules: { hashPrefix: 'hash' } })).not.toThrow();
  expect(() =>
    validate({ modules: { hashPrefix: true } })
  ).toThrowErrorMatchingSnapshot();

  expect(() =>
    validate({ modules: { getLocalIdent: () => {} } })
  ).not.toThrow();
  expect(() => validate({ modules: { getLocalIdent: false } })).not.toThrow();
  expect(() =>
    validate({ modules: { getLocalIdent: [] } })
  ).toThrowErrorMatchingSnapshot();

  expect(() =>
    validate({ modules: { localIdentRegExp: 'page-(.*)\\.js' } })
  ).not.toThrow();
  expect(() =>
    validate({ modules: { localIdentRegExp: /page-(.*)\.js/ } })
  ).not.toThrow();
  expect(() =>
    validate({ modules: { localIdentRegExp: true } })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ sourceMap: true })).not.toThrow();
  expect(() => validate({ sourceMap: false })).not.toThrow();
  expect(() => validate({ sourceMap: 'true' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ exportLocalsStyle: 'camelCase' })).not.toThrow();
  expect(() => validate({ exportLocalsStyle: 'camelCaseOnly' })).not.toThrow();
  expect(() => validate({ exportLocalsStyle: 'dashes' })).not.toThrow();
  expect(() => validate({ exportLocalsStyle: 'dashesOnly' })).not.toThrow();
  expect(() =>
    validate({ exportLocalsStyle: 'unknown' })
  ).toThrowErrorMatchingSnapshot();

  expect(() => validate({ importLoaders: false })).not.toThrow();
  expect(() => validate({ importLoaders: 0 })).not.toThrow();
  expect(() => validate({ importLoaders: 1 })).not.toThrow();
  expect(() => validate({ importLoaders: 2 })).not.toThrow();
  expect(() => validate({ importLoaders: '1' })).toThrowErrorMatchingSnapshot();

  expect(() => validate({ onlyLocals: true })).not.toThrow();
  expect(() => validate({ onlyLocals: false })).not.toThrow();
  expect(() => validate({ onlyLocals: 'true' })).toThrowErrorMatchingSnapshot();
});
