import { webpack, evaluated, normalizeErrors } from './helpers';

describe('url option', () => {
  it('true', async () => {
    const testId = './url/url.css';
    const stats = await webpack(testId);
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

  it('false', async () => {
    const config = { loader: { options: { url: false } } };
    const testId = './url/url.css';
    const stats = await webpack(testId, config);
    const { modules } = stats.toJson();
    const module = modules.find((m) => m.id === testId);

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  [true, 'local', 'global', false].forEach((modulesValue) => {
    it(`true and modules \`${modulesValue}\``, async () => {
      const config = {
        loader: { options: { modules: modulesValue } },
      };
      const testId = './url/url.css';
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
      expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot(
        'errors'
      );
    });
  });

  it('Function', async () => {
    const config = {
      loader: {
        options: {
          url: (url, resourcePath) => {
            expect(typeof resourcePath === 'string').toBe(true);

            return url.includes('img.png');
          },
        },
      },
    };
    const testId = './url/url.css';
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
