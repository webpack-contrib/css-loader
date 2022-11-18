import path from "path";
import fs from "fs";

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

const testCasesPath = path.join(__dirname, "fixtures/modules/tests-cases");
const testCases = fs.readdirSync(testCasesPath);

jest.setTimeout(60000);

describe('"modules" option', () => {
  [
    true,
    false,
    "local",
    "global",
    { mode: "local" },
    { mode: "global" },
  ].forEach((modulesValue) => {
    testCases.forEach((name) => {
      it(`should work with case \`${name}\` (\`modules\` value is \`${
        modulesValue.mode
          ? `object with mode ${modulesValue.mode}`
          : modulesValue
      })\``, async () => {
        const pathToTest = `./modules/tests-cases/${name}/source.js`;
        const moduleId = `./modules/tests-cases/${name}/source.css`;
        const compiler = getCompiler(pathToTest, {
          modules: modulesValue.mode
            ? { mode: modulesValue.mode, localIdentName: "_[local]" }
            : modulesValue,
        });
        const stats = await compile(compiler);

        expect(getModuleSource(moduleId, stats)).toMatchSnapshot("module");
        expect(
          getExecutedCode("main.bundle.js", compiler, stats)
        ).toMatchSnapshot("result");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");
      });
    });
  });

  it('should work and support "pure" mode', async () => {
    const compiler = getCompiler("./modules/pure/pure.js", { modules: "pure" });
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/pure/pure.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and support "pure" mode #2', async () => {
    const compiler = getCompiler("./modules/pure/pure.js", {
      modules: { mode: "pure" },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/pure/pure.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "[local]" placeholder for the "localIdentName" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: { localIdentName: "[local]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localIdentName" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[name]--[local]--[hash:base64:5]",
        localIdentContext: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localIdentName" option 2', async () => {
    const compiler = getCompiler(
      "./modules/localIdentName/localIdentName.js",
      {
        modules: {
          localIdentName: "[name]--[local]--[contenthash]",
          localIdentContext: path.resolve(__dirname),
        },
      },
      {
        output: {
          path: path.resolve(__dirname, "./outputs"),
          filename: "[name].bundle.js",
          chunkFilename: "[name].chunk.js",
          publicPath: "/webpack/public/path/",
          assetModuleFilename: "[name][ext]",
          hashDigestLength: 5,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "context" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[hash:base64:8]",
        localIdentContext: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "path" placeholder', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[path][name]__[local]",
        localIdentContext: path.resolve(__dirname),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "hashSalt" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]--[hash]",
        localIdentHashSalt: "x",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localIdentHashFunction" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]--[hash]",
        localIdentHashFunction: "sha256",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "localIdentHashFunction" xxhash64', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]--[hash]",
        localIdentHashFunction: "xxhash64",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localIdentHashFunction" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]--[hash]",
        localIdentHashDigest: "base64",
        localIdentHashDigestLength: 10,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work and prefix leading hyphen when digit is first", async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: { localIdentName: "-1[local]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should should work with two leading hyphens", async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: { localIdentName: "--[local]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should should work with two leading underscore", async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: { localIdentName: "__[local]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work and correctly replace escaped symbols", async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: { localIdentName: "[local]--[hash:base64:4]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "getLocalIdent" option', async () => {
    expect.assertions(389);

    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentRegExp: "regExp",
        localIdentContext: "context",
        localIdentHashSalt: "hash",
        getLocalIdent(loaderContext, localIdentName, localName, options) {
          expect(loaderContext).toBeDefined();
          expect(typeof localIdentName).toBe("string");
          expect(typeof localName).toBe("string");
          expect(options).toBeDefined();

          expect(options.regExp).toBe("regExp");
          expect(options.context).toBe("context");
          expect(options.hashSalt).toBe("hash");

          return "foo";
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localIdentRegExp" option', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[1]__[local]__[hash:base64:8]",
        localIdentRegExp: /[/\\]([^/\\]+?)(?:\.module)?\.[^./\\]+$/,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "hashStrategy" = "resource-path-and-local-name"', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]__[hash:base64:8]",
        // localName should be used even if [local] is contained in the localIdentName template
        hashStrategy: "resource-path-and-local-name",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "hashStrategy" = "minimal-subset" and [local]', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]__[hash:base64:8]",
        // localName should not be used: [local] is used
        hashStrategy: "minimal-subset",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "hashStrategy" = "minimal-subset" and no [local]', async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[hash:base64:8]",
        // localName should be used: [local] is not used
        hashStrategy: "minimal-subset",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and has "undefined" context if no context was given', async () => {
    expect.assertions(59);

    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        getLocalIdent(loaderContext, localIdentName, localName, options) {
          expect(options.context).toBeDefined();

          return "foo";
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should support resolving in composes", async () => {
    const compiler = getCompiler("./modules/composes/composes.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should resolve absolute path in composes", async () => {
    // Create the file with absolute path
    const fileDirectory = path.resolve(
      __dirname,
      "fixtures",
      "modules",
      "composes"
    );
    const file = path.resolve(fileDirectory, "composes-absolute.css");
    const absolutePath = path.resolve(fileDirectory, "imported-simple.css");

    fs.writeFileSync(
      file,
      `.simple { color: red; composes: imported-simple from '${absolutePath}'; }`
    );

    const compiler = getCompiler("./modules/composes/composes-absolute.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes-absolute.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should support resolving in composes preprocessor files with extensions", async () => {
    const compiler = getCompiler(
      "./modules/composes/composes-preprocessors.js",
      {
        modules: {
          mode: "local",
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes-preprocessors.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #286", async () => {
    const compiler = getCompiler(
      "./modules/issue-286/source.js",
      {},
      {
        module: {
          rules: [
            {
              test: /source\.css$/,
              loader: path.resolve(__dirname, "../src"),
              options: {
                importLoaders: false,
                modules: {
                  localIdentName: "b--[local]",
                },
              },
            },
            {
              test: /dep\.css$/,
              loader: path.resolve(__dirname, "../src"),
              options: {
                importLoaders: false,
                modules: {
                  localIdentName: "a--[local]",
                },
              },
            },
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-286/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #636", async () => {
    const compiler = getCompiler(
      "./modules/issue-636/source.js",
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
                    modules: {
                      localIdentName: "[local]",
                      getLocalIdent: (context, localIdentName, localName) =>
                        `prefix-${localName}`,
                    },
                    importLoaders: 1,
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

    expect(
      getModuleSource("./modules/issue-636/source.scss", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #861", async () => {
    const compiler = getCompiler(
      "./modules/issue-861/resolving-from-node_modules.js",
      {
        modules: true,
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource(
        "./modules/issue-861/resolving-from-node_modules.css",
        stats
      )
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #966", async () => {
    const compiler = getCompiler("./modules/issue-966/button.js", {
      modules: {
        getLocalIdent: (ctx, localIdentName, localName) => `${localName}.hey`,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-966/button.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #966 - values in selectors aren't escaped properly", async () => {
    const compiler = getCompiler("./modules/issue-966/issue-966.js", {
      modules: {
        getLocalIdent: (loaderContext, localIdentName, localName) => {
          if (localName === "foo-class") {
            return `7-${localName}`;
          }

          if (localName === "bar-class") {
            return `>-${localName}`;
          }

          if (localName === "baz-class") {
            return `\u0000-${localName}`;
          }

          if (localName === "fooBaz-class") {
            return `${localName}.continuation`;
          }

          return null;
        },
        localIdentName: "[local]",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-966/issue-966.css", stats)
    ).toMatchSnapshot("module");

    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #967", async () => {
    const compiler = getCompiler("./modules/issue-967/path-placeholder.js", {
      modules: {
        mode: "local",
        localIdentName:
          '[path][name]__[local]__/-sep-?-sep-<-sep->-sep-\\\\-sep-:-sep-*-sep-|-sep-"-sep-:',
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-967/path-placeholder.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #980", async () => {
    const compiler = getCompiler(
      "./modules/issue-980/file.with.many.dots.in.name.js",
      {
        modules: {
          localIdentName: "[name]_[local]_[hash:base64:5]",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource(
        "./modules/issue-980/file.with.many.dots.in.name.css",
        stats
      )
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #995", async () => {
    const compiler = getCompiler("./modules/issue-995/issue-995.js", {
      modules: {
        mode: "global",
        localIdentName: "😀",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-995/issue-995.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #995 #2", async () => {
    const compiler = getCompiler("./modules/issue-995/issue-995.js", {
      modules: {
        mode: "global",
        localIdentName: " ",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-995/issue-995.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should avoid unnecessary "require"', async () => {
    const compiler = getCompiler("./modules/composes/composes-duplicate.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes-duplicate.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should keep order", async () => {
    const compiler = getCompiler("./modules/order/index.js", { modules: true });
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/order/index.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should dedupe same modules in one module (issue #1037)", async () => {
    const compiler = getCompiler("./modules/dedupe/source.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/dedupe/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #1063", async () => {
    const compiler = getCompiler("./modules/issue-1063/issue-1063.js", {
      modules: {
        mode: (resourcePath) => {
          if (/pure.css$/i.test(resourcePath)) {
            return "pure";
          }

          if (/global.css$/i.test(resourcePath)) {
            return "global";
          }

          return "local";
        },
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1063/local.css", stats)
    ).toMatchSnapshot("module with the `local` mode");
    expect(
      getModuleSource("./modules/issue-1063/global.css", stats)
    ).toMatchSnapshot("module with the `global` mode");
    expect(
      getModuleSource("./modules/issue-1063/pure.css", stats)
    ).toMatchSnapshot("module with the `pure` mode");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #1063 throw error", async () => {
    const compiler = getCompiler("./modules/issue-1063/issue-1063.js", {
      modules: {
        mode: () => "not local, global or pure",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1063/local.css", stats)
    ).toMatchSnapshot("module");
    expect(
      getModuleSource("./modules/issue-1063/global.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("issue #1191 - fallback to default getLocalIdent", async () => {
    const compiler = getCompiler("./modules/issue-1191/issue-1191.js", {
      modules: {
        getLocalIdent: (ctx, localIdentName, localName) =>
          ctx.resourcePath.includes("custom") ? `custom-${localName}` : null,
        localIdentName: "[local]",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1191/issue-1191.css", stats)
    ).toMatchSnapshot("module");

    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the `exportGlobals` option (the `mode` option is `global`)", async () => {
    const compiler = getCompiler(
      "./modules/exportGlobals-global/exportGlobals.js",
      {
        modules: {
          mode: "local",
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/exportGlobals-global/exportGlobals.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the `exportGlobals` option (the `mode` option is `local`)", async () => {
    const compiler = getCompiler(
      "./modules/exportGlobals-local/exportGlobals.js",
      {
        modules: {
          mode: "global",
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/exportGlobals-local/exportGlobals.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the `exportGlobals` option (the `mode` option is `pure`)", async () => {
    const compiler = getCompiler(
      "./modules/exportGlobals-pure/exportGlobals.js",
      {
        modules: {
          mode: "pure",
          exportGlobals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/exportGlobals-pure/exportGlobals.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" by default', async () => {
    const compiler = getCompiler("./modules/mode/modules.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" by default when CSS file is entrypoint', async () => {
    const compiler = getCompiler([
      "./modules/mode/entry.css",
      "./modules/mode/modules.js",
    ]);
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/mode/entry.css", stats)).toMatchSnapshot(
      "entry"
    );
    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" by default with "modules" filename', async () => {
    const compiler = getCompiler("./modules/mode/modules-2.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.modules.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" by default for icss', async () => {
    const compiler = getCompiler("./modules/mode/icss/icss.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/icss/relative.icss.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" option in the "modules" option for icss', async () => {
    const compiler = getCompiler("./modules/mode/icss/icss.js", {
      modules: {
        auto: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/icss/relative.icss.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with the 'auto' and extract CSS using mini-css-extract-plugin", async () => {
    const compiler = getCompiler(
      "./modules/mode/modules.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                },
              ],
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
    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "false" aliases', async () => {
    const compiler = getCompiler(
      "./modules/icss-false-alias/icss.js",
      {},
      {
        resolve: {
          alias: {
            "./unknown.css": false,
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/icss-false-alias/relative.icss.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work when the "auto" is not specified', async () => {
    const compiler = getCompiler("./modules/mode/not-specified.js");
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/style.modules.css", stats)
    ).toMatchSnapshot("modules-module");
    expect(
      getModuleSource("./modules/mode/no-modules.css", stats)
    ).toMatchSnapshot("not-modules-module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work when the "auto" is not specified, but specified other modules options', async () => {
    const compiler = getCompiler("./modules/mode/not-specified.js", {
      modules: {
        localIdentName: "[path][name]__[local]",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/style.modules.css", stats)
    ).toMatchSnapshot("modules-module");
    expect(
      getModuleSource("./modules/mode/no-modules.css", stats)
    ).toMatchSnapshot("not-modules-module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work when the 'auto' is not specified with inline module syntax", async () => {
    const compiler = getCompiler("./index-loader-syntax-left-and-right.js", {});
    const stats = await compile(compiler);

    expect(
      getModuleSource("./index-loader-syntax.modules.css", stats)
    ).toMatchSnapshot("module 1");
    expect(getModuleSource("./simple.css", stats)).toMatchSnapshot("module 2");
    expect(getModuleSource("./simple-1.css", stats)).toMatchSnapshot(
      "module 3"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" option is "false"', async () => {
    const compiler = getCompiler("./modules/mode/modules.js", {
      modules: {
        auto: false,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "auto" option is "true"', async () => {
    const compiler = getCompiler("./modules/mode/modules.js", {
      modules: {
        auto: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work when the "auto" option is "true" with other options', async () => {
    const compiler = getCompiler("./modules/mode/not-specified.js", {
      modules: {
        auto: true,
        localIdentName: "[path][name]__[local]",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/style.modules.css", stats)
    ).toMatchSnapshot("modules-module");
    expect(
      getModuleSource("./modules/mode/no-modules.css", stats)
    ).toMatchSnapshot("not-modules-module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a modules.auto RegExp that returns "true"', async () => {
    const compiler = getCompiler("./modules/mode/modules.js", {
      modules: {
        auto: /relative\.module\.css$/,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a modules.auto RegExp that returns "false"', async () => {
    const compiler = getCompiler("./modules/mode/modules.js", {
      modules: {
        auto: /will no pass/,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a modules.auto Function that returns "true"', async () => {
    const compiler = getCompiler("./modules/mode/modules.js", {
      modules: {
        auto: (relativePath) => relativePath.endsWith("module.css"),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with a modules.auto Function that returns "false"', async () => {
    const compiler = getCompiler("./modules/mode/modules.js", {
      modules: {
        auto: (relativePath) => relativePath.endsWith("will no pass"),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/mode/relative.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should resolve package from node_modules with and without tilde", async () => {
    const compiler = getCompiler("./modules/issue-914/source.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-914/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should throw an error on unresolved import", async () => {
    const compiler = getCompiler("./modules/unresolved/source.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localConvention" option with the "asIs" value', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: "asIs",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "exportLocalsConvention" option with the "function" type and returns array names', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: (localName) => [
            `${localName.replace(/-/g, "_")}_TEST_1`,
            `${localName.replace(/-/g, "_")}_TEST_1`,
            `${localName.replace(/-/g, "_")}_TEST_3`,
          ],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localConvention" option with the "camelCase" value', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: "camelCase",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localConvention" option with the "camelCaseOnly" value', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: "camelCaseOnly",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localConvention" option with the "dashes" value', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: "dashes",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "localConvention" option with the "dashesOnly" value', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: "dashesOnly",
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "exportLocalsConvention" option with the "function" type', async () => {
    const compiler = getCompiler(
      "./modules/localsConvention/localsConvention.js",
      {
        modules: {
          mode: "local",
          exportLocalsConvention: (localName) =>
            `${localName.replace(/-/g, "_")}_TEST`,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localsConvention/localsConvention.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and respect the "exportOnlyLocals" option', async () => {
    const compiler = getCompiler("./modules/composes/composes.js", {
      modules: {
        mode: "local",
        localIdentName: "_[local]",
        exportOnlyLocals: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "exportOnlyLocals" and "esModule" with "true" value options', async () => {
    const compiler = getCompiler("./modules/composes/composes.js", {
      modules: {
        mode: "local",
        localIdentName: "_[local]",
        exportOnlyLocals: true,
      },
      esModule: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "exportOnlyLocals" and "esModule" with "false" value options', async () => {
    const compiler = getCompiler("./modules/composes/composes.js", {
      modules: {
        mode: "local",
        localIdentName: "_[local]",
        exportOnlyLocals: true,
      },
      esModule: false,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with an empty object value", async () => {
    const compiler = getCompiler("./modules/pure/pure.js", { modules: {} });
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/pure/pure.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "namedExport" option', async () => {
    const compiler = getCompiler("./modules/namedExport/base/index.js", {
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/base/index.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work when the "exportLocalsConvention" option is function', async () => {
    const compiler = getCompiler("./modules/namedExport/base/index.js", {
      modules: {
        namedExport: true,
        exportLocalsConvention: (localName) =>
          `${localName.replace(/-/g, "_")}_TEST`,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/base/index.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "namedExport" option with nested import', async () => {
    const compiler = getCompiler("./modules/namedExport/nested/index.js", {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/nested/index.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work js template with "namedExport" option', async () => {
    const compiler = getCompiler("./modules/namedExport/template/index.js", {
      esModule: true,
      modules: {
        localIdentName: "[local]",
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/template/index.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work js template with "namedExport" option when "exportLocalsConvention" option is function', async () => {
    const compiler = getCompiler("./modules/namedExport/template-2/index.js", {
      esModule: true,
      modules: {
        localIdentName: "[local]",
        namedExport: true,
        exportLocalsConvention: (localName) =>
          `${localName.replace(/-/g, "_")}_TEST`,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/template-2/index.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work when the "namedExport" is enabled and the "exportLocalsConvention" options has "dashesOnly" value', async () => {
    const compiler = getCompiler("./modules/namedExport/dashesOnly/index.js", {
      modules: {
        localIdentName: "[local]",
        namedExport: true,
        exportLocalsConvention: "dashesOnly",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/dashesOnly/index.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it('should work with composes when the "namedExport" is enabled and "exportLocalsConvention" options has "dashesOnly" value', async () => {
    const compiler = getCompiler("./modules/namedExport/composes/composes.js", {
      modules: {
        localIdentName: "_[local]",
        namedExport: true,
        exportLocalsConvention: "dashesOnly",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with composes when the "exportLocalsConvention" is function and return array names', async () => {
    const compiler = getCompiler("./modules/namedExport/composes/composes.js", {
      modules: {
        namedExport: true,
        exportLocalsConvention: (localName) => [
          `${localName.replace(/-/g, "_")}_TEST_1`,
          `${localName.replace(/-/g, "_")}_TEST_1`,
          `${localName.replace(/-/g, "_")}_TEST_3`,
        ],
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with composes when the "exportLocalsConvention" is function', async () => {
    const compiler = getCompiler("./modules/namedExport/composes/composes.js", {
      modules: {
        localIdentName: "_[local]",
        namedExport: true,
        exportLocalsConvention: (localName) =>
          `${localName.replace(/-/g, "_")}_TEST`,
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/namedExport/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should throw error when the "exportLocalsConvention" function throw error', async () => {
    const compiler = getCompiler("./modules/namedExport/composes/composes.js", {
      modules: {
        namedExport: true,
        exportLocalsConvention: () => {
          throw new Error("namedExportFn error");
        },
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it('should throw error with composes when the "namedExport" is enabled and "exportLocalsConvention" options has invalid value', async () => {
    const compiler = getCompiler("./modules/namedExport/composes/composes.js", {
      modules: {
        localIdentName: "_[local]",
        namedExport: true,
        exportLocalsConvention: "dashes",
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it('should throw an error when the "namedExport" option is "true", but the "esModule" is "false"', async () => {
    const compiler = getCompiler("./modules/namedExport/base/index.js", {
      esModule: false,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it('should throw an error when the "namedExport" is enabled and the "exportLocalsConvention" options has not "camelCaseOnly" value', async () => {
    const compiler = getCompiler("./modules/namedExport/broken/index.js", {
      esModule: true,
      modules: {
        namedExport: true,
        exportLocalsConvention: "dashes",
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it("should throw an error when class has unsupported name (JavaScript reserved words)", async () => {
    const compiler = getCompiler("./modules/namedExport/broken/index.js", {
      esModule: true,
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats, true)).toMatchSnapshot("errors");
  });

  it('should work with "exportOnlyLocals" and "namedExport" option', async () => {
    const compiler = getCompiler("./modules/composes/composes-named.js", {
      modules: {
        mode: "local",
        localIdentName: "_[local]",
        namedExport: true,
        exportOnlyLocals: true,
      },
      esModule: true,
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "url" and "namedExport"', async () => {
    const compiler = getCompiler("./modules/url/source.js", {
      modules: {
        namedExport: true,
      },
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/url/source.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with "url"', async () => {
    const compiler = getCompiler("./modules/url/source.js", {
      modules: true,
    });
    const stats = await compile(compiler);

    expect(getModuleSource("./modules/url/source.css", stats)).toMatchSnapshot(
      "module"
    );
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  const icssTestCasesPath = path.join(
    __dirname,
    "fixtures/modules/icss/tests-cases"
  );
  const icssTestCases = fs.readdirSync(icssTestCasesPath);

  icssTestCases.forEach((name) => {
    it(`show work when the "modules" option is "icss", case "${name}"`, async () => {
      const compiler = getCompiler(
        `./modules/icss/tests-cases/${name}/source.js`,
        {
          modules: "icss",
        }
      );
      const stats = await compile(compiler);

      expect(
        getModuleSource(`./modules/icss/tests-cases/${name}/source.css`, stats)
      ).toMatchSnapshot("module");
      expect(
        getExecutedCode("main.bundle.js", compiler, stats)
      ).toMatchSnapshot("result");
      expect(getWarnings(stats)).toMatchSnapshot("warnings");
      expect(getErrors(stats)).toMatchSnapshot("errors");
    });

    it(`show work with the "mode: icss" option, case "${name}"`, async () => {
      const compiler = getCompiler(
        `./modules/icss/tests-cases/${name}/source.js`,
        {
          modules: {
            mode: "icss",
          },
        }
      );
      const stats = await compile(compiler);

      expect(
        getModuleSource(`./modules/icss/tests-cases/${name}/source.css`, stats)
      ).toMatchSnapshot("module");
      expect(
        getExecutedCode("main.bundle.js", compiler, stats)
      ).toMatchSnapshot("result");
      expect(getWarnings(stats)).toMatchSnapshot("warnings");
      expect(getErrors(stats)).toMatchSnapshot("errors");
    });

    it(`show work when the "mode" option is function and return "icss" value, case "${name}"`, async () => {
      const compiler = getCompiler(
        `./modules/icss/tests-cases/${name}/source.js`,
        {
          modules: {
            mode: () => "icss",
          },
        }
      );
      const stats = await compile(compiler);

      expect(
        getModuleSource(`./modules/icss/tests-cases/${name}/source.css`, stats)
      ).toMatchSnapshot("module");
      expect(
        getExecutedCode("main.bundle.js", compiler, stats)
      ).toMatchSnapshot("result");
      expect(getWarnings(stats)).toMatchSnapshot("warnings");
      expect(getErrors(stats)).toMatchSnapshot("errors");
    });
  });

  it('show work with the "mode: icss" and "exportOnlyLocals" options', async () => {
    const compiler = getCompiler(
      "./modules/icss/tests-cases/import/source.js",
      {
        modules: {
          mode: "icss",
          exportOnlyLocals: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/icss/tests-cases/import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('show work with the "mode: icss" and "namedExport" options', async () => {
    const compiler = getCompiler(
      "./modules/icss/tests-cases/import/source.js",
      {
        modules: {
          mode: "icss",
          namedExport: true,
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/icss/tests-cases/import/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('show work with the "mode" option using the "local" value', async () => {
    const compiler = getCompiler("./modules/composes/composes.js", {
      modules: {
        mode: "local",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/composes/composes.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should emit warning when localIdentName is emoji", async () => {
    const compiler = getCompiler("./modules/pure/pure.js", {
      modules: {
        localIdentName: "[emoji:0]",
      },
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with `@` character in scoped packages", async () => {
    const compiler = getCompiler("./modules/issue-1223/issue-1223.js", {
      modules: {
        localIdentName: "[path]-[local]",
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1223/@foo/bar/index.module.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work with the "animation" ', async () => {
    const compiler = getCompiler("./modules/issue-1228/source.js", {
      modules: { mode: "local" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/issue-1228/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should work and prefer relative for "composes"', async () => {
    const compiler = getCompiler("./modules/prefer-relative/source.js", {
      modules: { mode: "local" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/prefer-relative/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'resolve.extensions'", async () => {
    const compiler = getCompiler(
      "./modules/extensions/source.js",
      {
        modules: { mode: "local" },
      },
      {
        resolve: {
          extensions: [".css", "..."],
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/extensions/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with 'resolve.byDependency.css.extensions'", async () => {
    const compiler = getCompiler(
      "./modules/extensions/source.js",
      {
        modules: { mode: "local" },
      },
      {
        resolve: {
          byDependency: {
            icss: {
              extensions: [".css", "..."],
            },
          },
        },
      }
    );
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/extensions/source.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with [folder]", async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: { localIdentName: "[local]-[folder]-[name]" },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with [folder] #2", async () => {
    const compiler = getCompiler("./modules/localIdentName/localIdentName.js", {
      modules: {
        localIdentName: "[local]-[folder][name]",
        localIdentContext: path.resolve(
          __dirname,
          "fixtures",
          "modules",
          "localIdentName"
        ),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/localIdentName/localIdentName.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with [folder] #3", async () => {
    const compiler = getCompiler("./modules/ComponentName/index.js", {
      modules: {
        localIdentName: "[folder]-[local]",
        localIdentContext: path.resolve(__dirname, "fixtures", "modules"),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/ComponentName/index.modules.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work with [folder] #4", async () => {
    const compiler = getCompiler("./modules/ComponentName/index.js", {
      modules: {
        localIdentName: "[FOLDER]-[LOCAL]",
        localIdentContext: path.resolve(__dirname, "fixtures", "modules"),
      },
    });
    const stats = await compile(compiler);

    expect(
      getModuleSource("./modules/ComponentName/index.modules.css", stats)
    ).toMatchSnapshot("module");
    expect(getExecutedCode("main.bundle.js", compiler, stats)).toMatchSnapshot(
      "result"
    );
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work and generate the same classes for client and server", async () => {
    const clientCompiler = getCompiler(
      "./modules/localIdentName/localIdentName.js",
      {},
      {
        module: {
          rules: [
            {
              test: /\.css$/i,
              use: [
                {
                  loader: MiniCssExtractPlugin.loader,
                },
                {
                  loader: path.resolve(__dirname, "../src"),
                  options: {
                    modules: true,
                  },
                },
              ],
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
    const clientStats = await compile(clientCompiler);

    expect(
      getModuleSource(
        "./modules/localIdentName/localIdentName.css",
        clientStats
      )
    ).toMatchSnapshot("client module");
    expect(
      getExecutedCode("main.bundle.js", clientCompiler, clientStats)
    ).toMatchSnapshot("client result");
    expect(getWarnings(clientStats)).toMatchSnapshot("client warnings");
    expect(getErrors(clientStats)).toMatchSnapshot("client errors");

    const serverCompiler = getCompiler(
      "./modules/localIdentName/localIdentName.js",
      {
        modules: {
          exportOnlyLocals: true,
        },
      }
    );
    const serverStats = await compile(serverCompiler);

    expect(
      getModuleSource(
        "./modules/localIdentName/localIdentName.css",
        serverStats
      )
    ).toMatchSnapshot("server module");
    expect(
      getExecutedCode("main.bundle.js", serverCompiler, serverStats)
    ).toMatchSnapshot("server result");
    expect(getWarnings(serverStats)).toMatchSnapshot("server warnings");
    expect(getErrors(serverStats)).toMatchSnapshot("server errors");
  });
});
