import fs from "fs";
import path from "path";

import webpack from "webpack";

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

describe('"url" option', () => {
  it("should work when not specified", async () => {
    const compiler = getCompiler("./url/url.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a value equal to "true"', async () => {
    const compiler = getCompiler("./url/url.js", { url: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a value equal to "false"', async () => {
    const compiler = getCompiler("./url/url.js", { url: false });
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'false' value of the 'esModule' option", async () => {
    const compiler = getCompiler(
      "./url/url.js",
      {
        esModule: false,
      },
      {
        resolve: {
          alias: {
            aliasesImg: path.resolve(__dirname, "./fixtures/url"),
            "/img.png": path.resolve(__dirname, "./fixtures/url/img.png"),
            "~img.png": path.resolve(__dirname, "./fixtures/url/img.png"),
            "/guide/img/banWord/addCoinDialogTitleBg.png": path.resolve(
              __dirname,
              "./fixtures/url/img.png"
            ),
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with url.filter", async () => {
    const compiler = getCompiler("./url/url.js", {
      url: {
        filter: (url, resourcePath) => {
          expect(typeof resourcePath === "string").toBe(true);

          if (url.startsWith("/guide/img")) {
            return false;
          }

          // Don't handle `img.png`
          if (url.includes("img.png")) {
            return false;
          }

          return true;
        },
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should resolve absolute path", async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, "fixtures", "url");
    const file = path.resolve(fileDirectory, "url-absolute.css");
    const absolutePath = path.resolve(fileDirectory, "img.png");
    const code = `
.background {
  background: url(${absolutePath});
}

.background-other {
  background: url(${absolutePath.replace(/e/g, "%65")});
}

.background-other {
  background: url('${absolutePath.replace(/e/g, "\\\ne")}');
}
`;

    fs.writeFileSync(file, code);

    const compiler = getCompiler("./url/url-absolute.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./url/url-absolute.css", stats).replace(
        new RegExp(absolutePath.replace(/\\/g, "\\\\\\\\")),
        "<absolute-path>"
      )
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should resolve absolute path when the 'esModules' is 'false'", async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, "fixtures", "url");
    const file = path.resolve(fileDirectory, "url-absolute.css");
    const absolutePath = path.resolve(fileDirectory, "img.png");
    const code = `
.background {
  background: url(${absolutePath});
}

.background-other {
  background: url(${absolutePath.replace(/e/g, "%65")});
}

.background-other {
  background: url('${absolutePath.replace(/e/g, "\\\ne")}');
}
`;

    fs.writeFileSync(file, code);

    const compiler = getCompiler("./url/url-absolute.js", {
      esModule: false,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./url/url-absolute.css", stats).replace(
        absolutePath,
        "<absolute-path>"
      )
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should resolve "file" protocol path', async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, "fixtures", "url");
    const file = path.resolve(fileDirectory, "url-file-protocol.css");
    const absolutePath = path
      .resolve(fileDirectory, "img.png")
      .replace(/\\/g, "/");
    const code = `
.background {
  background: url(file://${absolutePath});
}

.background-other {
  background: url(file://${absolutePath.replace(/e/g, "%65")});
}

.background-other {
  background: url('file://${absolutePath.replace(/e/g, "\\\ne")}');
}
`;

    fs.writeFileSync(file, code);

    const compiler = getCompiler("./url/url-file-protocol.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./url/url-file-protocol.css", stats).replace(
        absolutePath,
        "<file-protocol-url>"
      )
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should resolve "file" protocol path when the "esModules" is "false"', async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, "fixtures", "url");
    const file = path.resolve(fileDirectory, "url-file-protocol.css");
    const absolutePath = path
      .resolve(fileDirectory, "img.png")
      .replace(/\\/g, "/");
    const code = `
.background {
  background: url(file://${absolutePath});
}

.background-other {
  background: url(file://${absolutePath.replace(/e/g, "%65")});
}

.background-other {
  background: url('file://${absolutePath.replace(/e/g, "\\\ne")}');
}
`;

    fs.writeFileSync(file, code);

    const compiler = getCompiler("./url/url-file-protocol.js", {
      esModule: false,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./url/url-file-protocol.css", stats).replace(
        absolutePath,
        "<file-protocol-url>"
      )
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the 'asset' type of asset modules", async () => {
    const compiler = getCompiler(
      "./url/url.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {},
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
              type: "asset",
              generator: {
                filename: "[name][ext]",
              },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the 'asset/resource' type of asset modules", async () => {
    const compiler = getCompiler(
      "./url/url.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {},
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
              type: "asset/resource",
              generator: {
                filename: "[name][ext]",
              },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the 'asset/inline' type of asset modules", async () => {
    const compiler = getCompiler(
      "./url/url.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {},
                },
              ],
            },
            {
              test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
              type: "asset/inline",
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'false' aliases", async () => {
    const compiler = getCompiler(
      "./url/false-alias.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, "../src"),
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
        resolve: {
          alias: {
            "/logo.png": false,
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/false-alias.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'false' aliases when the 'esModule' option is 'false'", async () => {
    const compiler = getCompiler(
      "./url/false-alias.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              loader: path.resolve(__dirname, "../src"),
              options: {
                esModule: false,
              },
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
        resolve: {
          alias: {
            "/logo.png": false,
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/false-alias.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw an error on unresolved import", async () => {
    const compiler = getCompiler("./url/url-unresolved.js");
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it("should work with mini-css-extract-plugin", async () => {
    const compiler = getCompiler(
      "./url/MCEP.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    esModule: true,
                  },
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    esModule: true,
                  },
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
        plugins: [
          new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css",
          }),
        ],
      }
    );
    const stats = await compile(compiler);

    expect(readAsset("main.css", compiler, stats)).toMatchSnapshot("css");
    expect(getModuleSource("./url/url.css", stats)).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with using 'resolve.extensions'", async () => {
    const compiler = getCompiler(
      "./url/resolve-extensions.js",
      {},
      {
        resolve: {
          extensions: [".svg", "..."],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./url/resolve-extensions.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  // TODO bug on webpack side
  it.skip("should work with the 'IgnorePlugin' plugin", async () => {
    const compiler = getCompiler("./url/ignore-plugin.js");

    new webpack.IgnorePlugin({ resourceRegExp: /directory\// }).apply(compiler);
    new webpack.IgnorePlugin({ resourceRegExp: /unknwon\.png/ }).apply(
      compiler
    );
    new webpack.IgnorePlugin({ resourceRegExp: /img\.png/ }).apply(compiler);

    const stats = await compile(compiler);

    expect(getModuleSource("./url/ignore-plugin.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with absolute URLs", async () => {
    const compiler = getCompiler(
      "./url/absolute-url.js",
      {},
      {
        experiments: {
          buildHttp: {
            allowedUris: [() => true],
            lockfileLocation: path.resolve(
              __dirname,
              "./lock-files/url/lock.json"
            ),
            cacheLocation: path.resolve(__dirname, "./lock-files/url"),
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./url/absolute-url.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
