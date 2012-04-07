# css loader for webpack

## Usage

``` javascript
var css = require("css!./file.css");
// => returns css code from file.css, resolves imports
```

Don't forget to polyfill `require` if you want to use it in node.
See `webpack` documentation.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)