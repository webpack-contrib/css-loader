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

  it("should work and export CSSStyleSheet for import asserions and basic output", async () => {
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
});
