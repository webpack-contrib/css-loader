import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';
import { normalizeModule, generateRulesWithSourceMap } from './helpers/utils';

describe('sourceMap', () => {
  describe('true', () => {
    it('basic', async () => {
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

      expect(normalizeModule(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('map from other loader', async () => {
      const config = generateRulesWithSourceMap(true, {
        file: 'test.css',
        mappings: 'AAAA,SAAS,SAAS,EAAE',
        names: [],
        sourceRoot: '',
        sources: ['/folder/test.css'],
        sourcesContent: ['.class { a: b c d; }'],
        version: 3,
      });
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeModule(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('map is string', async () => {
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
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(
        normalizeModule(evaluated(module.source, modules))
      ).toMatchSnapshot('module (evaluated)');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });

  describe('false', () => {
    it('basic', async () => {
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

      expect(evaluated(module.source, modules)).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    it('map from other loader', async () => {
      const config = generateRulesWithSourceMap(false, {
        file: 'test.css',
        mappings: 'AAAA,SAAS,SAAS,EAAE',
        names: [],
        sourceRoot: '',
        sources: ['/folder/test.css'],
        sourcesContent: ['.class { a: b c d; }'],
        version: 3,
      });
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(evaluated(module.source, modules)).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });
  });
});
