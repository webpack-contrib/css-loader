import { join } from 'path';

import { webpack, evaluated, normalizeErrors } from './helpers';

describe('resolve option', () => {
  it('Function', async () => {
    const config = {
      loader: {
        options: {
          resolve: (resourcePath) => {
            expect(typeof resourcePath === 'string').toBe(true);
            if (resourcePath.includes('~package')) {
              return join('node_modules', resourcePath.replace('~', ''));
            }
            return resourcePath;
          },
        },
      },
    };
    const testId = './resolve/resolve.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('CSS Modules', async () => {
    const config = {
      loader: {
        options: {
          modules: true,
          resolve: (resourcePath) => {
            expect(typeof resourcePath === 'string').toBe(true);
            if (resourcePath.includes('~@localpackage')) {
              return join('node_modules', resourcePath.replace('~', ''));
            }
            return resourcePath;
          },
        },
      },
    };
    const testId = './resolve/modules.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });
});
