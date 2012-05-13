# css loader for webpack

## Usage

``` javascript
var css = require("css!./file.css");
// => returns css code from file.css, resolves imports and url(...)
```

`@import` will be required with this css loader.

`url(...)` will be required with the loader specified in the options.
If `options.css.requireUrl` is a string it will be prefixed to the required url.
If it isn't a string `url(...)` will not be replaced.
`options.css.requireUrl` defaults to `"file/auto!"`.

A alternative to the file-loader is the
[url-loader](https://github.com/sokra/webpack-url-loader) which can use Data Urls.
The use it specify `"url/auto!"`.

Don't forget to polyfill `require` if you want to use it in node.
See `webpack` documentation.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)