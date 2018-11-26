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

const CssSyntaxError = require('./CssSyntaxError');
const { getLocalIdent } = require('./utils');

module.exports = function processCss(inputSource, inputMap, options, callback) {
  const { query } = options;
  const { context, localIdentRegExp } = query;
  const localIdentName = query.localIdentName || '[hash:base64]';
  const customGetLocalIdent = query.getLocalIdent || getLocalIdent;

  const parserOptions = {
    mode: options.mode,
    url: query.url !== false,
    import: query.import !== false,
    resolve: options.resolve,
  };

  const pipeline = postcss([
    modulesValues,
    localByDefault({
      mode: options.mode,
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
            regExp: localIdentRegExp,
            hashPrefix: query.hashPrefix || '',
            context,
          }
        );
      },
    }),
    cssLoaderParser(parserOptions),
  ]);

  pipeline
    .process(inputSource, {
      // we need a prefix to avoid path rewriting of PostCSS
      from: `/css-loader!${options.from}`,
      to: options.to,
      map: options.sourceMap
        ? {
            prev: inputMap,
            sourcesContent: true,
            inline: false,
            annotation: false,
          }
        : null,
    })
    .then((result) => {
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
