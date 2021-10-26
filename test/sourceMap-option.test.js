import path from "path";

import postcssPresetEnv from "postcss-preset-env";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

import {
  compile,
  getCompiler,
  getErrors,
  getExecutedCode,
  getModuleSource,
  getWarnings,
  readAsset,
} from "./helpers/index";

jest.setTimeout(10000);

describe('"sourceMap" option', () => {
  it("should not generate source maps by default when the 'devtool' option is false", async () => {
    const compiler = getCompiler("./source-map/basic.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when the 'sourceMap' option is 'true'", async () => {
    const compiler = getCompiler("./source-map/basic.js", {
      sourceMap: true,
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when the 'sourceMap' option is 'true' #2", async () => {
    const compiler = getCompiler("./source-map/with-query.js", {
      sourceMap: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./source-map/with-query.css?url=false", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps and respect 'nosources' value", async () => {
    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        devtool: "nosources-source-map",
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when previous loader does not generate source maps", async () => {
    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
                {
                  loader: path.resolve(
                    __dirname,
                    "./fixtures/source-map-loader.js"
                  ),
                  options: {
                    sourceMap: null,
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when previous loader generates source maps without "sourceRoot"', async () => {
    const absolutePath = path.resolve(
      __dirname,
      "fixtures",
      "source-map",
      "basic.css"
    );

    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
                {
                  loader: path.resolve(
                    __dirname,
                    "./fixtures/source-map-loader.js"
                  ),
                  options: {
                    sourceMap: JSON.stringify({
                      version: 3,
                      sources: [absolutePath],
                      names: [],
                      mappings: "AAAA,6BAA6B;;AAE7B;EACE,UAAU;AACZ",
                      file: absolutePath,
                      sourcesContent: [
                        '@import "./nested/nested.css";\n\n.class {\n  color: red;\n}\n',
                      ],
                    }),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when previous loader generates different source in source maps", async () => {
    const absoluteSourceRoot = path.resolve(
      __dirname,
      "fixtures",
      "source-map"
    );
    const absolutePath = path.resolve(absoluteSourceRoot, "basic-1.css");
    const relativePath = path.relative(
      absoluteSourceRoot,
      path.resolve(__dirname, "fixtures", "source-map", "basic-2.css")
    );

    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
                {
                  loader: path.resolve(
                    __dirname,
                    "./fixtures/source-map-loader.js"
                  ),
                  options: {
                    sourceMap: JSON.stringify({
                      version: 3,
                      sourceRoot: absoluteSourceRoot,
                      sources: [
                        // Absolute path
                        absolutePath,
                        // Relative path
                        relativePath,
                        // Absolute URL
                        "https://example.com/foo.css",
                        // Scheme-relative URL,
                        "//example.com/foo.css",
                        // Non-standard postcss syntax
                        `</foo/bar/baz.css`,
                      ],
                      names: [],
                      mappings: "AAAA,6BAA6B;;AAE7B;EACE,UAAU;AACZ",
                      file: absolutePath,
                      sourcesContent: [
                        '@import "./nested/nested.css";\n\n.class {\n  color: red;\n}\n',
                        "a { color: red; }",
                        "a { color: green; }",
                        "a { color: blue; }",
                        "a { color: azure; }",
                      ],
                    }),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when previous loader generates source maps with "sourceRoot"', async () => {
    const absoluteSourceRoot = path.resolve(
      __dirname,
      "fixtures",
      "source-map"
    );
    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
                {
                  loader: path.resolve(
                    __dirname,
                    "./fixtures/source-map-loader.js"
                  ),
                  options: {
                    sourceMap: JSON.stringify({
                      foo: "bar",
                      version: 3,
                      sources: ["basic.css"],
                      sourceRoot: absoluteSourceRoot,
                      names: [],
                      mappings: "AAAA,6BAA6B;;AAE7B;EACE,UAAU;AACZ",
                      file: "basic.css",
                      sourcesContent: [
                        '@import "./nested/nested.css";\n\n.class {\n  color: red;\n}\n',
                      ],
                    }),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when previous loader generates source maps ("postcss-loader")', async () => {
    const compiler = getCompiler(
      "./source-map/basic-postcss.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
                    sourceMap: true,
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./source-map/basic.postcss.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when previous loader generates source maps ("sass-loader")', async () => {
    const compiler = getCompiler(
      "./source-map/basic-scss.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.s[ca]ss$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader: "sass-loader",
                  options: {
                    // eslint-disable-next-line global-require
                    implementation: require("sass"),
                    sourceMap: true,
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.scss", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when previous loader generates source maps ("less-loader")', async () => {
    const compiler = getCompiler(
      "./source-map/basic-less.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.less$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader: "less-loader",
                  options: {
                    sourceMap: true,
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/base.less", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when previous loader generates source maps ("stylus-loader")', async () => {
    const compiler = getCompiler(
      "./source-map/basic-styl.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.styl$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    sourceMap: true,
                  },
                },
                {
                  loader: "stylus-loader",
                  options: {
                    sourceMap: true,
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/base.styl", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps and do not change "[contenthash]" on different platform', async () => {
    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        devtool: "source-map",
        // webpack@4 has bug
        // It uses readableIdentifier to generate the sources, which uses the RequestShortener,
        // which has some problems with paths that are 2 folders above the context
        context: path.resolve(__dirname, ".."),
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].[contenthash].bundle.js",
          chunkFilename: "[name].[contenthash].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);
    const chunkName = Object.keys(stats.compilation.assets).find((assetName) =>
      /\.js$/.test(assetName)
    );

    expect(chunkName).toBe("main.25338c5bc4249008fa47.bundle.js");
    expect(
      getModuleSource("fixtures/source-map/basic.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode(chunkName, compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when css was extracted when the 'devtool' property is 'source-map'", async () => {
    const compiler = getCompiler(
      "./source-map/extract.js",
      {},
      {
        devtool: "source-map",
        output: {
          path: path.resolve(__dirname, "../outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].css",
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(readAsset("main.css", compiler, stats)).toMatchSnapshot(
      "extracted css"
    );
    expect(
      JSON.parse(readAsset("main.css.map", compiler, stats))
    ).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when css was extracted when the 'devtool' property is 'nosources-source-map'", async () => {
    const compiler = getCompiler(
      "./source-map/extract.js",
      {},
      {
        devtool: "nosources-source-map",
        output: {
          path: path.resolve(__dirname, "../outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].css",
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(readAsset("main.css", compiler, stats)).toMatchSnapshot(
      "extracted css"
    );
    expect(
      JSON.parse(readAsset("main.css.map", compiler, stats))
    ).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when css was extracted when the 'devtool' property is 'hidden-nosources-source-map'", async () => {
    const compiler = getCompiler(
      "./source-map/extract.js",
      {},
      {
        devtool: "hidden-nosources-source-map",
        output: {
          path: path.resolve(__dirname, "../outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].css",
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(readAsset("main.css", compiler, stats)).toMatchSnapshot(
      "extracted css"
    );
    expect(
      JSON.parse(readAsset("main.css.map", compiler, stats))
    ).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when css was extracted when the 'devtool' property is 'hidden-source-map'", async () => {
    const compiler = getCompiler(
      "./source-map/extract.js",
      {},
      {
        devtool: "hidden-source-map",
        output: {
          path: path.resolve(__dirname, "../outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].css",
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(readAsset("main.css", compiler, stats)).toMatchSnapshot(
      "extracted css"
    );
    expect(
      JSON.parse(readAsset("main.css.map", compiler, stats))
    ).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when css was extracted and do not change "[contenthash]" on different platform', async () => {
    const compiler = getCompiler(
      "./source-map/extract.js",
      {},
      {
        devtool: "source-map",
        // webpack@4 has bug
        // It uses readableIdentifier to generate the sources, which uses the RequestShortener,
        // which has some problems with paths that are 2 folders above the context
        context: path.resolve(__dirname, ".."),
        output: {
          path: path.resolve(__dirname, "../outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: true },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);
    const chunkName = Object.keys(stats.compilation.assets).find((assetName) =>
      /\.css$/.test(assetName)
    );

    const extractedCSS = readAsset(chunkName, compiler, stats);

    expect(chunkName).toBe("main.166835fe802ce402ea56.css");

    expect(
      extractedCSS.replace(
        /=(.+?)\..+?\.css\.map/,
        "=$1.xxxxxxxxxxxxxxxxxxxx.css.map"
      )
    ).toMatchSnapshot("extracted css");

    const sourceMap = JSON.parse(
      readAsset(`${chunkName}.map`, compiler, stats)
    );

    sourceMap.file = sourceMap.file.replace(
      /^(.+?)\..+?\.css$/,
      "$1.xxxxxxxxxxxxxxxxxxxx.css"
    );
    sourceMap.sources = sourceMap.sources.map((source) =>
      source.replace("css-loader", "")
    );

    expect(sourceMap).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should not generate source maps when 'false' value is used", async () => {
    const compiler = getCompiler("./source-map/basic.js", {
      sourceMap: false,
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should not generate source maps when previous loader does not generate source maps", async () => {
    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: false },
                },
                {
                  loader: path.resolve(
                    __dirname,
                    "./fixtures/source-map-loader.js"
                  ),
                  options: {
                    // eslint-disable-next-line no-undefined
                    sourceMap: undefined,
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should not generate source maps when previous loader generates source maps", async () => {
    const compiler = getCompiler(
      "./source-map/basic.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: false },
                },
                {
                  loader: path.resolve(
                    __dirname,
                    "./fixtures/source-map-loader.js"
                  ),
                  options: {
                    sourceMap: JSON.stringify({
                      foo: "bar",
                      version: 3,
                      sources: ["basic.css"],
                      names: [],
                      mappings: "AAAA;EACE,UAAU;AACZ",
                      file: "basic.css",
                      sourcesContent: [".class {\n  color: red;\n}\n"],
                    }),
                  },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./source-map/basic.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should generate source maps when css was extracted", async () => {
    const compiler = getCompiler(
      "./source-map/extract.js",
      {},
      {
        output: {
          path: path.resolve(__dirname, "../outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
        },
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].css",
          }),
        ],
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { sourceMap: false },
                },
              ],
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(readAsset("main.css", compiler, stats)).toMatchSnapshot(
      "extracted css"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
