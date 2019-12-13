import path from 'path';

import postcssPresetEnv from 'postcss-preset-env';

import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers/index';

describe('"importLoaders" option', () => {
  it('should work when not specified', async () => {
    // It is hard to test `postcss` on reuse `ast`, please look on coverage before merging
    const compiler = getCompiler(
      './nested-import/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                { loader: path.resolve(__dirname, '../src') },
                {
                  loader: 'postcss-loader',
                  options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./nested-import/source.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "0" (`postcss-loader` before)', async () => {
    // It is hard to test `postcss` on reuse `ast`, please look on coverage before merging
    const compiler = getCompiler(
      './nested-import/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { importLoaders: 0 },
                },
                {
                  loader: 'postcss-loader',
                  options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./nested-import/source.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "1" (no loaders before)', async () => {
    const compiler = getCompiler('./nested-import/source.js');
    const stats = await compile(compiler);

    expect(
      getModuleSource('./nested-import/source.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "1" ("postcss-loader" before)', async () => {
    // It is hard to test `postcss` on reuse `ast`, please look on coverage before merging
    const compiler = getCompiler(
      './nested-import/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { importLoaders: 1 },
                },
                {
                  loader: 'postcss-loader',
                  options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./nested-import/source.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "2" ("postcss-loader" before)', async () => {
    // It is hard to test `postcss` on reuse `ast`, please look on coverage before merging
    const compiler = getCompiler(
      './nested-import/source.js',
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, '../src'),
                  options: { importLoaders: 2 },
                },
                {
                  loader: 'postcss-loader',
                  options: { plugins: () => [postcssPresetEnv({ stage: 0 })] },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource('./nested-import/source.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
