/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const postcss = require('postcss');
const localByDefault = require('postcss-modules-local-by-default');
const extractImports = require('postcss-modules-extract-imports');
const modulesScope = require('postcss-modules-scope');
const modulesValues = require('postcss-modules-values');
const loaderUtils = require('loader-utils');

const { importParser, icssParser, urlParser } = require('./plugins');
const {
  getLocalIdent,
  getImportPrefix,
  placeholderImportItemReplacer,
  compileExports,
  placholderRegExps,
} = require('./utils');
const Warning = require('./Warning');
const CssSyntaxError = require('./CssSyntaxError');

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

  const loaderContext = this;
  const localIdentName = options.localIdentName || '[hash:base64]';
  const customGetLocalIdent = options.getLocalIdent || getLocalIdent;

  const parserOptions = {
    url: options.url !== false,
    import: options.import !== false,
  };

  const plugins = [
    modulesValues,
    localByDefault({
      mode: options.modules ? 'local' : 'global',
      rewriteUrl(global, url) {
        if (parserOptions.url) {
          // eslint-disable-next-line no-param-reassign
          url = url.trim();

          if (
            !url.replace(/\s/g, '').length ||
            !loaderUtils.isUrlRequest(url)
          ) {
            return url;
          }
          if (global) {
            return loaderUtils.urlToRequest(url);
          }
        }
        return url;
      },
    }),
    extractImports(),
    modulesScope({
      generateScopedName: function generateScopedName(exportName) {
        return customGetLocalIdent(loaderContext, localIdentName, exportName, {
          regExp: options.localIdentRegExp,
          hashPrefix: options.hashPrefix || '',
          context: options.context,
        });
      },
    }),
  ];

  if (options.import !== false) {
    plugins.push(importParser(parserOptions));
  }

  if (options.url !== false) {
    plugins.push(urlParser(parserOptions));
  }

  plugins.push(icssParser(parserOptions));

  postcss(plugins)
    .process(content, {
      // we need a prefix to avoid path rewriting of PostCSS
      from: `/css-loader!${loaderUtils
        .getRemainingRequest(this)
        .split('!')
        .pop()}`,
      to: loaderUtils
        .getCurrentRequest(this)
        .split('!')
        .pop(),
      map: options.sourceMap
        ? {
            prev: map,
            sourcesContent: true,
            inline: false,
            annotation: false,
          }
        : null,
    })
    .then((result) => {
      result
        .warnings()
        .forEach((warning) => this.emitWarning(new Warning(warning)));

      // for importing CSS
      const importUrlPrefix = getImportPrefix(this, options);

      let exportJs = compileExports(
        parserOptions.exports,
        placeholderImportItemReplacer(
          this,
          parserOptions.importItems,
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

      let cssAsString = JSON.stringify(result.css);

      const alreadyImported = {};
      const importJs = parserOptions.importItems
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
        placholderRegExps.importItemG,
        placeholderImportItemReplacer(
          this,
          parserOptions.importItems,
          importUrlPrefix
        )
      );

      // helper for ensuring valid CSS strings from requires
      let urlEscapeHelper = '';

      if (
        options.url !== false &&
        parserOptions.urlItems &&
        parserOptions.urlItems.length > 0
      ) {
        urlEscapeHelper = `var escape = require(${loaderUtils.stringifyRequest(
          this,
          require.resolve('./runtime/escape.js')
        )});\n`;

        cssAsString = cssAsString.replace(
          placholderRegExps.urlItemG,
          (item) => {
            const match = placholderRegExps.urlItem.exec(item);
            let idx = +match[1];
            const urlItem = parserOptions.urlItems[idx];
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
          }
        );
      }

      if (exportJs) {
        exportJs = `exports.locals = ${exportJs};`;
      }

      let moduleJs;
      if (sourceMap && result.map) {
        /* eslint-disable no-param-reassign */
        // Add a SourceMap
        map = result.map.toJSON();

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
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
};
