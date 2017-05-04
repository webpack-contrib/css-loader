[![npm][npm]][npm-url]
[![deps][deps]][deps-url]
[![test][test]][test-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]

<div align="center">
  <img width="180" height="180" vspace="20"
    src="https://cdn.worldvectorlogo.com/logos/css-3.svg">
  <a href="https://webpack.js.org/">
    <img width="200" height="200" vspace="" hspace="25" src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon-square-big.svg">
  </a>
  <h1>CSS Loader</h1>
</div>

<h2 align="center">Install</h2>

```bash
npm install --save-dev css-loader
```

<h2 align="center">Usage</h2>

The `css-loader` converts ICSS into EcmaScript Modules.

### ICSS

ICSS allows to describe imports and exports in CSS. The following syntax is allowed:

#### Importing CSS

``` css
@import url('./other-file.css');
@import url('other-module/style.css');
```

Imports other CSS files. Imports are hoisted in ICSS.

#### Importing Symbols

``` css
:import('./module') {
  local-alias: importedIdentifier;
  other-name: otherIdentifier;
}
```

Similar to

``` js
import { importedIdentifier as localAlias, otherIdentifier as otherName } from './module';
```

The local alias can be used in the complete file and has the value of the export from the module.

The imported module could be another ICSS file or any other module.

The imported identifier must be a valid javascript identifier (dashes are not allowed).
The local alias must be a valid css identifier (dashes are allowed).

#### Exporting Symbols

``` css
:export {
  exportedName: hello world;
  otherExportedName: 5px   5px,   red;
}
```

Similar to

``` js
export const exportedName = "hello world";
export const otherExportedName = "5px 5px, red";
```

Note that spacing is not significant.

The exported identifier must be a valid javascript identifier (dashes are not allowed).
`default` should not be used a export name.


<h2 align="center">Examples</h2>

### Resolving `url()`

It's often needed to thread `url()`s in the CSS file as imports to other assets.
You want to add all referenced assets into the dependency graph.

This can be achieved by a postcss plugin: postcss-plugin-icss-url.

To enable postcss plugins in your CSS pipeline, chain css-loader with postcss-loader.
Example configuration with style-loader:

``` js
const urlPlugin = require("postcss-plugin-icss-url")

rules: [
  {
    test: /\.css$/,
    rules: [
      {
        issuer: { not: /\.css$/ },
        use: "style-loader"
      },
      {
        use: [
          "css-loader",
          {
            loader: "postcss-loader",
            plugins: [
              urlPlugin({})
            ]
          }
        ]
      }
    ]
  }
]
```

### Postprocessing CSS

It's often needed to use a preprocessor for CSS. Example: SASS.

``` js
const urlPlugin = require("postcss-plugin-icss-url")

rules: [
  {
    test: /\.css$/,
    rules: [
      {
        issuer: { not: /\.css$/ },
        use: "style-loader"
      },
      {
        use: [
          "css-loader",
          {
            loader: "postcss-loader",
            plugins: [
              urlPlugin({})
            ]
          },
          "sass-loader"
        ]
      }
    ]
  }
]
```

### Minimizing CSS

For production builds it's useful to minimize the CSS. This can be done via postcss plugin:

``` js
const cssnano = require("cssnano")

rules: [
  {
    test: /\.css$/,
    rules: [
      {
        issuer: { not: /\.css$/ },
        use: "style-loader"
      },
      {
        use: [
          "css-loader",
          {
            loader: "postcss-loader",
            plugins: [
              cssnano({
                // options
              })
            ]
          }
        ]
      }
    ]
  }
]
```

### Extract

For production builds it's recommended to extract the CSS from your bundle being able to use parallel loading of CSS/JS resources later on. This can be achieved by using the [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) to extract the CSS when running in production mode.

<h2 align="center">Options</h2>

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`sourceMap`**|`{Boolean}`|`false`|Enable/Disable Sourcemaps|

### `sourceMap`

To include source maps set the `sourceMap` option.

I. e. the extract-text-webpack-plugin or the style-loader can handle them.

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

<h2 align="center">Maintainers</h2>

<table>
  <tbody>
    <tr>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/bebraw.png?v=3&s=150">
        </br>
        <a href="https://github.com/bebraw">Juho Vepsäläinen</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/d3viant0ne.png?v=3&s=150">
        </br>
        <a href="https://github.com/d3viant0ne">Joshua Wiens</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/SpaceK33z.png?v=3&s=150">
        </br>
        <a href="https://github.com/SpaceK33z">Kees Kluskens</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/TheLarkInn.png?v=3&s=150">
        </br>
        <a href="https://github.com/TheLarkInn">Sean Larkin</a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/michael-ciniawsky.png?v=3&s=150">
        </br>
        <a href="https://github.com/michael-ciniawsky">Michael Ciniawsky</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/evilebottnawi.png?v=3&s=150">
        </br>
        <a href="https://github.com/evilebottnawi">Evilebot Tnawi</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/joscha.png?v=3&s=150">
        </br>
        <a href="https://github.com/joscha">Joscha Feth</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://github.com/sokra.png?v=3&s=150">
        </br>
        <a href="https://github.com/sokra">Tobias Koppers</a>
      </td>
    </tr>
  <tbody>
</table>

[npm]: https://img.shields.io/npm/v/css-loader.svg
[npm-url]: https://npmjs.com/package/css-loader

[deps]: https://david-dm.org/webpack-contrib/css-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/css-loader

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack

[test]: http://img.shields.io/travis/webpack-contrib/css-loader.svg
[test-url]: https://travis-ci.org/webpack-contrib/css-loader

[cover]: https://codecov.io/gh/webpack-contrib/css-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/css-loader
