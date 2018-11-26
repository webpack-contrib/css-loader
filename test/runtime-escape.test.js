const escape = require('../lib/runtime/escape');

describe('runtime escape', () => {
  it('should escape url', () => {
    expect(escape(true)).toBe(true);
    expect(escape('image.png')).toBe('image.png');
    expect(escape('"image.png"')).toBe('image.png');
    expect(escape("'image.png'")).toBe('image.png');
    expect(escape('image other.png')).toBe('"image other.png"');
    expect(escape('"image other.png"')).toBe('"image other.png"');
    expect(escape("'image other.png'")).toBe('"image other.png"');
    expect(escape('image"other.png')).toBe('"image\\"other.png"');
    expect(escape('image\nother.png')).toBe('"image\\nother.png"');
  });
});
