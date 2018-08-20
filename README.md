<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![chat][chat]][chat-url]
[![size][size]][size-url]

# css-loader

A loader for webpack which transforms CSS files into JS module.

The `css-loader` interprets `@import` and `url()` like `import/require()` and will resolve them.

Good loaders for requiring your assets are the [file-loader](https://github.com/webpack/file-loader)
and the [url-loader](https://github.com/webpack/url-loader) which you should specify 
in your config (see [below](https://github.com/webpack-contrib/css-loader#assets)).

> ⚠️ **CSS Module users should continue using `v1.0.0` in the meantime**

## Requirements

This module requires a minimum of Node v6.9.0 and Webpack v4.0.0.

## Getting Started

To begin, you'll need to install `css-loader`:

```console
$ npm install css-loader --save-dev
```

Then add the loader to your `webpack` config. For example:

**file.js**

```js
import css from 'file.css';
```

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};
```

And run `webpack` via your preferred method.

### `toString`

You can also use the css-loader results directly as string, such as in Angular's component style.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
};
```

or

```js
const css = require('./test.css').toString();

console.log(css); // {String}
```

If there are SourceMaps, they will also be included in the result string.

### `extract-loader`

If, for one reason or another, you need to extract CSS as a
plain string resource (i.e. not wrapped in a JS module) you
might want to check out the [extract-loader](https://github.com/peerigon/extract-loader).
It's useful when you, for instance, need to post process the CSS as a string.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'handlebars-loader', // handlebars loader expects raw resource string
          'extract-loader',
          'css-loader',
        ],
      },
    ],
  },
};
```

## Options

### `url`

Type: `Boolean`
Default: `true`

Enable/disable `url()` resolving.

```js
// in your webpack.config.js
{
  loader: `css-loader`,
  options: {
    url: false
  }
}
```

To be compatible with existing css files some url resolved use this logic:

```
url(image.png) => require('./image.png')
url(~module/image.png) => require('module/image.png')
```

### `import`

Type: `Boolean`
Default: `true`

Enable/disable `@import` resolving.

```js
{
  loader: 'css-loader',
  options: {
    import: false
  }
}
```

### `sourceMap`

Type: `Boolean`
Default: `false`

Enable/Disable source maps.

They are not enabled by default because they expose a runtime overhead and increase in bundle size (JS source maps do not).
In addition to that relative paths are buggy and you need to use an absolute public path which include the server URL.

**webpack.config.js**

```js
{
  loader: 'css-loader',
  options: {
    sourceMap: true
  }
}
```

### `importLoaders`

Type: `Number`
Default: `0`

Option `importLoaders` allows to configure how many loaders before `css-loader` should be applied to `@import`ed resources.

**webpack.config.js**

```js
{
  test: /\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        importLoaders: 2 // 0 => no loaders (default); 1 => postcss-loader; 2 => postcss-loader, sass-loader
      }
    },
    'postcss-loader',
    'sass-loader'
  ]
}
```

This may change in the future, when the module system (i. e. webpack) supports loader matching by origin.

## Examples

### Assets

The following `webpack.config.js` can load CSS files, embed small PNG/JPG/GIF/SVG images as well as fonts as [Data URLs](https://tools.ietf.org/html/rfc2397) and copy larger files to the output directory.

**webpack.config.js**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
        },
      },
    ],
  },
};
```

### Extract

For production builds it's recommended to extract the CSS from your bundle being able to use parallel loading of CSS/JS resources later on.
This can be achieved by using the [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) to extract the CSS when running in production mode.

**webpack.config.js**

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          // fallback to style-loader in development
          process.env.NODE_ENV !== 'production' 
            ? 'style-loader' 
            : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },
};
```

## Contributing

Please take a moment to read our contributing guidelines if you haven't yet done so.

#### [CONTRIBUTING](./.github/CONTRIBUTING)

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/css-loader.svg
[npm-url]: https://npmjs.com/package/css-loader
[node]: https://img.shields.io/node/v/css-loader.svg
[node-url]: https://nodejs.org
[deps]: https://david-dm.org/webpack-contrib/css-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/css-loader
[tests]: https://img.shields.io/circleci/project/github/webpack-contrib/css-loader.svg
[tests-url]: https://circleci.com/gh/webpack-contrib/css-loader
[cover]: https://codecov.io/gh/webpack-contrib/css-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/css-loader
[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack
[size]: https://packagephobia.now.sh/badge?p=css-loader
[size-url]: https://packagephobia.now.sh/result?p=css-loader
