import webpack from './helpers/compiler';
import { normalizeErrors } from './helpers/utils';

describe('SyntaxError', () => {
  it('basic', async () => {
    const stats = await webpack('broken.css');

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });
});
