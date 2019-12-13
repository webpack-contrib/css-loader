import { webpack, evaluated } from './helpers';
import { getErrors, getWarnings } from './helpers/index';

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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('Function', async () => {
    const config = {
      loader: {
        options: {
          url: (url, resourcePath) => {
            expect(typeof resourcePath === 'string').toBe(true);

            // Don't handle `img.png`
            if (url.includes('img.png')) {
              return false;
            }

            return true;
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
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
