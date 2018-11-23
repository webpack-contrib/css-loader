/* globals describe */

const { testLocals } = require('./helpers');

describe('customGetLocalIdent', () => {
  testLocals(
    'should return only locals',
    '.abc :local(.def) { color: red; } :local .ghi .jkl { color: blue; }',
    {
      def: 'foo',
      ghi: 'foo',
      jkl: 'foo',
    },
    {
      getLocalIdent() {
        return 'foo';
      },
    }
  );
});
