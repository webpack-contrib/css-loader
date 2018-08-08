import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';
import { normalizeErrors } from './helpers/utils';

describe('import', () => {
  describe('true', () => {
    test('url', async () => {
      const stats = await webpack('import/url.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('url with single quotes', async () => {
      const stats = await webpack('import/url.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('url with double quotes', async () => {
      const stats = await webpack('import/url.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('at rule import in uppercase', async () => {
      const stats = await webpack('import/at-rule-import-in-uppercase.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('url function in uppercase', async () => {
      const stats = await webpack('import/url-function-in-uppercase.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('empty url', async () => {
      const stats = await webpack('import/empty-url.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('empty url with single quotes', async () => {
      const stats = await webpack('import/empty-url-with-single-quotes.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('empty url with double quotes', async () => {
      const stats = await webpack('import/empty-url-with-double-quotes.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('string', async () => {
      const stats = await webpack('import/string.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('empty string', async () => {
      const stats = await webpack('import/empty-string.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('string contains spaces', async () => {
      const stats = await webpack('import/string-contains-spaces.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('duplicate', async () => {
      const stats = await webpack('import/duplicate.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('media', async () => {
      const stats = await webpack('import/media.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('media without space between url and media query', async () => {
      const stats = await webpack(
        'import/media-without-space-between-url-and-media-query.css'
      );
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('media nested', async () => {
      const stats = await webpack('import/media-nested.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('duplicate with same import', async () => {
      const stats = await webpack('import/duplicate-with-same-media.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('multiple', async () => {
      const stats = await webpack('import/multiple.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('multiple with media', async () => {
      const stats = await webpack('import/multiple-with-media.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('multiple with media (2)', async () => {
      const stats = await webpack('import/multiple-with-media-2.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('from modules', async () => {
      const stats = await webpack('import/from-modules.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('external', async () => {
      const stats = await webpack('import/external.css');
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('not standard at rule contains import word', async () => {
      const stats = await webpack(
        'import/not-standard-at-rule-contains-import-word.css'
      );
      const { modules } = stats.toJson();

      expect(
        evaluated(modules[modules.length - 1].source, modules)
      ).toMatchSnapshot('import');
      expect(stats.compilation.warnings).toMatchSnapshot('warnings');
      expect(stats.compilation.errors).toMatchSnapshot('errors');
    });

    test('invalid', async () => {
      const stats = await webpack('import/invalid.css');

      expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
        'warnings'
      );
      expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot(
        'errors'
      );
    });
  });

  test('false', async () => {
    const config = {
      loader: {
        options: {
          import: false,
        },
      },
    };
    const stats = await webpack('import/url.css', config);
    const { modules } = stats.toJson();

    expect(evaluated(modules[modules.length - 1].source)).toMatchSnapshot(
      'import'
    );

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
