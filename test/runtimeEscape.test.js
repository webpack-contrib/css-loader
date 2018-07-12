/* eslint-env mocha*/

const runtimeEscape = require('../src/runtimeEscape');

describe('runtimeEscape', () => {
  it('escape', () => {
    expect(runtimeEscape(true)).toBe(true);
    expect(runtimeEscape('image.png')).toBe('image.png');
    expect(runtimeEscape('"image.png"')).toBe('image.png');
    expect(runtimeEscape("'image.png'")).toBe('image.png');
    expect(runtimeEscape('image other.png')).toBe('"image other.png"');
    expect(runtimeEscape('"image other.png"')).toBe('"image other.png"');
    expect(runtimeEscape("'image other.png'")).toBe('"image other.png"');
    expect(runtimeEscape('image"other.png')).toBe('"image\\"other.png"');
    expect(runtimeEscape('image\nother.png')).toBe('"image\\nother.png"');
  });
});
