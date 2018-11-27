/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const postcss = require('postcss');
const loaderUtils = require('loader-utils');

const localByDefault = require('postcss-modules-local-by-default');
const extractImports = require('postcss-modules-extract-imports');
const modulesScope = require('postcss-modules-scope');
const modulesValues = require('postcss-modules-values');

const cssLoaderParser = require('./postcss-css-loader-parser');

const Warning = require('./Warning');
const CssSyntaxError = require('./CssSyntaxError');
const { getLocalIdent } = require('./utils');

module.exports = function processCss(content, map, options, callback) {
  const { loaderContext, loaderOptions } = options;
  const localIdentName = loaderOptions.localIdentName || '[hash:base64]';
  const customGetLocalIdent = loaderOptions.getLocalIdent || getLocalIdent;

  const parserOptions = {
    url: loaderOptions.url !== false,
    import: loaderOptions.import !== false,
  };

  const pipeline = postcss([
    modulesValues,
    localByDefault({
      mode: loaderOptions.modules ? 'local' : 'global',
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
        return customGetLocalIdent(
          options.loaderContext,
          localIdentName,
          exportName,
          {
            regExp: loaderOptions.localIdentRegExp,
            hashPrefix: loaderOptions.hashPrefix || '',
            context: loaderOptions.context,
          }
        );
      },
    }),
    cssLoaderParser(parserOptions),
  ]);

  pipeline
    .process(content, {
      // we need a prefix to avoid path rewriting of PostCSS
      from: `/css-loader!${loaderUtils
        .getRemainingRequest(loaderContext)
        .split('!')
        .pop()}`,
      to: loaderUtils
        .getCurrentRequest(loaderContext)
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
        .forEach((warning) => loaderContext.emitWarning(new Warning(warning)));

      callback(null, {
        source: result.css,
        map: result.map && result.map.toJSON(),
        exports: parserOptions.exports,
        importItems: parserOptions.importItems,
        importItemRegExpG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
        importItemRegExp: /___CSS_LOADER_IMPORT___([0-9]+)___/,
        urlItems: parserOptions.urlItems,
        urlItemRegExpG: /___CSS_LOADER_URL___([0-9]+)___/g,
        urlItemRegExp: /___CSS_LOADER_URL___([0-9]+)___/,
      });
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
};
