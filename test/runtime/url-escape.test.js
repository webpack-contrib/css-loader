const urlEscape = require('../../src/runtime/url-escape');

describe('escape', () => {
  it('should escape url', () => {
    expect(urlEscape(true)).toMatchSnapshot();
    expect(urlEscape('image.png')).toMatchSnapshot();
    expect(urlEscape('"image.png"')).toMatchSnapshot();
    expect(urlEscape("'image.png'")).toMatchSnapshot();
    expect(urlEscape('image other.png')).toMatchSnapshot();
    expect(urlEscape('"image other.png"')).toMatchSnapshot();
    expect(urlEscape("'image other.png'")).toMatchSnapshot();
    expect(urlEscape('image"other.png')).toMatchSnapshot();
    expect(urlEscape('image\nother.png')).toMatchSnapshot();
  });
});
