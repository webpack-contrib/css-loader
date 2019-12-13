import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers/index';

describe('"localsConvention" option', () => {
  it('should work when not specified', async () => {
    const compiler = getCompiler('./modules/localsConvention.js', {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "asIs"', async () => {
    const compiler = getCompiler('./modules/localsConvention.js', {
      modules: true,
      localsConvention: 'asIs',
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "camelCase"', async () => {
    const compiler = getCompiler('./modules/localsConvention.js', {
      modules: true,
      localsConvention: 'camelCase',
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "camelCaseOnly"', async () => {
    const compiler = getCompiler('./modules/localsConvention.js', {
      modules: true,
      localsConvention: 'camelCaseOnly',
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "dashes"', async () => {
    const compiler = getCompiler('./modules/localsConvention.js', {
      modules: true,
      localsConvention: 'dashes',
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "dashesOnly"', async () => {
    const compiler = getCompiler('./modules/localsConvention.js', {
      modules: true,
      localsConvention: 'dashesOnly',
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/localsConvention.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
