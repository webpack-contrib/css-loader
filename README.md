# css loader for webpack

## installation

`npm install css-loader`

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

``` javascript
var css = require("css!./file.css");
// => returns css code from file.css, resolves imports and url(...)
```

css code will be minimized if specified by the module system.

`@import` and `url(...)` are interpreted like `require()` and will be resolved by the css-loader.
Good loaders for requiring your assets are the [file-loader](https://github.com/webpack/file-loader)
and the [url-loader](https://github.com/webpack/url-loader) which you should specify in your config (see below).

To be combatible to existing css files:
* `url(image.png)` => `require("./image.png")`
* `url(~module/image.png)` => `require("module/image.png")`

### Example config

This webpack config can load css files, embed small png images as Data Urls and jpg images as files.

``` javascript
module.exports = {
  module: {
    loaders: [
      { test: /\.css/, loader: "style-loader!css-loader" },
      { test: /\.png/, loader: "url-loader?limit=100000&mimetype=image/png" },
      { test: /\.jpg/, loader: "file-loader" }
    ]
  }
};
```

### 'Root-relative' urls

For urls that start with a `/`, the default behavior is to not translate them:
* `url(/image.png)` => `url(/image.png)`

If a `root` query parameter is set, however, it will be prepended to the url
and then translated:

With a config like:

``` javascript
    loaders: [
      { test: /\.css/, loader: "style-loader!css-loader?root=." },
      ...
    ]
```

The result is:

* `url(/image.png)` => `require("./image.png")`

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
