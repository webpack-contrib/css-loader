# css loader for webpack

## installation

`npm install css-loader --save-dev`

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

``` javascript
var css = require("css!./file.css");
// => returns css code from file.css, resolves imports and url(...)
```

`@import` and `url(...)` are interpreted like `require()` and will be resolved by the css-loader.
Good loaders for requiring your assets are the [file-loader](https://github.com/webpack/file-loader)
and the [url-loader](https://github.com/webpack/url-loader) which you should specify in your config (see below).

To be compatible with existing css files:
* `url(image.png)` => `require("./image.png")`
* `url(~module/image.png)` => `require("module/image.png")`

### Example config

This webpack config can load css files, embed small png images as Data Urls and jpg images as files.

``` javascript
module.exports = {
  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jpg$/, loader: "file-loader" }
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
      { test: /\.css$/, loader: "style-loader!css-loader?root=." },
      ...
    ]
```

The result is:

* `url(/image.png)` => `require("./image.png")`

### Local scope

By default CSS exports all class names into a global selector scope. This is a feature which offer a local selector scope.

The syntax `:local(.className)` can be used to declare `className` in the local scope. The local identifiers are exported by the module.

It does it by replacing the selectors by unique identifiers. The choosen unique identifiers are exported by the module.

Example:

``` css
:local(.className) { background: red; }
:local(#someId) { background: green; }
:local(.className .subClass) { color: green; }
:local(#someId .subClass) { color: blue; }
```

is transformed to

``` css
._23_aKvs-b8bW2Vg3fwHozO { background: red; }
#_1j3LM6lKkKzRIt19ImYVnD { background: green; }
._23_aKvs-b8bW2Vg3fwHozO ._13LGdX8RMStbBE9w-t0gZ1 { color: green; }
#_1j3LM6lKkKzRIt19ImYVnD ._13LGdX8RMStbBE9w-t0gZ1 { color: blue; }
```

and the identifiers are exported:

``` js
exports.locals = {
  className: "_23_aKvs-b8bW2Vg3fwHozO",
  someId: "_1j3LM6lKkKzRIt19ImYVnD",
  subClass: "_13LGdX8RMStbBE9w-t0gZ1"
}
```

You can configure the generated ident with the `localIdentName` query parameter (default `[hash:base64]`). Example: `css-loader?localIdentName=[path][name]---[local]---[hash:base64:5]` for easier debugging.

Note: For prerendering with extract-text-webpack-plugin you should use `css-loader/locals` instead of `style-loader!css-loader` in the prerendering bundle. It doesn't embed CSS but only exports the identifier mappings.

### Inheriting

(experimental)

When declaring a local class name you can inherit from another local class name.

``` css
:local(.className) {
  background: red;
  color: yellow;
}

:local(.subClass):extends(.className) {
  background: blue;
}
```

This doesn't result in any change to the CSS itself but exports multiple class names:

``` js
exports.locals = {
  className: "_23_aKvs-b8bW2Vg3fwHozO",
  subClass: "_13LGdX8RMStbBE9w-t0gZ1 _23_aKvs-b8bW2Vg3fwHozO"
}
```

and CSS is transformed to:

``` css
._23_aKvs-b8bW2Vg3fwHozO {
  background: red;
  color: yellow;
}

._13LGdX8RMStbBE9w-t0gZ1 {
  background: blue;
}
```

### Importing local class names

(experimental)

To import a local class name from another module:

``` css
:local(.continueButton):extends(.button from "library/button.css") {
  background: red;
}
```

``` css
:local(.nameEdit):extends(.edit.highlight from "./edit.css") {
  background: red;
}
```

### SourceMaps

To include SourceMaps set the `sourceMap` query param.

`require("css-loader?sourceMap!./file.css")`

I. e. the extract-text-webpack-plugin can handle them.

### importing and chained loaders

The query parameter `importLoaders` allow to configure which loaders should be applied to `@import`ed resources.

`importLoaders` (int): That many loaders after the css-loader are used to import resources.

Examples:

``` js
require("style-loader!css-loader?importLoaders=1!autoprefixer-loader!...")
// => imported resources are handled this way:
require("css-loader?importLoaders=1!autoprefixer-loader!...")

require("style-loader!css-loader!stylus-loader!...")
// => imported resources are handled this way:
require("css-loader!...")
```

### Minification

By default the css-loader minimizes the css if specified by the module system.

In some cases the minification is destructive to the css, so you can provide some options to it. clean-css is used for minification and you find a [list of options here](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-programmatically). Just provide them as query parameter: i. e. `require("css-loader?-restructuring&compatibility")` to disable restructuring and enable compatibility mode.

You can also disable or enforce minification with the `minimize` query parameter.

`require("css-loader?minimize!./file.css")` (enforced)

`require("css-loader?-minimize!./file.css")` (disabled)

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
