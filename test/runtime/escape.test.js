/* eslint-env mocha*/

const escape = require('../../src/runtime/escape');

describe('escape', () => {
  it('basic', () => {
    expect(escape(true)).toMatchSnapshot(true);
    expect(escape('image.png')).toMatchSnapshot();
    expect(escape('"image.png"')).toMatchSnapshot();
    expect(escape("'image.png'")).toMatchSnapshot();
    expect(escape('image other.png')).toMatchSnapshot();
    expect(escape('"image other.png"')).toMatchSnapshot();
    expect(escape("'image other.png'")).toMatchSnapshot();
    expect(escape('image"other.png')).toMatchSnapshot();
    expect(escape('image\nother.png')).toMatchSnapshot();
  });
});
