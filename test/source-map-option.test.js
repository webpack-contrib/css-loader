import path from 'path';

import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';
import { normalizeModule } from './helpers/utils';

describe('sourceMap', () => {
  const generateRulesWithSourceMap = (enableSourceMap, sourceMap) => {
    return {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: path.resolve(__dirname, '../src'),
              options: {
                sourceMap: enableSourceMap,
              },
            },
            {
              loader: path.resolve(__dirname, 'fixtures/source-map-loader.js'),
              options: {
                sourceMap,
              },
            },
          ],
        },
      ],
    };
  };

  describe('true', () => {
    test('basic', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
      };
      const stats = await webpack('source-map/basic.css', config);
      const { modules } = stats.toJson();

      expect(
        normalizeModule(evaluated(modules[modules.length - 1].source))
      ).toMatchSnapshot('module');

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('map from other loader', async () => {
      const config = generateRulesWithSourceMap(true, {
        file: 'test.css',
        mappings: 'AAAA,SAAS,SAAS,EAAE',
        names: [],
        sourceRoot: '',
        sources: ['/folder/test.css'],
        sourcesContent: ['.class { a: b c d; }'],
        version: 3,
      });
      const stats = await webpack('source-map/basic.css', config);
      const { modules } = stats.toJson();

      expect(
        normalizeModule(evaluated(modules[modules.length - 1].source))
      ).toMatchSnapshot('module');

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('map is string', async () => {
      const config = generateRulesWithSourceMap(
        true,
        JSON.stringify({
          file: 'test.css',
          mappings: 'AAAA,SAAS,SAAS,EAAE',
          names: [],
          sourceRoot: '',
          sources: ['/folder/test.css'],
          sourcesContent: ['.class { a: b c d; }'],
          version: 3,
        })
      );
      const stats = await webpack('source-map/basic.css', config);
      const { modules } = stats.toJson();

      expect(
        normalizeModule(evaluated(modules[modules.length - 1].source))
      ).toMatchSnapshot('module');

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });

  describe('false', () => {
    test('basic', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: false,
          },
        },
      };
      const stats = await webpack('source-map/basic.css', config);
      const { modules } = stats.toJson();

      expect(evaluated(modules[modules.length - 1].source)).toMatchSnapshot(
        'module'
      );

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('map from other loader', async () => {
      const config = generateRulesWithSourceMap(false, {
        file: 'test.css',
        mappings: 'AAAA,SAAS,SAAS,EAAE',
        names: [],
        sourceRoot: '',
        sources: ['/folder/test.css'],
        sourcesContent: ['.class { a: b c d; }'],
        version: 3,
      });
      const stats = await webpack('source-map/basic.css', config);
      const { modules } = stats.toJson();

      expect(evaluated(modules[modules.length - 1].source)).toMatchSnapshot(
        'module'
      );

      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });
});
