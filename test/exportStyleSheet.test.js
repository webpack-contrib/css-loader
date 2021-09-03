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
});
