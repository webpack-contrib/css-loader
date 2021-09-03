import path from "path";

import {
  compile,
  getCompiler,
  getErrors,
  getModuleSource,
  getWarnings,
} from "./helpers/index";

describe("exportStylesheet option", () => {
  it("should work", async () => {
    const compiler = getCompiler(
      "./basic-import-assertion-css.js",
      {
        exportStyleSheet: true,
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with ECMA modules", async () => {
    const compiler = getCompiler(
      "./basic-import-assertion-css.js",
      {
        exportStyleSheet: true,
        esModule: true,
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with CommonJS modules", async () => {
    const compiler = getCompiler(
      "./basic-import-assertion-css.js",
      {
        exportStyleSheet: true,
        esModule: false,
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work and keep import as is", async () => {
    const compiler = getCompiler(
      "./basic-import-assertion-css.js",
      {
        exportStyleSheet: true,
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with urls", async () => {
    const compiler = getCompiler(
      "./url/url-import-assertion-css.js",
      {
        exportStyleSheet: true,
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with CSS modules", async () => {
    const compiler = getCompiler(
      "./modules/composes/composes-import-assertion-css.js",
      {
        exportStyleSheet: true,
        modules: true,
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with CSS modules and the 'exportOnlyLocals' option", async () => {
    const compiler = getCompiler(
      "./modules/composes/composes-import-assertion-css.js",
      {
        exportStyleSheet: true,
        modules: {
          exportOnlyLocals: true,
        },
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work and export CSSStyleSheet for import assertion and basic output", async () => {
    const compiler = getCompiler(
      "./basic-import-assertion-css-and-standard.js",
      {},
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
        module: {
          rules: [
            {
              test: /\.(mycss|css)$/i,
              oneOf: [
                {
                  assert: { type: "css" },
                  loader: path.resolve(__dirname, "./../src"),
                  options: { exportStyleSheet: true },
                },
                {
                  loader: path.resolve(__dirname, "./../src"),
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
              resourceQuery: /^(?!.*\?ignore-asset-modules).*$/,
              type: "asset/resource",
            },
            {
              resourceQuery: /\?ignore-asset-modules$/,
              type: "javascript/auto",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  // TODO https://bugs.chromium.org/p/chromium/issues/detail?id=1174094&q=CSSStyleSheet%20source%20maps&can=2
  it("should work with source maps", async () => {
    const compiler = getCompiler(
      "./basic-import-assertion-css.js",
      {
        exportStyleSheet: true,
      },
      {
        devtool: "source-map",
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "sass-loader"', async () => {
    const compiler = getCompiler(
      "./scss/import-assertion-css.js",
      {},
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    exportStyleSheet: true,
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
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw an error for CSS modules and disable named export", async () => {
    const compiler = getCompiler(
      "./modules/composes/composes-import-assertion-css.js",
      {
        exportStyleSheet: true,
        modules: {
          namedExport: false,
        },
      },
      {
        target: "web",
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          assetModuleFilename: "[name][ext]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
