# css loader for webpack

## installation

`npm install css-loader`

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
      { test: /\.png$/, loader: "url-loader?limit=100000&mimetype=image/png" },
      { test: /\.jpg$/, loader: "file-loader" }
    ]
  }
};
```

### Placeholders

(experimental)

Special selectors are automatically replaced with random identifiers, which are exported:

``` css
.[className] { background: red; }
#[someId] { background: green; }
.[className] .[subClass] { color: green; }
#[someId] .[subClass] { color: blue; }
```

is transformed to

``` css
.ze24205081ae540afa51bd4cce768e8b7 { background: red; }
#zdf12049771f7fc796a63a3945da3a66d { background: green; }
.ze24205081ae540afa51bd4cce768e8b7 .z9f634213cd27594c1a13d18554d47a8c { color: green; }
#zdf12049771f7fc796a63a3945da3a66d .z9f634213cd27594c1a13d18554d47a8c { color: blue; }
```

and the identifiers are exported:

``` js
exports.placeholders = {
  className: "ze24205081ae540afa51bd4cce768e8b7",
  someId: "zdf12049771f7fc796a63a3945da3a66d",
  subClass: "z9f634213cd27594c1a13d18554d47a8c"
}
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
