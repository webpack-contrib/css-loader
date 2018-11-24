/* eslint-env mocha*/

const base = require('../lib/css-base');

describe('css-base', () => {
  before(() => {
    global.btoa = function btoa(str) {
      let buffer = null;

      if (str instanceof Buffer) {
        buffer = str;
      } else {
        buffer = new Buffer(str.toString(), 'binary');
      }

      return buffer.toString('base64');
    };
  });

  after(() => {
    global.btoa = null;
  });

  it('should toString a single module', () => {
    const m = base();
    m.push([1, 'body { a: 1; }', '']);
    m.toString().should.be.eql('body { a: 1; }');
  });
  it('should toString multiple modules', () => {
    const m = base();
    m.push([2, 'body { b: 2; }', '']);
    m.push([1, 'body { a: 1; }', '']);
    m.toString().should.be.eql('body { b: 2; }body { a: 1; }');
  });
  it('should toString with media query', () => {
    const m = base();
    m.push([1, 'body { a: 1; }', 'screen']);
    m.toString().should.be.eql('@media screen{body { a: 1; }}');
  });
  it('should import modules', () => {
    const m = base();
    const m1 = [1, 'body { a: 1; }', 'screen'];
    const m2 = [2, 'body { b: 2; }', ''];
    const m3 = [3, 'body { c: 3; }', ''];
    const m4 = [4, 'body { d: 4; }', ''];
    m.i([m2, m3], '');
    m.i([m2], '');
    m.i([m2, m4], 'print');
    m.push(m1);
    m.toString().should.be.eql(
      'body { b: 2; }' +
        'body { c: 3; }' +
        '@media print{body { d: 4; }}' +
        '@media screen{body { a: 1; }}'
    );
  });
  it('should import named modules', () => {
    const m = base();
    const m1 = ['./module1', 'body { a: 1; }', 'screen'];
    const m2 = ['./module2', 'body { b: 2; }', ''];
    const m3 = ['./module3', 'body { c: 3; }', ''];
    const m4 = ['./module4', 'body { d: 4; }', ''];
    m.i([m2, m3], '');
    m.i([m2], '');
    m.i([m2, m4], 'print');
    m.push(m1);
    m.toString().should.be.eql(
      'body { b: 2; }' +
        'body { c: 3; }' +
        '@media print{body { d: 4; }}' +
        '@media screen{body { a: 1; }}'
    );
  });
  it('should toString with source mapping', () => {
    const m = base(true);
    m.push([
      1,
      'body { a: 1; }',
      '',
      {
        file: 'test.scss',
        sources: ['./path/to/test.scss'],
        mappings: 'AAAA;',
        sourceRoot: 'webpack://',
      },
    ]);
    m.toString().should.be.eql(
      'body { a: 1; }\n/*# sourceURL=webpack://./path/to/test.scss */\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJmaWxlIjoidGVzdC5zY3NzIiwic291cmNlcyI6WyIuL3BhdGgvdG8vdGVzdC5zY3NzIl0sIm1hcHBpbmdzIjoiQUFBQTsiLCJzb3VyY2VSb290Ijoid2VicGFjazovLyJ9 */'
    );
  });
  it('should toString without source mapping if btoa not avalibale', () => {
    global.btoa = null;
    const m = base(true);
    m.push([
      1,
      'body { a: 1; }',
      '',
      {
        file: 'test.scss',
        sources: ['./path/to/test.scss'],
        mappings: 'AAAA;',
        sourceRoot: 'webpack://',
      },
    ]);
    m.toString().should.be.eql('body { a: 1; }');
  });
});
