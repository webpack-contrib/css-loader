import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
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
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
