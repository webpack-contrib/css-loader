# css loader for webpack

## Usage

``` javascript
var css = require("css!./file.css");
// => returns css code from file.css, resolves imports and url(...)
```

`@import` will be required with this css loader.

`url(...)` will be required. You should define useful loaders by config.

Good loaders to require these files is the [file-loader](https://github.com/webpack/file-loader) and the [url-loader](https://github.com/webpack/url-loader).

## License

MIT (http://www.opensource.org/licenses/mit-license.php)