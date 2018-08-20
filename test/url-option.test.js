import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';

describe('url', () => {
  test('true', async () => {
    const stats = await webpack('url/url.css');
    const { modules } = stats.toJson();

    expect(evaluated(modules[modules.length - 1].source)).toMatchSnapshot(
      'module'
    );

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  test('false', async () => {
    const config = {
      loader: {
        options: {
          url: false,
        },
      },
    };
    const stats = await webpack('url/url.css', config);
    const { modules } = stats.toJson();

    expect(evaluated(modules[modules.length - 1].source)).toMatchSnapshot(
      'module'
    );

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
