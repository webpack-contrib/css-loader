/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const loaderUtils = require('loader-utils');

const processCss = require('./processCss');
const { getImportPrefix, compileExports } = require('./utils');

module.exports = function loader(content, map) {
  const callback = this.async();
  const query = loaderUtils.getOptions(this) || {};
  const moduleMode = query.modules;
  const camelCaseKeys = query.camelCase;
  const sourceMap = query.sourceMap || false;

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
      mode: moduleMode ? 'local' : 'global',
      from: loaderUtils
        .getRemainingRequest(this)
        .split('!')
        .pop(),
      to: loaderUtils
        .getCurrentRequest(this)
        .split('!')
        .pop(),
      query,
      loaderContext: this,
      sourceMap,
    },
    (err, result) => {
      if (err) {
        return callback(err);
      }

      let cssAsString = JSON.stringify(result.source);

      // for importing CSS
      const importUrlPrefix = getImportPrefix(this, query);

      const alreadyImported = {};
      const importJs = result.importItems
        .map((imp) => {
          // fixes #781 when importing `url(filename.css )`
          // eslint-disable-next-line no-param-reassign
          imp.url = imp.url.trim();
          return imp;
        })
        .filter((imp) => {
          if (!imp.mediaQuery) {
            if (alreadyImported[imp.url]) {
              return false;
            }
            alreadyImported[imp.url] = true;
          }
          return true;
        })
        .map((imp) => {
          if (!loaderUtils.isUrlRequest(imp.url)) {
            return `exports.push([module.id, ${JSON.stringify(
              `@import url(${imp.url});`
            )}, ${JSON.stringify(imp.mediaQuery)}]);`;
          }
          const importUrl = importUrlPrefix + imp.url;
          return `exports.i(require(${loaderUtils.stringifyRequest(
            this,
            importUrl
          )}), ${JSON.stringify(imp.mediaQuery)});`;
        }, this)
        .join('\n');

      function importItemMatcher(item) {
        const match = result.importItemRegExp.exec(item);
        const idx = +match[1];
        const importItem = result.importItems[idx];
        const importUrl = importUrlPrefix + importItem.url;
        return `" + require(${loaderUtils.stringifyRequest(
          this,
          importUrl
        )}).locals[${JSON.stringify(importItem.export)}] + "`;
      }

      cssAsString = cssAsString.replace(
        result.importItemRegExpG,
        importItemMatcher.bind(this)
      );

      // helper for ensuring valid CSS strings from requires
      let urlEscapeHelper = '';

      if (query.url !== false && result.urlItems.length > 0) {
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
            )})) + "${url.substr(idx)}`;
          }
          urlRequest = url;
          return `" + escape(require(${loaderUtils.stringifyRequest(
            this,
            urlRequest
          )})) + "`;
        });
      }

      let exportJs = compileExports(
        result,
        importItemMatcher.bind(this),
        camelCaseKeys
      );
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

      // embed runtime
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
