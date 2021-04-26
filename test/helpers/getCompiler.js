import path from "path";

import webpack from "webpack";
import { createFsFromVolume, Volume } from "memfs";

export default (fixture, loaderOptions = {}, config = {}) => {
  const fullConfig = {
    mode: "development",
    devtool: config.devtool || false,
    context: path.resolve(__dirname, "../fixtures"),
    entry: path.resolve(__dirname, "../fixtures", fixture),
    output: {
      path: path.resolve(__dirname, "../outputs"),
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      publicPath: "/webpack/public/path/",
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            {
              loader: path.resolve(__dirname, "../../src"),
              options: loaderOptions || {},
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/i,
          loader: "file-loader",
          options: { name: "[name].[ext]" },
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
