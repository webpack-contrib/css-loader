import SyntaxError from '../src/SyntaxError';

import webpack from './helpers/compiler';
import { normalizeErrors } from './helpers/utils';

describe('SyntaxError', () => {
  test('basic', () => {
    expect(new SyntaxError(new Error()).toString()).toMatchSnapshot();
    expect(new SyntaxError(new Error('message')).toString()).toMatchSnapshot();
    expect(
      new SyntaxError(new Error('message', 'test.css')).toString()
    ).toMatchSnapshot();
    expect(
      new SyntaxError(new Error('message', 'test.css', 100)).toString()
    ).toMatchSnapshot();

    const errorWithReasong = new Error();

    errorWithReasong.reason = 'reason';

    expect(new SyntaxError(errorWithReasong).toString()).toMatchSnapshot();

    const errorWithLineAndColumn = new Error('message');

    errorWithLineAndColumn.line = 1;
    errorWithLineAndColumn.column = 1;

    expect(
      new SyntaxError(errorWithLineAndColumn).toString()
    ).toMatchSnapshot();

    const errorWithLineAndColumnAndSource = new Error('message');

    errorWithLineAndColumnAndSource.line = 1;
    errorWithLineAndColumnAndSource.column = 1;
    errorWithLineAndColumnAndSource.source = '.class { invalid }';

    expect(
      new SyntaxError(errorWithLineAndColumnAndSource).toString()
    ).toMatchSnapshot();
  });

  test('integration', async () => {
    const stats = await webpack('broken.js');

    expect(normalizeErrors(stats.compilation.warnings)).toMatchSnapshot(
      'warnings'
    );
    expect(normalizeErrors(stats.compilation.errors)).toMatchSnapshot('errors');
  });
});
