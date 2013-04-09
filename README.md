# css loader for webpack

## Usage

``` javascript
var css = require("css!./file.css");
// => returns css code from file.css, resolves imports and url(...)
```

css code will be minimized if specified by the module system.

`@import` will be required with this css loader.

`url(...)` will be required. You should define useful loaders by config.

Good loaders to require these files is the [file-loader](https://github.com/webpack/file-loader) and the [url-loader](https://github.com/webpack/url-loader).

### Example config

This webpack config can load css files, embed small png images as Data Urls and jpg images as files.

``` javascript
module.exports = {
  module: {
    loaders: {
      { test: /\.css/, loader: "style-loader!css-loader" },
      { test: /\.png/, loader: "url-loader?limit=100000&minetype=image/png" },
      { test: /\.jpg/, loader: "file-loader" }
    }
  }
};
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
