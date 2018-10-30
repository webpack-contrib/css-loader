import webpack from './helpers/compiler';
import evaluated from './helpers/evaluated';

import { normalizeErrors } from './helpers/utils';

describe('import', () => {
  it('true', async () => {
    const config = {
      loader: {
        options: {
          import: true,
        },
      },
    };
    const testId = './import/import.css';
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

  it('false', async () => {
    const config = {
      loader: {
        options: {
          import: false,
        },
      },
    };
    const testId = './import/import.css';
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
});
