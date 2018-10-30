import webpack from './helpers/compiler';

import { normalizeErrors } from './helpers/utils';

describe('Validation Errors', () => {
  it('unknown option', async () => {
    const config = {
      loader: {
        options: {
          unknow: true,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('url - true (boolean)', async () => {
    const config = {
      loader: {
        options: {
          url: true,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('url - false (boolean)', async () => {
    const config = {
      loader: {
        options: {
          url: false,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('url - true (string)', async () => {
    const config = {
      loader: {
        options: {
          url: 'true',
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('import - true (boolean)', async () => {
    const config = {
      loader: {
        options: {
          import: true,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('import - false (boolean)', async () => {
    const config = {
      loader: {
        options: {
          import: false,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('import - true (string)', async () => {
    const config = {
      loader: {
        options: {
          import: 'true',
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('sourceMap - true (boolean)', async () => {
    const config = {
      loader: {
        options: {
          sourceMap: true,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('sourceMap - false (boolean)', async () => {
    const config = {
      loader: {
        options: {
          sourceMap: false,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('sourceMap - true (string)', async () => {
    const config = {
      loader: {
        options: {
          sourceMap: 'true',
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });

  it('importLoaders - 0 (number)', async () => {
    const config = {
      loader: {
        options: {
          importLoaders: 0,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('importLoaders - 1 (number)', async () => {
    const config = {
      loader: {
        options: {
          importLoaders: 1,
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(stats.compilation.warnings).toMatchSnapshot('warnings');
    expect(stats.compilation.errors).toMatchSnapshot('errors');
  });

  it('importLoaders - 1 (string)', async () => {
    const config = {
      loader: {
        options: {
          importLoaders: '1',
        },
      },
    };
    const stats = await webpack('basic.css', config);

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });
});
