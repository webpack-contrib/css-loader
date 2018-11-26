const escape = require('../../lib/runtime/escape');

describe('escape', () => {
  it('should escape url', () => {
    expect(escape(true)).toMatchSnapshot();
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
