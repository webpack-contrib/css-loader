const { testLocals, test } = require('./helpers');

function testLocal(name, input, result, localsResult, query, modules) {
  // eslint-disable-next-line no-param-reassign
  result.locals = localsResult;
  test(name, input, result, query, modules);
}

describe('values', () => {
  testLocals(
    'should export values',
    '@value def: red; @value ghi: 1px solid black',
    {
      def: 'red',
      ghi: '1px solid black',
    },
    ''
  );
  testLocals(
    'should export values and locals',
    '@value def: red; .ghi { color: def; }',
    {
      def: 'red',
      ghi: '_ghi',
    },
    '?modules&localIdentName=_[local]'
  );
  testLocal(
    'should import values from other module',
    "@value def from './file'; .ghi { color: def; }",
    [[2, '', ''], [1, '.ghi { color: red; }', '']],
    {
      def: 'red',
    },
    '',
    {
      './file': (() => {
        const a = [[2, '', '']];
        a.locals = {
          def: 'red',
        };
        return a;
      })(),
    }
  );
  testLocal(
    'should import values with renaming',
    "@value def as aaa from './file1'; @value def as bbb from './file2'; .ghi { background: aaa, bbb, def; }",
    [
      [2, '', ''],
      [3, '', ''],
      [1, '.ghi { background: red, green, def; }', ''],
    ],
    {
      aaa: 'red',
      bbb: 'green',
    },
    '',
    {
      './file1': (() => {
        const a = [[2, '', '']];
        a.locals = {
          def: 'red',
        };
        return a;
      })(),
      './file2': (() => {
        const a = [[3, '', '']];
        a.locals = {
          def: 'green',
        };
        return a;
      })(),
    }
  );
  testLocal(
    'should import values contain comma',
    "@value color from './file1'; @value shadow: 0 0 color,0 0 color; .ghi { box-shadow: shadow; }",
    [[2, '', ''], [1, '.ghi { box-shadow: 0 0 red,0 0 red; }', '']],
    {
      color: 'red',
      shadow: '0 0 red,0 0 red',
    },
    '',
    {
      './file1': (() => {
        const a = [[2, '', '']];
        a.locals = {
          color: 'red',
        };
        return a;
      })(),
    }
  );
  testLocal(
    'should import values contain comma and space before comma',
    "@value color from './file1'; @value shadow: 0 0 color ,0 0 color; .ghi { box-shadow: shadow; }",
    [[2, '', ''], [1, '.ghi { box-shadow: 0 0 red ,0 0 red; }', '']],
    {
      color: 'red',
      shadow: '0 0 red ,0 0 red',
    },
    '',
    {
      './file1': (() => {
        const a = [[2, '', '']];
        a.locals = {
          color: 'red',
        };
        return a;
      })(),
    }
  );
  testLocal(
    'should import values contain tralling comma and space after comma',
    "@value color from './file1'; @value shadow: 0 0 color, 0 0 color; .ghi { box-shadow: shadow; }",
    [[2, '', ''], [1, '.ghi { box-shadow: 0 0 red, 0 0 red; }', '']],
    {
      color: 'red',
      shadow: '0 0 red, 0 0 red',
    },
    '',
    {
      './file1': (() => {
        const a = [[2, '', '']];
        a.locals = {
          color: 'red',
        };
        return a;
      })(),
    }
  );
});
