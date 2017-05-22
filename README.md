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
npm i -D css-loader
```

<h2 align="center">Usage</h2>

The `css-loader` interprets `@import` and `url()` as ES Modules (`import`) and resolves them

> :warning: Assets (`url()`) need to loaded separately by e.g the [file-loader](https://github.com/webpack-contrib/file-loader) or the [url-loader](https://github.com/webpack-contrib/url-loader), which you should specify in your config (`webpack.config.js`) (see [below](https://github.com/webpack-contrib/css-loader#assets))

**file.js**
```js
import css from './file.css';
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

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**[`url`](#url)**|`{Boolean}`|`true`| Enable/Disable `url()` resolving|
|**[`import`](#import)** |`{Boolean}`|`true`| Enable/Disable `@import` resolving|
|**[`minimize`](#minimize)** |`{Boolean}`|`false`|Enable/Disable Minification|
|**[`sourceMap`](#sourcemap)**|`{Boolean}`|`false`|Enable/Disable Source Maps|

### `url`

To disable `url()` resolving by `css-loader` set the option to `false`

```css
.selector {
  declaration: url('./path/to/image.png');
}
```

```js
import CSS__URL__0 from './path/to/image.png';

export default `
  .selector {
    declaration: url(${CSS__URL__0});
  }
`
```

#### `{Boolean}`

To disable `url()` resolving by `css-loader` set the option to `false`

**webpack.config.js**
```js
{
  loader: 'css-loader',
  options: {
    url: false
  }
}
```

#### `{RegExp}`

**webpack.config.js**
```js
{
  loader: 'css-loader',
  options: {
    url: /filter/
  }
}
```

#### `{Function}`


**webpack.config.js**
```js
{
  loader: 'css-loader',
  options: {
    url (url) {
      return /filter/.test(url)
    }
  }
}
```

### `import`

```css
@import './path/to/import.css';
```

```js
import CSS__IMPORT__0 from './path/to/import.css';

export default `
  .css {
    color: red;
  }
`
```

#### `{Boolean}`

To disable `@import` resolving by `css-loader` set the option to `false`

**webpack.config.js**
```js
{
  loader: 'css-loader',
  options: {
    import: false
  }
}
```

### `minimize`

#### `{Boolean}`

**webpack.config.js**
```js
{
  loader: 'css-loader',
  options: {
    minimize: true
  }
}
```

### `sourceMap`

> :warning: They are not enabled by default because they expose a runtime overhead and increase in bundle size (JS source maps do not). In addition to that relative paths are buggy and you need to use an absolute public path which includes the server URL.

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
