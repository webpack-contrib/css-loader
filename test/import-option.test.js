import fs from "fs";
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

describe('"import" option', () => {
  it("should work when not specified", async () => {
    const compiler = getCompiler("./import/import.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./import/import.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work when not specified and print correct output", async () => {
    const compiler = getCompiler("./import/import-stringified.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./import/import.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a value equal to "true"', async () => {
    const compiler = getCompiler("./import/import.js", { import: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./import/import.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a value equal to "false"', async () => {
    const compiler = getCompiler("./import/import.js", { import: false });
    const stats = await compile(compiler);

    expect(getModuleSource("./import/import.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with circular `@import`", async () => {
    const compiler = getCompiler("./import/circular.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./import/circular.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with import.filter", async () => {
    const compiler = getCompiler("./import/import.js", {
      import: {
        filter: (url, media, resourcePath, supports, layer) => {
          expect(url).toBeDefined();

          if (url === "test-nested-media.css") {
            expect(media).toBeDefined();
          }

          if (url === "./import-with-layer-and-supports-and-media.css") {
            expect(supports).toBeDefined();
            expect(layer).toBeDefined();
          }

          expect(resourcePath).toBeDefined();

          // Don't handle `test.css`
          if (url.includes("test.css")) {
            return false;
          }

          return true;
        },
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./import/import.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should keep original order", async () => {
    const compiler = getCompiler("./import/order.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./import/order.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should respect style field in package.json", async () => {
    const compiler = getCompiler("./import/issue-683.js");
    const stats = await compile(compiler);

    expect(getModuleSource("test.css", stats)).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should respect conditionNames", async () => {
    const compiler = getCompiler("./import/import-conditionNames.js");
    const stats = await compile(compiler);

    expect(getModuleSource("import-conditionNames.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should resolve server-relative url relative rootContext", async () => {
    const compiler = getCompiler("./import/import-server-relative-url.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./import/import-server-relative-url.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work resolve order: local -> node_modules -> alias", async () => {
    const compiler = getCompiler("./import/import-order.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./import/import-order.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should resolve absolute path", async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, "fixtures", "import");
    const file = path.resolve(fileDirectory, "import-absolute.css");
    const absolutePath = path.resolve(fileDirectory, "test.css");

    fs.writeFileSync(file, `@import "${absolutePath}";`);

    const compiler = getCompiler("./import/import-absolute.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./import/import-absolute.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should resolve "file" protocol', async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(__dirname, "fixtures", "import");
    const file = path.resolve(fileDirectory, "import-file-protocol.css");
    const absolutePath = path
      .resolve(fileDirectory, "test.css")
      .replace(/\\/g, "/");

    fs.writeFileSync(file, `@import "file://${absolutePath}";`);

    const compiler = getCompiler("./import/import-file-protocol.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./import/import-file-protocol.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'false' aliases", async () => {
    const compiler = getCompiler(
      "./import/false-alias.js",
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
        resolve: {
          alias: {
            "/style.css": false,
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./import/false-alias.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'resolve.extensions'", async () => {
    const compiler = getCompiler(
      "./import/extensions.js",
      {},
      {
        resolve: {
          extensions: [".mycss", "..."],
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./import/extensions.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'resolve.byDependency.css.extensions'", async () => {
    const compiler = getCompiler(
      "./import/extensions.js",
      {},
      {
        resolve: {
          byDependency: {
            css: {
              extensions: [".mycss", "..."],
            },
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./import/extensions.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw an error on unresolved import", async () => {
    const compiler = getCompiler("./import/unresolved.js");
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it("should work when 'import.loaders' not specified", async () => {
    const compiler = getCompiler(
      "./nested-import/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              rules: [
                { loader: path.resolve(__dirname, "../src") },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
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
      getModuleSource("./nested-import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a "import.loaders" value equal to "0" (`postcss-loader` before)', async () => {
    const compiler = getCompiler(
      "./nested-import/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { importLoaders: 0 },
                },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
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
      getModuleSource("./nested-import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a "import.loaders" value equal to "1" (no loaders before)', async () => {
    const compiler = getCompiler("./nested-import/source.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./nested-import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a "import.loaders" value equal to "1" ("postcss-loader" before)', async () => {
    const compiler = getCompiler(
      "./nested-import/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { importLoaders: 1 },
                },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
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
      getModuleSource("./nested-import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a "import.loaders" value equal to "2" ("postcss-loader" before)', async () => {
    const compiler = getCompiler(
      "./nested-import/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { importLoaders: 2 },
                },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
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
      getModuleSource("./nested-import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a "import.loaders" value equal to ""1"" ("postcss-loader" before)', async () => {
    const compiler = getCompiler(
      "./nested-import/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: { importLoaders: "1" },
                },
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [postcssPresetEnv({ stage: 0 })],
                    },
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
      getModuleSource("./nested-import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with data URI", async () => {
    const compiler = getCompiler("./import/data-uri.js");
    const stats = await compile(compiler);

    expect(getModuleSource("./import/data-uri.css", stats)).toMatchSnapshot(
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
      "./import/absolute-url.js",
      {},
      {
        experiments: {
          buildHttp: {
            allowedUris: [() => true],
            lockfileLocation: path.resolve(
              __dirname,
              "./lock-files/import/lock.json"
            ),
            cacheLocation: path.resolve(__dirname, "./lock-files/import"),
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(getModuleSource("./import/absolute-url.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
