/**
 * @jest-environment jsdom
 */

/* eslint-disable func-names, no-undefined */

const api = require("../../src/runtime/api");
const noSourceMaps = require("../../src/runtime/noSourceMaps");
const sourceMaps = require("../../src/runtime/sourceMaps");

describe("api", () => {
  beforeAll(() => {
    global.btoa = function btoa(str) {
      let buffer = null;

      if (str instanceof Buffer) {
        buffer = str;
      } else {
        buffer = Buffer.from(str.toString(), "binary");
      }

      return buffer.toString("base64");
    };
  });

  afterAll(() => {
    global.btoa = null;
  });

  it("should toString a single module", () => {
    const m = api(noSourceMaps);

    m.push([1, "body { a: 1; }"]);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString multiple modules", () => {
    const m = api(noSourceMaps);

    m.push([2, "body { b: 2; }"]);
    m.push([1, "body { a: 1; }"]);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString with media query list", () => {
    const m = api(noSourceMaps);

    const m1 = [1, "body { a: 1; }", "(min-width: 900px)"];
    const m2 = [2, "body { b: 2; }", undefined];
    const m3 = [3, "body { c: 3; }", undefined];
    const m4 = [4, "body { d: 4; }", undefined];
    const m5 = [5, "body { e: 5; }", "screen and (min-width: 900px)"];

    m.i([m2, m3]);
    m.i([m2]);
    m.i([m2, m4], "print");
    m.push(m1);
    m.i([m1], "screen");
    m.i([m5]);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString with supports", () => {
    const m = api(noSourceMaps);

    const m1 = [1, "body { a: 1; }", undefined, undefined, "display: flex"];
    const m2 = [2, "body { b: 2; }", undefined];
    const m3 = [3, "body { c: 3; }", undefined];
    const m4 = [4, "body { d: 4; }", undefined];
    const m5 = [5, "body { e: 5; }", undefined, undefined, "display: grid"];

    m.i([m2, m3]);
    m.i([m2]);
    m.i([m2, m4], undefined, false, "display: flex");
    m.push(m1);
    m.i([m1, m5], undefined, false, "display: block");
    m.i([m5]);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString with layer", () => {
    const m = api(noSourceMaps);

    const m1 = [
      1,
      "body { a: 1; }",
      undefined,
      undefined,
      undefined,
      "default",
    ];
    const m2 = [2, "body { b: 2; }", undefined];
    const m3 = [3, "body { c: 3; }", undefined];
    const m4 = [4, "body { d: 4; }", undefined];
    const m5 = [5, "body { e: 5; }", undefined, undefined, undefined, ""];
    const m6 = [
      5,
      "body { f: 6; }",
      undefined,
      undefined,
      undefined,
      undefined,
    ];

    m.i([m2, m3], undefined);
    m.i([m2], undefined);
    m.i([m2, m4], "print");
    m.push(m1);
    m.i([m5]);
    m.i([m1, m5], undefined, undefined, undefined, "framework");
    m.i([m6], undefined, undefined, undefined, "framework");

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString with media query list, layer and supports", () => {
    const m = api(noSourceMaps);

    const m1 = [
      1,
      "body { a: 1; }",
      "screen",
      undefined,
      "display: grid",
      "default",
    ];
    const m2 = [2, "body { b: 2; }", undefined];
    const m3 = [3, "body { c: 3; }", undefined];
    const m4 = [4, "body { d: 4; }", undefined];
    const m5 = [
      5,
      "body { a: 1; }",
      "screen",
      undefined,
      "display: grid",
      "default",
    ];

    m.i([m2, m3], undefined);
    m.i([m2], undefined);
    m.i([m2, m4], "print");
    m.push(m1);
    m.i(
      [m5],
      "screen and (mix-width: 100px)",
      false,
      "display: block",
      "framework"
    );

    expect(m.toString()).toMatchSnapshot();
  });

  it("should import modules", () => {
    const m = api(noSourceMaps);
    const m1 = [1, "body { a: 1; }", "(orientation:landscape)"];
    const m2 = [2, "body { b: 2; }", undefined];
    const m3 = [3, "body { c: 3; }", undefined];
    const m4 = [4, "body { d: 4; }", undefined];

    m.i([m2, m3], undefined);
    m.i([m2], undefined);
    m.i([m2, m4], "print");
    m.i([m1], "screen");
    m.push(m1);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should import named modules", () => {
    const m = api(noSourceMaps);
    const m1 = ["./module1", "body { a: 1; }", "screen"];
    const m2 = ["./module2", "body { b: 2; }", undefined];
    const m3 = ["./module3", "body { c: 3; }", undefined];
    const m4 = ["./module4", "body { d: 4; }", undefined];

    m.i([m2, m3], undefined);
    m.i([m2], undefined);
    m.i([m2, m4], "print");
    m.push(m1);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString with source mapping", () => {
    const m = api(sourceMaps);

    m.push([
      1,
      "body { a: 1; }",
      undefined,
      {
        file: "test.scss",
        sources: ["./path/to/test.scss"],
        mappings: "AAAA;",
        sourceRoot: "webpack://",
      },
    ]);

    expect(m.toString()).toMatchSnapshot();
  });

  it('should toString with a source map without "sourceRoot"', () => {
    const m = api(sourceMaps);

    m.push([
      1,
      "body { a: 1; }",
      "",
      {
        file: "test.scss",
        sources: ["./path/to/test.scss"],
        mappings: "AAAA;",
      },
    ]);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should toString without source mapping if btoa not available", () => {
    global.btoa = null;

    const m = api(sourceMaps);

    m.push([
      1,
      "body { a: 1; }",
      undefined,
      {
        file: "test.scss",
        sources: ["./path/to/test.scss"],
        mappings: "AAAA;",
        sourceRoot: "webpack://",
      },
    ]);

    expect(m.toString()).toMatchSnapshot();
  });

  // https://github.com/webpack-contrib/css-loader/issues/1322
  it("should toString with a source map without map", () => {
    const m = api(sourceMaps);

    m.push([
      1,
      "@import url('https://fonts.googleapis.com/css?family=Open+Sans&display=swap');",
    ]);

    expect(m.toString()).toMatchSnapshot();
  });

  it("should import modules with dedupe", () => {
    const m = api(noSourceMaps);

    const m1 = [null, "body { b: 1; }", ""];
    const m2 = ["./module2", "body { b: 2; }", ""];
    const m3 = ["./module3", ".button { b: 3; }", ""];

    m.i([m1], "", true);
    m.i([m2], "", true);
    m.i([m3], "", true);
    m.i([m3], "", true);
    m.i([m3], "", true);

    expect(m.toString()).toMatchSnapshot();
    expect(m.length).toBe(3);
  });

  it("should import modules when module string", () => {
    const m = api(noSourceMaps);

    m.i(".button { b: 2; }");
    m.i("");

    expect(m.toString()).toMatchSnapshot();
  });
});
