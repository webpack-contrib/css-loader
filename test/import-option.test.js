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
    const stats = await webpack('import/import.css', config);
    const { modules } = stats.toJson();
    const [, , , , , , , module] = modules;

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
    const stats = await webpack('import/import.css', config);
    const { modules } = stats.toJson();
    const [, module] = modules;

    expect(module.source).toMatchSnapshot('module');
    expect(evaluated(module.source, modules)).toMatchSnapshot(
      'module (evaluated)'
    );
    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });
});
