/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const loaderUtils = require('loader-utils');

const processCss = require('./processCss');
const {
  getImportPrefix,
  placeholderImportItemReplacer,
  compileExports,
} = require('./utils');

module.exports = function loader(content, map) {
  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};
  const sourceMap = options.sourceMap || false;

  /* eslint-disable no-param-reassign */
  if (sourceMap) {
    if (map) {
      if (typeof map === 'string') {
        map = JSON.stringify(map);
      }

      if (map.sources) {
        map.sources = map.sources.map((source) => source.replace(/\\/g, '/'));
        map.sourceRoot = '';
      }
    }
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    map = null;
  }
  /* eslint-enable no-param-reassign */

  processCss(
    content,
    map,
    {
      loaderContext: this,
      loaderOptions: options,
      sourceMap,
    },
    (err, result) => {
      if (err) {
        return callback(err);
      }

      // for importing CSS
      const importUrlPrefix = getImportPrefix(this, options);

      let exportJs = compileExports(
        result,
        placeholderImportItemReplacer(
          this,
          result,
          importUrlPrefix,
          options.exportOnlyLocals
        ),
        options.camelCase
      );

      if (options.exportOnlyLocals) {
        if (exportJs) {
          exportJs = `module.exports = ${exportJs};`;
        }

        return callback(null, exportJs);
      }

      let cssAsString = JSON.stringify(result.source);

      const alreadyImported = {};
      const importJs = result.importItems
        .filter((imp) => {
          if (!imp.media) {
            if (alreadyImported[imp.url]) {
              return false;
            }
            alreadyImported[imp.url] = true;
          }
          return true;
        })
        .map((imp) => {
          const { url } = imp;
          const media = imp.media || '';

          if (!loaderUtils.isUrlRequest(url)) {
            return `exports.push([module.id, ${JSON.stringify(
              `@import url(${url});`
            )}, ${JSON.stringify(media)}]);`;
          }

          const importUrl = importUrlPrefix + url;

          return `exports.i(require(${loaderUtils.stringifyRequest(
            this,
            importUrl
          )}), ${JSON.stringify(media)});`;
        }, this)
        .join('\n');

      cssAsString = cssAsString.replace(
        result.importItemRegExpG,
        placeholderImportItemReplacer(this, result, importUrlPrefix)
      );

      // helper for ensuring valid CSS strings from requires
      let urlEscapeHelper = '';

      if (
        options.url !== false &&
        result.urlItems &&
        result.urlItems.length > 0
      ) {
        urlEscapeHelper = `var escape = require(${loaderUtils.stringifyRequest(
          this,
          require.resolve('./runtime/escape.js')
        )});\n`;

        cssAsString = cssAsString.replace(result.urlItemRegExpG, (item) => {
          const match = result.urlItemRegExp.exec(item);
          let idx = +match[1];
          const urlItem = result.urlItems[idx];
          const { url } = urlItem;
          idx = url.indexOf('?#');
          if (idx < 0) {
            idx = url.indexOf('#');
          }
          let urlRequest;
          if (idx > 0) {
            // idx === 0 is catched by isUrlRequest
            // in cases like url('webfont.eot?#iefix')
            urlRequest = url.substr(0, idx);
            return `" + escape(require(${loaderUtils.stringifyRequest(
              this,
              urlRequest
            )}) + "${url.substr(idx)}") + "`;
          }
          urlRequest = url;
          return `" + escape(require(${loaderUtils.stringifyRequest(
            this,
            urlRequest
          )})) + "`;
        });
      }

      if (exportJs) {
        exportJs = `exports.locals = ${exportJs};`;
      }

      let moduleJs;
      if (sourceMap && result.map) {
        /* eslint-disable no-param-reassign */
        // Add a SourceMap
        ({ map } = result);
        if (map.sources) {
          map.sources = map.sources.map(
            (source) =>
              source
                .split('!')
                .pop()
                .replace(/\\/g, '/'),
            this
          );
          map.sourceRoot = '';
        }
        map.file = map.file
          .split('!')
          .pop()
          .replace(/\\/g, '/');
        map = JSON.stringify(map);
        /* eslint-enable no-param-reassign */
        moduleJs = `exports.push([module.id, ${cssAsString}, "", ${map}]);`;
      } else {
        moduleJs = `exports.push([module.id, ${cssAsString}, ""]);`;
      }

      // Embed runtime
      return callback(
        null,
        `${urlEscapeHelper}exports = module.exports = require(${loaderUtils.stringifyRequest(
          this,
          require.resolve('./runtime/api.js')
        )})(${sourceMap});\n` +
          `// imports\n${importJs}\n\n` +
          `// module\n${moduleJs}\n\n` +
          `// exports\n${exportJs}`
      );
    }
  );
};
