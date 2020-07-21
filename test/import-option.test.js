import path from 'path';
import fs from 'fs';

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
} from './helpers/index';

describe('"import" option', () => {
  it('should work when not specified', async () => {
    const compiler = getCompiler('./import/import.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "true"', async () => {
    const compiler = getCompiler('./import/import.js', { import: true });
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work with a value equal to "false"', async () => {
    const compiler = getCompiler('./import/import.js', { import: false });
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
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
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should keep original order', async () => {
    const compiler = getCompiler('./import/order.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./import/order.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respect style field in package.json', async () => {
    const compiler = getCompiler('./import/issue-683.js');
    const stats = await compile(compiler);

    expect(getModuleSource('test.css', stats)).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should respect conditionNames', async () => {
    const compiler = getCompiler('./import/import-conditionNames.js');
    const stats = await compile(compiler);

    expect(getModuleSource('import-conditionNames.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve server-relative url relative rootContext', async () => {
    const compiler = getCompiler('./import/import-server-relative-url.js');
    const stats = await compile(compiler);

    expect(
      getModuleSource('./import/import-server-relative-url.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve absolute path', async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, 'fixtures', 'import');
    const file = path.resolve(fileDirectory, 'import-absolute.css');
    const absolutePath = path.resolve(fileDirectory, 'test.css');

    fs.writeFileSync(file, `@import "${absolutePath}";`);

    const compiler = getCompiler('./import/import-absolute.js');
    const stats = await compile(compiler);

    expect(
      getModuleSource('./import/import-absolute.css', stats)
    ).toMatchSnapshot('module');
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work resolve order: local -> node_modules -> alias', async () => {
    const compiler = getCompiler('./import/import-order.js');
    const stats = await compile(compiler);

    expect(getModuleSource('./import/import-order.css', stats)).toMatchSnapshot(
      'module'
    );
    expect(getExecutedCode('main.bundle.js', compiler, stats)).toMatchSnapshot(
      'result'
    );
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it.only('should emit warning when unresolved import', async () => {
    const compiler = getCompiler('./import/unresolved.js');
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats, true)).toMatchSnapshot('errors');
  });
});
