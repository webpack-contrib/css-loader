import fs from 'fs';
import path from 'path';

import plugin from '../../src/plugins/url';
import { runPostcss } from '../helpers/utils';

describe('URL postcss plugin', () => {
  it('basic', async () => {
    const result = await runPostcss(
      fs.readFileSync(path.join(__dirname, '../fixtures/url/url.css')),
      [plugin]
    );

    expect(result.css).toMatchSnapshot('css');
  });
});
