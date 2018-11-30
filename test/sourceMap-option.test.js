const { webpack, evaluated, normalizeSourceMap } = require('./helpers');

describe('sourceMap option', () => {
  describe('true', () => {
    it('should generate source map', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      /**
       * Get the actual source map from the OriginalSource object.
       * @see {@link https://github.com/webpack/webpack-sources}
       * @todo check that the source map exists
       * @todo check that the source map has valid and expected property values.
       */
      const compilationModules = stats.compilation.modules;
      const compilationModule = compilationModules.find((m) => m.id === testId);
      const moduleOriginalSource = compilationModule._source; // eslint-disable-line no-underscore-dangle
      const moduleSourceMap = moduleOriginalSource.map();

      /**
       * @todo remove `console.log` statments
       */
      /* eslint-disable no-console */
      console.log('==========================================================');
      console.log(moduleSourceMap);
      console.log('==========================================================');
      /* eslint-enable no-console */

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is `null` from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
        sourceMap: null,
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is `undefined` from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
        // eslint-disable-next-line no-undefined
        sourceMap: undefined,
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is valid from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
        sourceMap: {
          file: 'test.css',
          mappings: 'AAAA,SAAS,SAAS,EAAE',
          names: [],
          sourceRoot: '',
          sources: ['/folder/test.css'],
          sourcesContent: ['.class { a: b c d; }'],
          version: 3,
        },
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is valid and it is string from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
        sourceMap: JSON.stringify({
          file: 'test.css',
          mappings: 'AAAA,SAAS,SAAS,EAAE',
          names: [],
          sourceRoot: '',
          sources: ['/folder/test.css'],
          sourcesContent: ['.class { a: b c d; }'],
          version: 3,
        }),
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });

  describe('false', () => {
    it('should not generate source map', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(evaluated(module.source)).toMatchSnapshot('module (evaluated)');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should not generate source map when source map is `null` from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
        sourceMap: null,
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(evaluated(module.source)).toMatchSnapshot('module (evaluated)');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should not generate source map when source map is `undefined` from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
        // eslint-disable-next-line no-undefined
        sourceMap: undefined,
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(evaluated(module.source)).toMatchSnapshot('module (evaluated)');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should not generate sourceMap when source map is valid from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
        sourceMap: {
          file: 'test.css',
          mappings: 'AAAA,SAAS,SAAS,EAAE',
          names: [],
          sourceRoot: '',
          sources: ['/folder/test.css'],
          sourcesContent: ['.class { a: b c d; }'],
          version: 3,
        },
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(evaluated(module.source)).toMatchSnapshot('module (evaluated)');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('should not generate source map when source map is valid and it is string from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
        sourceMap: JSON.stringify({
          file: 'test.css',
          mappings: 'AAAA,SAAS,SAAS,EAAE',
          names: [],
          sourceRoot: '',
          sources: ['/folder/test.css'],
          sourcesContent: ['.class { a: b c d; }'],
          version: 3,
        }),
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(evaluated(module.source)).toMatchSnapshot('module (evaluated)');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });
});
