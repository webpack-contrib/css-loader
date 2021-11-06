/**
 * @jest-environment jsdom
 */

const getUrl = require("../../src/runtime/getUrl");

describe("escape", () => {
  it("should escape url", () => {
    expect(getUrl(true)).toMatchSnapshot();
    expect(getUrl(null)).toMatchSnapshot();
    // eslint-disable-next-line no-undefined
    expect(getUrl(undefined)).toMatchSnapshot();
    expect(getUrl("image.png")).toMatchSnapshot();
    expect(getUrl('"image.png"')).toMatchSnapshot();
    expect(getUrl("'image.png'")).toMatchSnapshot();
    expect(getUrl("image other.png")).toMatchSnapshot();
    expect(getUrl('"image other.png"')).toMatchSnapshot();
    expect(getUrl("'image other.png'")).toMatchSnapshot();
    expect(getUrl('image"other.png')).toMatchSnapshot();
    expect(getUrl("image\nother.png")).toMatchSnapshot();

    expect(getUrl("image.png", { hash: "#hash" })).toMatchSnapshot();
    expect(getUrl('"image.png"', { hash: "#hash" })).toMatchSnapshot();
    expect(getUrl("'image.png'", { hash: "#hash" })).toMatchSnapshot();
    expect(getUrl("image other.png", { hash: "#hash" })).toMatchSnapshot();
    expect(getUrl('"image other.png"', { hash: "#hash" })).toMatchSnapshot();
    expect(getUrl("'image other.png'", { hash: "#hash" })).toMatchSnapshot();

    expect(getUrl("image other.png", { needQuotes: true })).toMatchSnapshot();
    expect(getUrl("'image other.png'", { needQuotes: true })).toMatchSnapshot();
    expect(getUrl('"image other.png"', { needQuotes: true })).toMatchSnapshot();

    expect(
      getUrl({ default: "image.png", __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: "'image.png'", __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: '"image.png"', __esModule: true })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: "image other.png", __esModule: true })
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
      getUrl({ default: "image\nother.png", __esModule: true })
    ).toMatchSnapshot();

    expect(
      getUrl({ default: "image.png", __esModule: true }, { hash: "#hash" })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: '"image.png"', __esModule: true }, { hash: "#hash" })
    ).toMatchSnapshot();
    expect(
      getUrl({ default: "'image.png'", __esModule: true }, { hash: "#hash" })
    ).toMatchSnapshot();
    expect(
      getUrl(
        { default: "image other.png", __esModule: true },
        { hash: "#hash" }
      )
    ).toMatchSnapshot();

    expect(
      getUrl(
        { default: "image other.png", __esModule: true },
        { needQuotes: true }
      )
    ).toMatchSnapshot();
    expect(
      getUrl(
        { default: "'image other.png'", __esModule: true },
        { needQuotes: true }
      )
    ).toMatchSnapshot();
    expect(
      getUrl(
        { default: '"image other.png"', __esModule: true },
        { needQuotes: true }
      )
    ).toMatchSnapshot();

    expect(
      getUrl("image other.png", { hash: "#hash", needQuotes: true })
    ).toMatchSnapshot();
    expect(
      getUrl('"image other.png"', { hash: "#hash", needQuotes: true })
    ).toMatchSnapshot();
    expect(
      getUrl("'image other.png'", { hash: "#hash", needQuotes: true })
    ).toMatchSnapshot();
    expect(
      getUrl("image other.png", { hash: "#hash", needQuotes: true })
    ).toMatchSnapshot();

    expect(
      getUrl(
        { default: "image other.png", __esModule: true },
        { hash: "#hash", needQuotes: true }
      )
    ).toMatchSnapshot();
    expect(
      getUrl(
        { default: '"image other.png"', __esModule: true },
        { hash: "#hash", needQuotes: true }
      )
    ).toMatchSnapshot();
    expect(
      getUrl(
        { default: "'image other.png'", __esModule: true },
        { hash: "#hash", needQuotes: true }
      )
    ).toMatchSnapshot();
    expect(
      getUrl(
        { default: "image other.png", __esModule: true },
        { hash: "#hash", needQuotes: true }
      )
    ).toMatchSnapshot();
  });
});
