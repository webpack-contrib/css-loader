import path from "path";

import webpack from "webpack";
import { createFsFromVolume, Volume } from "memfs";

export default (fixture, loaderOptions = {}, config = {}) => {
  const fullConfig = {
    mode: "development",
    target: "node",
    devtool: config.devtool || false,
    context: path.resolve(__dirname, "../fixtures"),
    entry: Array.isArray(fixture)
      ? fixture
      : path.resolve(__dirname, "../fixtures", fixture),
    output: {
      path: path.resolve(__dirname, "../outputs"),
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      publicPath: "/webpack/public/path/",
      assetModuleFilename: "[name][ext]",
    },
    module: {
      rules: [
        {
          test: /\.(mycss|css)$/i,
          use: [
            {
              loader: path.resolve(__dirname, "../../src"),
              options: loaderOptions || {},
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
    resolve: {
      alias: {
        aliasesPackage: path.resolve(
          __dirname,
          "../fixtures/import/node_modules/package/tilde.css"
        ),
        aliasesImg: path.resolve(__dirname, "../fixtures/url"),
        aliasesImport: path.resolve(__dirname, "../fixtures/import"),
        aliasesComposes: path.resolve(
          __dirname,
          "../fixtures/modules/composes"
        ),
        "/img.png": path.resolve(__dirname, "../fixtures/url/img.png"),
        "/guide/img/banWord/addCoinDialogTitleBg.png": path.resolve(
          __dirname,
          "../fixtures/url/img.png"
        ),
      },
    },
    optimization: {
      minimize: false,
    },
    plugins: [],
    ...config,
  };

  const compiler = webpack(fullConfig);

  if (!config.outputFileSystem) {
    compiler.outputFileSystem = createFsFromVolume(new Volume());
  }

  return compiler;
};
