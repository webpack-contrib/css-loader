import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers/index';

describe('"onlyLocals" option', () => {
  it('should work', async () => {
    const compiler = getCompiler('./modules/composes/composes.js', {
      modules: { mode: 'local', localIdentName: '_[local]' },
      onlyLocals: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource('./modules/composes/composes.css', stats)
    ).toMatchSnapshot('module');
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
