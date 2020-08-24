/**
 * @jest-environment jsdom
 */

const api = require('../../src/runtime/api');

describe('api', () => {
  beforeAll(() => {
    global.btoa = function btoa(str) {
      let buffer = null;

      if (str instanceof Buffer) {
        buffer = str;
      } else {
        buffer = Buffer.from(str.toString(), 'binary');
      }

      return buffer.toString('base64');
    };
  });

  afterAll(() => {
    global.btoa = null;
  });

  it('should toString a single module', () => {
    const m = api();

    m.push([1, 'body { a: 1; }', '']);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should toString multiple modules', () => {
    const m = api();

    m.push([2, 'body { b: 2; }', '']);
    m.push([1, 'body { a: 1; }', '']);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should toString with media query', () => {
    const m = api();

    const m1 = [1, 'body { a: 1; }', 'screen'];
    const m2 = [2, 'body { b: 2; }', ''];
    const m3 = [3, 'body { c: 3; }', ''];
    const m4 = [4, 'body { d: 4; }', ''];

    m.i([m2, m3], '');
    m.i([m2], '');
    m.i([m2, m4], 'print');
    m.push(m1);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should import modules', () => {
    const m = api();
    const m1 = [1, 'body { a: 1; }', '(orientation:landscape)'];
    const m2 = [2, 'body { b: 2; }', ''];
    const m3 = [3, 'body { c: 3; }', ''];
    const m4 = [4, 'body { d: 4; }', ''];

    m.i([m2, m3], '');
    m.i([m2], '');
    m.i([m2, m4], 'print');
    m.i([m1], 'screen');
    m.push(m1);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should import named modules', () => {
    const m = api();
    const m1 = ['./module1', 'body { a: 1; }', 'screen'];
    const m2 = ['./module2', 'body { b: 2; }', ''];
    const m3 = ['./module3', 'body { c: 3; }', ''];
    const m4 = ['./module4', 'body { d: 4; }', ''];

    m.i([m2, m3], '');
    m.i([m2], '');
    m.i([m2, m4], 'print');
    m.push(m1);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should toString with source mapping', () => {
    const m = api(true);

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

    expect(m.toString()).toMatchSnapshot();
  });

  it('should toString with a source map without "sourceRoot"', () => {
    const m = api(true);

    m.push([
      1,
      'body { a: 1; }',
      '',
      {
        file: 'test.scss',
        sources: ['./path/to/test.scss'],
        mappings: 'AAAA;',
      },
    ]);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should toString without source mapping if btoa not available', () => {
    global.btoa = null;

    const m = api(true);

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

    expect(m.toString()).toMatchSnapshot();
  });

  it('should import modules with dedupe', () => {
    const m = api();

    const m1 = [null, 'body { b: 1; }', ''];
    const m2 = ['./module2', 'body { b: 2; }', ''];
    const m3 = ['./module3', '.button { b: 3; }', ''];

    m.i([m1], '', true);
    m.i([m2], '', true);
    m.i([m3], '', true);
    m.i([m3], '', true);
    m.i([m3], '', true);

    expect(m.toString()).toMatchSnapshot();
    expect(m.length).toBe(3);
  });

  it('should import modules when module string', () => {
    const m = api();

    m.i('.button { b: 2; }');
    m.i('');

    expect(m.toString()).toMatchSnapshot();
  });
});
