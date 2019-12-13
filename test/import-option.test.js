import {
  compile,
  execute,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
  readAsset,
} from './helpers/index';

describe('"import" option', () => {
  it('should work when not specified', async () => {
    const compiler = getCompiler('./import/import.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when "true"', async () => {
    const compiler = getCompiler('./import/import.js', { import: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when "false"', async () => {
    const compiler = getCompiler('./import/import.js', { import: false });
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work when "Function"', async () => {
    const compiler = getCompiler('./import/import.js', {
      import: (parsedImport, resourcePath) => {
        expect(typeof resourcePath === 'string').toBe(true);

        // Don't handle `test.css`
        if (parsedImport.url.includes('test.css')) {
          return false;
        }

        return true;
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should keep original order', async () => {
    const compiler = getCompiler('./import/order.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./import/order.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(
      execute(readAsset('main.bundle.js', compiler, stats))
    ).toMatchSnapshot('result');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
