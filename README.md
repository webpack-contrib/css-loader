[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]

<div align="center">
  <img width="180" height="180" vspace="20"
    src="https://cdn.worldvectorlogo.com/logos/css-3.svg">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>CSS Loader</h1>
</div>

<h2 align="center">Install</h2>

```bash
npm install --save-dev css-loader
```

<h2 align="center">Usage</h2>

The `css-loader` interprets `@import` and `url()` like `import/require()`
and will resolve them.

Good loaders for requiring your assets are the [file-loader](https://github.com/webpack/file-loader)
and the [url-loader](https://github.com/webpack/url-loader) which you should specify in your config (see [below](https://github.com/webpack-contrib/css-loader#assets)).

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
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  }
}
```

### `toString`

You can also use the css-loader results directly as string, such as in Angular's component style.

**webpack.config.js**
```js
{
   test: /\.css$/,
   use: [
     'to-string-loader',
     'css-loader'
   ]
}
```

or

```js
const css = require('./test.css').toString();

console.log(css); // {String}
```

If there are SourceMaps, they will also be included in the result string.

If, for one reason or another, you need to extract CSS as a
plain string resource (i.e. not wrapped in a JS module) you
might want to check out the [extract-loader](https://github.com/peerigon/extract-loader).
It's useful when you, for instance, need to post process the CSS as a string.

**webpack.config.js**
```js
{
   test: /\.css$/,
   use: [
     'handlebars-loader', // handlebars loader expects raw resource string
     'extract-loader',
     'css-loader'
   ]
}
```

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`url`**|`{Boolean}`|`true`| Enable/Disable `url()` handling|
|**`import`** |`{Boolean}`|`true`| Enable/Disable @import handling|
|**`sourceMap`**|`{Boolean}`|`false`|Enable/Disable Sourcemaps|

### `url`

To disable `url()` resolving by `css-loader` set the option to `false`.

To be compatible with existing css files (if not in CSS Module mode).

```
url(image.png) => require('./image.png')
url(~module/image.png) => require('module/image.png')
```

### `import`

To disable `@import` resolving by `css-loader` set the option to `false`

```css
@import url('https://fonts.googleapis.com/css?family=Roboto');
```

### `sourceMap`

To include source maps set the `sourceMap` option.

I. e. the extract-text-webpack-plugin can handle them.

They are not enabled by default because they expose a runtime overhead and increase in bundle size (JS source maps do not). In addition to that relative paths are buggy and you need to use an absolute public path which include the server URL.

**webpack.config.js**
```js
{
  loader: 'css-loader',
  options: {
    sourceMap: true
  }
}
```

<h2 align="center">Examples</h2>

### `Assets`

The following `webpack.config.js` can load CSS files, embed small PNG/JPG/GIF/SVG images as well as fonts as [Data URLs](https://tools.ietf.org/html/rfc2397) and copy larger files to the output directory.

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  }
}
```

### `Extract`

For production builds it's recommended to extract the CSS from your bundle being able to use parallel loading of CSS/JS resources later on. This can be achieved by using the [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) to extract the CSS when running in production mode.

**webpack.config.js**
```js
const env = process.env.NODE_ENV

const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: env === 'production'
          ? ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: [ 'css-loader' ]
          })
          : [ 'style-loader', 'css-loader' ]
      },
    ]
  },
  plugins: env === 'production'
    ? [
        new ExtractTextPlugin({
          filename: '[name].css'
        })
      ]
    : []
}
```

<h2 align="center">Maintainers</h2>

<table>
  <tbody>
    <tr>
      <td align="center">
        <a href="https://github.com/bebraw">
          <img width="150" height="150" src="https://github.com/bebraw.png?v=3&s=150">
          </br>
          Juho Vepsäläinen
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/d3viant0ne">
          <img width="150" height="150" src="https://github.com/d3viant0ne.png?v=3&s=150">
          </br>
          Joshua Wiens
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/michael-ciniawsky">
          <img width="150" height="150" src="https://github.com/michael-ciniawsky.png?v=3&s=150">
          </br>
          Michael Ciniawsky
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/evilebottnawi">
          <img width="150" height="150" src="https://github.com/evilebottnawi.png?v=3&s=150">
          </br>
          Alexander Krasnoyarov
        </a>
      </td>
    </tr>
  <tbody>
</table>


[npm]: https://img.shields.io/npm/v/css-loader.svg
[npm-url]: https://npmjs.com/package/css-loader

[node]: https://img.shields.io/node/v/css-loader.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack-contrib/css-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/css-loader

[tests]: http://img.shields.io/travis/webpack-contrib/css-loader.svg
[tests-url]: https://travis-ci.org/webpack-contrib/css-loader

[cover]: https://codecov.io/gh/webpack-contrib/css-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/css-loader

[chat]: https://badges.gitter.im/webpack/webpack.svg
[chat-url]: https://gitter.im/webpack/webpack
