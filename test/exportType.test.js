import path from "path";

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
} from "./helpers/index";

describe("'exportType' option", () => {
  it("should work and export 'array' by default", async () => {
    const compiler = getCompiler("./basic.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'array' value", async () => {
    const compiler = getCompiler("./basic.js", {
      exportType: "array",
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'string' value", async () => {
    const compiler = getCompiler("./basic-string.js", {
      exportType: "string",
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'string' value and generate source maps", async () => {
    const compiler = getCompiler("./basic-string.js", {
      exportType: "string",
      sourceMap: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'string' value and CSS modules", async () => {
    const compiler = getCompiler("./basic-string-css-modules.js", {
      exportType: "string",
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./simple.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  // Note - chrome has bug https://bugs.chromium.org/p/chromium/issues/detail?id=1174094&q=CSSStyleSheet%20source%20maps&can=2
  it("should work with 'css-style-sheet' value and generate source maps", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
      sourceMap: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value and ECMA modules", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
      esModule: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value and CommonJS modules", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
      esModule: false,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value and keep import and emit errors on `@import` at-rules", async () => {
    const compiler = getCompiler("./basic-css-style-sheet-with-import.js", {
      exportType: "css-style-sheet",
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value and urls", async () => {
    const compiler = getCompiler("./url/url-css-style-sheet.js", {
      exportType: "css-style-sheet",
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value and CSS modules and still emit error on '@import' at-rules", async () => {
    const compiler = getCompiler(
      "./modules/composes/composes-css-style-sheet.js",
      {
        exportType: "css-style-sheet",
        modules: true,
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with CSS modules and the 'exportOnlyLocals' option", async () => {
    const compiler = getCompiler(
      "./modules/composes/composes-css-style-sheet-only-locals.js",
      {
        exportType: "css-style-sheet",
        modules: {
          exportOnlyLocals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' and 'array' values", async () => {
    const compiler = getCompiler(
      "./basic-javascript-and-css-style-sheet.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.(mycss|css)$/i,
              oneOf: [
                {
                  assert: { type: "css" },
                  loader: path.resolve(__dirname, "./../src"),
                  options: { exportType: "css-style-sheet" },
                },
                {
                  loader: path.resolve(__dirname, "./../src"),
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./basic-css-style-sheet.css", stats)
    ).toMatchSnapshot("module");
    expect(getModuleSource("./basic.css?foo=1", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'css-style-sheet' value and with 'sass-loader'", async () => {
    const compiler = getCompiler(
      "./scss/css-style-sheet.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    exportType: "css-style-sheet",
                  },
                },
                {
                  loader: "sass-loader",
                  options: {
                    // eslint-disable-next-line global-require
                    implementation: require("sass"),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./scss/source.scss", stats)).toMatchSnapshot(
      "module"
    );
    expect(
      getExecutedCode("main.bundle.js", compiler, stats, "css-style-sheet")
    ).toMatchSnapshot("result");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw an error with 'css-style-sheet' value for CSS modules when named export disabled", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
      modules: {
        namedExport: false,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it("should throw an error with 'css-style-sheet' value for CSS modules when `esModule` disabled", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
      esModule: false,
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it("should throw an error with 'css-style-sheet' value for CSS modules when `esModule` disabled, but 'modules.namedExport' enabled", async () => {
    const compiler = getCompiler("./basic-css-style-sheet.js", {
      exportType: "css-style-sheet",
      esModule: false,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });
});
