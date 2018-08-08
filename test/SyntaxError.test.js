import webpack from './helpers/compiler';
import { normalizeErrors } from './helpers/utils';

describe('SyntaxError', () => {
  test('basic', async () => {
    const stats = await webpack('broken.js');

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });
});
