import fs from 'fs';
import path from 'path';

import plugin from '../../src/plugins/icss';
import { runPostcss } from '../helpers/utils';

describe('ICSS postcss plugin', () => {
  it('basic', async () => {
    const result = await runPostcss(
      fs.readFileSync(
        path.join(__dirname, '../fixtures/icss/import-export.css')
      ),
      [plugin]
    );

    expect(result.css).toMatchSnapshot('css');
    expect(result.messages).toMatchSnapshot('messages');
  });

  it('only import messages', async () => {
    const result = await runPostcss(
      fs.readFileSync(path.join(__dirname, '../fixtures/icss/only-import.css')),
      [plugin]
    );

    expect(result.css).toMatchSnapshot('css');
    expect(result.messages).toMatchSnapshot('messages');
  });

  it('only export messages', async () => {
    const result = await runPostcss(
      fs.readFileSync(path.join(__dirname, '../fixtures/icss/only-export.css')),
      [plugin]
    );

    expect(result.css).toMatchSnapshot('css');
    expect(result.messages).toMatchSnapshot('messages');
  });
});
