/* eslint-env mocha*/

const runtimeEscape = require('../src/runtimeEscape');

describe('runtimeEscape', () => {
  it('escape', () => {
    expect(runtimeEscape(true)).toMatchSnapshot(true);
    expect(runtimeEscape('image.png')).toMatchSnapshot();
    expect(runtimeEscape('"image.png"')).toMatchSnapshot();
    expect(runtimeEscape("'image.png'")).toMatchSnapshot();
    expect(runtimeEscape('image other.png')).toMatchSnapshot();
    expect(runtimeEscape('"image other.png"')).toMatchSnapshot();
    expect(runtimeEscape("'image other.png'")).toMatchSnapshot();
    expect(runtimeEscape('image"other.png')).toMatchSnapshot();
    expect(runtimeEscape('image\nother.png')).toMatchSnapshot();
  });
});
