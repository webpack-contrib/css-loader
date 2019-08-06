const getUrl = require('../../src/runtime/getUrl');

describe('escape', () => {
  it('should escape url', () => {
    expect(getUrl(true)).toMatchSnapshot();
    expect(getUrl('image.png')).toMatchSnapshot();
    expect(getUrl('"image.png"')).toMatchSnapshot();
    expect(getUrl("'image.png'")).toMatchSnapshot();
    expect(getUrl('image other.png')).toMatchSnapshot();
    expect(getUrl('"image other.png"')).toMatchSnapshot();
    expect(getUrl("'image other.png'")).toMatchSnapshot();
    expect(getUrl('image"other.png')).toMatchSnapshot();
    expect(getUrl('image\nother.png')).toMatchSnapshot();

    expect(getUrl('image.png', true)).toMatchSnapshot();
    expect(getUrl("'image other.png'", true)).toMatchSnapshot();
    expect(getUrl('"image other.png"', true)).toMatchSnapshot();

    expect(
      getUrl({ default: 'image.png', __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: "'image.png'", __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: '"image.png"', __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: 'image other.png', __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: '"image other.png"', __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: "'image other.png'", __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: 'image"other.png', __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: 'image\nother.png', __esModule: true })
    ).toMatchSnapshot();

    expect(
      getUrl({ default: 'image.png', __esModule: true }, true)
    ).toMatchSnapshot();
    expect(
      getUrl({ default: "'image.png'", __esModule: true }, true)
    ).toMatchSnapshot();
    expect(
      getUrl({ default: '"image.png"', __esModule: true }, true)
    ).toMatchSnapshot();
  });
});
