import path from "path";

import postcssPresetEnv from "postcss-preset-env";

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
} from "./helpers/index";

jest.setTimeout(10000);

describe("loader", () => {
  it("should work", async () => {
    const compiler = getCompiler("./basic.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work in 'production' mode", async () => {
    const compiler = getCompiler(
      "./basic.js",
      {},
      {
        mode: "production",
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with empty css", async () => {
    const compiler = getCompiler("./empty.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./empty.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with empty options", async () => {
    const compiler = getCompiler("./basic.js", {});
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "asset" module type', async () => {
    const config = {
      module: {
        rules: [
          {
            test: /\.css$/i,
            use: [
              {
                loader: path.resolve(__dirname, "../src"),
              },
            ],
          },
          {
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
            type: "asset",
          },
        ],
      },
    };

    config.output = {
      path: path.resolve(__dirname, "outputs"),
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      publicPath: "/webpack/public/path/",
      assetModuleFilename: "[name][ext]",
    };

    const compiler = getCompiler("./basic.js", {}, config);
    const stats = await compile(compiler);

    expect(getModuleSource("./basic.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throws error when no loader(s) for assets", async () => {
    const compiler = getCompiler(
      "./basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, "../src"),
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw error on invalid css syntax", async () => {
    const compiler = getCompiler("./error.js", {});
    const stats = await compile(compiler);

    expect(
      stats.compilation.fileDependencies.has(
        path.resolve("./test/fixtures/error.css")
      )
    ).toBe(true);
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, false, "postcss")).toMatchSnapshot("errors");
  });

  it('should reuse `ast` from "postcss-loader"', async () => {
    const spy = jest.fn();
    const compiler = getCompiler(
      "./postcss-present-env/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { importLoaders: 1 },
                },
                {
                  loader: require.resolve("./helpers/ast-loader"),
                  options: { spy },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(spy).toHaveBeenCalledTimes(1);

    expect(
      getModuleSource("./postcss-present-env/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "sass-loader"', async () => {
    const compiler = getCompiler(
      "./scss/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              rules: [
                { loader: path.resolve(__dirname, "../src") },
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
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with ModuleConcatenationPlugin", async () => {
    const compiler = getCompiler(
      "./basic.js",
      {},
      {
        mode: "production",
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { esModule: true },
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: "file-loader",
              options: { name: "[name].[ext]", esModule: true },
              type: "javascript/auto",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(stats.compilation.modules.size).toBe(14);
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with ModuleConcatenationPlugin (file-loader)", async () => {
    const compiler = getCompiler(
      "./basic.js",
      {},
      {
        mode: "production",
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, "../src"),
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: "file-loader",
              options: { name: "[name].[ext]", esModule: true },
              type: "javascript/auto",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(stats.compilation.modules.size).toBe(14);
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with ModuleConcatenationPlugin (url-loader)", async () => {
    const compiler = getCompiler(
      "./basic.js",
      {},
      {
        mode: "production",
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, "../src"),
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
              loader: "url-loader",
              options: { name: "[name].[ext]", limit: true, esModule: true },
              type: "javascript/auto",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(stats.compilation.modules.size).toBe(13);
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #1033", async () => {
    const compiler = getCompiler("./modules/issue-1033/issue-1033.js", {
      modules: {
        mode: "local",
        localIdentName: "_[local]",
        exportOnlyLocals: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1033/issue-1033.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #1033 (2)", async () => {
    const compiler = getCompiler("./modules/issue-1033/issue-1033.js", {
      modules: { mode: "local", localIdentName: "_[local]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1033/issue-1033.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw an error on invisible spaces", async () => {
    const compiler = getCompiler("./invisible-space.js");
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, false, "postcss")).toMatchSnapshot("errors");
  });

  it('should work with the "modules.auto" option and the "import.loaders" option', async () => {
    const compiler = getCompiler(
      "./integration/index.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.((c|sa|sc)ss)$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    // Run only `postcss-loader` on each `@import`
                    // If you need run `sass-loader` and `postcss-loader` please set it to `2`
                    importLoaders: 1,
                    // Automatically enable css modules for files satisfying `/\.module\.\w+$/i` RegExp.
                    modules: { auto: true },
                  },
                },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
                  },
                },
                // Can be `less-loader`
                // The `test` property should be `\.less/i`
                {
                  test: /\.s[ac]ss$/i,
                  loader: "sass-loader",
                },
              ],
            },
            {
              test: /\.(png|jpe?g|gif|svg|eot|ttf|woff|woff2)$/i,
              loader: "url-loader",
              options: {
                limit: 8192,
              },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with none AST metadata", async () => {
    const compiler = getCompiler(
      "./simple.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                },
                {
                  loader: path.resolve(__dirname, "../test/helpers/preLoader"),
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate console.warn when plugins disabled and hideNothingWarning is "true"', async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const compiler = getCompiler("./empty.js", {
      import: false,
      url: false,
    });
    const stats = await compile(compiler);

    // eslint-disable-next-line no-console
    expect(console.warn).not.toHaveBeenCalledWith(
      "You did not set any plugins, parser, or stringifier. " +
        "Right now, PostCSS does nothing. Pick plugins for your case " +
        "on https://www.postcss.parts/ and use them in postcss.config.js."
    );
    expect(getModuleSource("./empty.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should pass queries to other loader", async () => {
    const compiler = getCompiler(
      "./other-loader-query.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.svg$/i,
              resourceQuery: /color/,
              enforce: "pre",
              use: {
                loader: path.resolve(
                  __dirname,
                  "./helpers/svg-color-loader.js"
                ),
              },
            },
            {
              test: /\.css$/i,
              rules: [{ loader: path.resolve(__dirname, "../src") }],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./other-loader-query.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with webpackIgnore comment", async () => {
    const compiler = getCompiler("./webpackIgnore.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./webpackIgnore.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with inline module syntax", async () => {
    const compiler = getCompiler(
      "./index-loader-syntax.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.s?[ca]ss$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { importLoaders: 1 },
                },
                {
                  loader: "sass-loader",
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./index-loader-syntax.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
