import fs from 'fs';
import path from 'path';

import plugin from '../../src/plugins/import';
import { runPostcss } from '../helpers/utils';

describe('import postcss plugin', () => {
  it('basic', async () => {
    const result = await runPostcss(
      fs.readFileSync(path.join(__dirname, '../fixtures/import/import.css')),
      [plugin]
    );

    expect(result.css).toMatchSnapshot('css');
  });
});
