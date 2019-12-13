import path from 'path';

import postcssPresetEnv from 'postcss-preset-env';

import { webpack, evaluated, normalizeSourceMap } from './helpers';
import { getErrors, getWarnings } from './helpers/index';

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

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
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
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
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
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is valid and it is string from other loader', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
        sourceMap: JSON.stringify({
          version: 3,
          sources: [
            path.join(__dirname, 'fixtures/source-map/basic.postcss.css'),
          ],
          names: [],
          mappings:
            'AAGA;EACE,gBAAgB;EAChB,mCAAsB;EACtB,yCAA4C;AAC9C;;AAEA;EACE,kBAAqB;EAArB,gBAAqB;EAArB,qBAAqB;AACvB;;AAEA;EACE;IACE,6BAAuB;IAAvB,uBAAuB;IACvB,iGAAsB;IACtB,eAA0B;IAA1B,0BAA0B;IAC1B,6BAAwC;IAAxC,wCAAwC;IACxC,qBAAyB;IACzB,kCAA+C;IAA/C,mCAA+C;IAA/C,6CAA+C;IAA/C,8CAA+C;EACjD;AACF;;AAEA;EACE,aAAe;EAAf,gBAAe;AACjB;;AAEA;EACE;AAKF;;AAHA;GACG,WAAoB;CACtB',
          file: path.join(__dirname, 'fixtures/source-map/basic.postcss.css'),
          sourcesContent: [
            '@custom-media --viewport-medium (width <= 50rem);\n@custom-selector :--heading h1, h2, h3, h4, h5, h6;\n\n:root {\n  --fontSize: 1rem;\n  --mainColor: #12345678;\n  --secondaryColor: lab(32.5 38.5 -47.6 / 90%);\n}\n\nhtml {\n  overflow: hidden auto;\n}\n\n@media (--viewport-medium) {\n  body {\n    color: var(--mainColor);\n    font-family: system-ui;\n    font-size: var(--fontSize);\n    line-height: calc(var(--fontSize) * 1.5);\n    overflow-wrap: break-word;\n    padding-inline: calc(var(--fontSize) / 2 + 1px);\n  }\n}\n\n:--heading {\n  margin-block: 0;\n}\n\na {\n  color: rgb(0 0 100% / 90%);\n\n&:hover {\n   color: rebeccapurple;\n }\n}\n',
          ],
        }),
      };
      const testId = './source-map/basic.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is valid from other loader (`sass-loader`)', async () => {
      const config = {
        loader: {
          test: /\.s[ca]ss$/i,
          options: {
            sourceMap: true,
          },
        },
        sassLoader: true,
        sassLoaderOptions: {
          // eslint-disable-next-line global-require
          implementation: require('sass'),
          sourceMap: true,
        },
      };
      const testId = './source-map/basic.scss';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });

    it('should generate source map when source map is valid from other loader (`postcss-loader`)', async () => {
      const config = {
        loader: {
          options: {
            sourceMap: true,
          },
        },
        postcssLoader: true,
        postcssLoaderOptions: {
          sourceMap: true,
          plugins: () => [postcssPresetEnv({ stage: 0 })],
        },
      };
      const testId = './source-map/basic.postcss.css';
      const stats = await webpack(testId, config);
      const { modules } = stats.toJson();
      const module = modules.find((m) => m.id === testId);

      expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
        'module (evaluated)'
      );
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
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
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
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
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
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
      expect(getWarnings(stats)).toMatchSnapshot('warnings');
      expect(getErrors(stats)).toMatchSnapshot('errors');
    });
  });

  it('should not generate sourceMap when source map is valid from other loader (`sass-loader`)', async () => {
    const config = {
      loader: {
        test: /\.s[ca]ss$/i,
        options: {
          sourceMap: false,
        },
      },
      sassLoader: true,
      sassLoaderOptions: {
        // eslint-disable-next-line global-require
        implementation: require('sass'),
        sourceMap: true,
      },
    };
    const testId = './source-map/basic.scss';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(normalizeSourceMap(evaluated(module.source))).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
