# css loader for webpack

## installation

`npm install css-loader`

## Usage

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

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
