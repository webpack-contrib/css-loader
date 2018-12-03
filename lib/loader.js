/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const postcss = require('postcss');
const localByDefault = require('postcss-modules-local-by-default');
const extractImports = require('postcss-modules-extract-imports');
const modulesScope = require('postcss-modules-scope');
const modulesValues = require('postcss-modules-values');
const {
  getOptions,
  isUrlRequest,
  urlToRequest,
  getRemainingRequest,
  getCurrentRequest,
  stringifyRequest,
} = require('loader-utils');

const { importParser, icssParser, urlParser } = require('./plugins');
const {
  getLocalIdent,
  getImportPrefix,
  compileExports,
  placholderRegExps,
} = require('./utils');
const Warning = require('./Warning');
const CssSyntaxError = require('./CssSyntaxError');

module.exports = function loader(content, map) {
  const callback = this.async();
  const options = getOptions(this) || {};
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

  const parserOptions = {};
  const resolveImport = options.import !== false;
  const resolveUrl = options.url !== false;
  const loaderContext = this;

  const plugins = [
    modulesValues,
    localByDefault({
      mode: options.modules ? 'local' : 'global',
      rewriteUrl(global, url) {
        if (resolveUrl) {
          // eslint-disable-next-line no-param-reassign
          url = url.trim();

          if (!url.replace(/\s/g, '').length || !isUrlRequest(url)) {
            return url;
          }

          if (global) {
            return urlToRequest(url);
          }
        }

        return url;
      },
    }),
    extractImports(),
    modulesScope({
      generateScopedName: function generateScopedName(exportName) {
        const localIdentName = options.localIdentName || '[hash:base64]';
        const customGetLocalIdent = options.getLocalIdent || getLocalIdent;

        return customGetLocalIdent(loaderContext, localIdentName, exportName, {
          regExp: options.localIdentRegExp,
          hashPrefix: options.hashPrefix || '',
          context: options.context,
        });
      },
    }),
  ];

  if (resolveImport) {
    plugins.push(importParser());
  }

  if (resolveUrl) {
    plugins.push(urlParser());
  }

  plugins.push(icssParser(parserOptions));

  postcss(plugins)
    .process(content, {
      // we need a prefix to avoid path rewriting of PostCSS
      from: `/css-loader!${getRemainingRequest(this)
        .split('!')
        .pop()}`,
      to: getCurrentRequest(this)
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

      const messages = result.messages || [];
      const { camelCase, exportOnlyLocals, importLoaders } = options;
      const { importItems } = parserOptions;

      // Run other loader (`postcss-loader`, `sass-loader` and etc) for importing CSS
      const importUrlPrefix = getImportPrefix(this, importLoaders);

      // Prepare replacer to change from `___CSS_LOADER_IMPORT___INDEX___` to `require('./file.css').locals`
      const importItemReplacer = (item) => {
        const match = placholderRegExps.importItem.exec(item);
        const idx = Number(match[1]);

        if (!importItems[idx]) {
          return item;
        }

        const importItem = importItems[idx];
        const importUrl = importUrlPrefix + importItem.url;

        if (exportOnlyLocals) {
          return `" + require(${stringifyRequest(
            this,
            importUrl
          )})[${JSON.stringify(importItem.export)}] + "`;
        }

        return `" + require(${stringifyRequest(
          this,
          importUrl
        )}).locals[${JSON.stringify(importItem.export)}] + "`;
      };

      let exportCode = compileExports(messages, camelCase, (valueAsString) =>
        valueAsString.replace(placholderRegExps.importItemG, importItemReplacer)
      );

      if (exportOnlyLocals) {
        return callback(
          null,
          exportCode ? `module.exports = ${exportCode};` : exportCode
        );
      }

      const alreadyImported = {};
      const importCode = importItems
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

          if (!isUrlRequest(url)) {
            return `exports.push([module.id, ${JSON.stringify(
              `@import url(${url});`
            )}, ${JSON.stringify(media)}]);`;
          }

          const importUrl = importUrlPrefix + url;

          return `exports.i(require(${stringifyRequest(
            this,
            importUrl
          )}), ${JSON.stringify(media)});`;
        }, this)
        .join('\n');

      let cssAsString = JSON.stringify(result.css).replace(
        placholderRegExps.importItemG,
        importItemReplacer
      );

      // helper for ensuring valid CSS strings from requires
      let urlEscapeHelperCode = '';

      messages
        .filter((message) => message.type === 'url' && resolveUrl)
        .forEach((message) => {
          if (!urlEscapeHelperCode) {
            urlEscapeHelperCode = `var escape = require(${stringifyRequest(
              this,
              require.resolve('./runtime/escape.js')
            )});\n`;
          }

          const { item } = message;
          const { url, placeholder } = item;

          cssAsString = cssAsString.replace(
            new RegExp(placeholder, 'g'),
            () => {
              // Remove `#hash` and `?#hash` from `require`
              const [normalizedUrl, singleQuery, hashValue] = url.split(
                /(\?)?#/
              );
              const hash =
                singleQuery || hashValue
                  ? `"${singleQuery ? '?' : ''}${
                      hashValue ? `#${hashValue}` : ''
                    }"`
                  : '';

              return `" + escape(require(${stringifyRequest(
                this,
                normalizedUrl
              )})${hash ? ` + ${hash}` : ''}) + "`;
            }
          );
        });

      if (exportCode) {
        exportCode = `exports.locals = ${exportCode};`;
      }

      let newMap = result.map;

      if (sourceMap && newMap) {
        // Add a SourceMap
        newMap = newMap.toJSON();

        if (newMap.sources) {
          newMap.sources = newMap.sources.map(
            (source) =>
              source
                .split('!')
                .pop()
                .replace(/\\/g, '/'),
            this
          );
          newMap.sourceRoot = '';
        }

        newMap.file = newMap.file
          .split('!')
          .pop()
          .replace(/\\/g, '/');
        newMap = JSON.stringify(newMap);
      }

      const runtimeCode = `exports = module.exports = require(${stringifyRequest(
        this,
        require.resolve('./runtime/api')
      )})(${!!sourceMap});`;
      const moduleCode = `exports.push([module.id, ${cssAsString}, ""${
        newMap ? `,${newMap}` : ''
      }]);`;

      // Embed runtime
      return callback(
        null,
        `${urlEscapeHelperCode}${runtimeCode}\n` +
          `// imports\n${importCode}\n\n` +
          `// module\n${moduleCode}\n\n` +
          `// exports\n${exportCode}`
      );
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
};
