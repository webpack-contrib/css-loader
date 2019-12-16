import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
} from './helpers/index';

describe('"esModule" option', () => {
  it('should work when not specified', async () => {
    const compiler = getCompiler('./es-module/source.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true"', async () => {
    const compiler = getCompiler('./es-module/source.js', { esModule: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true" and the "mode" value equal to "local"', async () => {
    const compiler = getCompiler('./es-module/source.js', {
      esModule: true,
      modules: 'local',
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true" and the "mode" value equal to "global"', async () => {
    const compiler = getCompiler('./es-module/source.js', {
      esModule: true,
      modules: 'global',
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true" and the "mode" value equal to "pure"', async () => {
    const compiler = getCompiler('./es-module/source.js', {
      esModule: true,
      modules: 'pure',
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "false"', async () => {
    const compiler = getCompiler('./es-module/source.js', { esModule: false });
    const stats = await compile(compiler);

    expect(getModuleSource('./es-module/source.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
