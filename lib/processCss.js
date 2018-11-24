/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const formatCodeFrame = require('babel-code-frame');
const Tokenizer = require('css-selector-tokenizer');
const postcss = require('postcss');
const loaderUtils = require('loader-utils');

const icssUtils = require('icss-utils');
const localByDefault = require('postcss-modules-local-by-default');
const extractImports = require('postcss-modules-extract-imports');
const modulesScope = require('postcss-modules-scope');
const modulesValues = require('postcss-modules-values');
const valueParser = require('postcss-value-parser');

const getLocalIdent = require('./getLocalIdent');

const parserPlugin = postcss.plugin('css-loader-parser', (options) => (css) => {
  const imports = {};
  let exports = {};
  const importItems = [];
  const urlItems = [];

  function replaceImportsInString(str) {
    if (options.import) {
      const tokens = valueParser(str);
      tokens.walk((node) => {
        if (node.type !== 'word') {
          return;
        }
        const token = node.value;
        const importIndex = imports[`$${token}`];
        if (typeof importIndex === 'number') {
          // eslint-disable-next-line no-param-reassign
          node.value = `___CSS_LOADER_IMPORT___${importIndex}___`;
        }
      });
      return tokens.toString();
    }
    return str;
  }

  if (options.import) {
    css.walkAtRules(/^import$/i, (rule) => {
      const values = Tokenizer.parseValues(rule.params);
      let [url] = values.nodes[0].nodes;
      if (url && url.type === 'url') {
        ({ url } = url);
      } else if (url && url.type === 'string') {
        url = url.value;
      } else throw rule.error(`Unexpected format ${rule.params}`);
      if (!url.replace(/\s/g, '').length) {
        return;
      }
      values.nodes[0].nodes.shift();
      const mediaQuery = Tokenizer.stringifyValues(values);

      if (loaderUtils.isUrlRequest(url)) {
        url = loaderUtils.urlToRequest(url);
      }

      importItems.push({
        url,
        mediaQuery,
      });
      rule.remove();
    });
  }

  const icss = icssUtils.extractICSS(css);
  exports = icss.icssExports;
  Object.keys(icss.icssImports).forEach((key) => {
    const url = loaderUtils.parseString(key);
    Object.keys(icss.icssImports[key]).forEach((prop) => {
      imports[`$${prop}`] = importItems.length;
      importItems.push({
        url,
        export: icss.icssImports[key][prop],
      });
    });
  });

  Object.keys(exports).forEach((exportName) => {
    exports[exportName] = replaceImportsInString(exports[exportName]);
  });

  function processNode(item) {
    switch (item.type) {
      case 'value':
        item.nodes.forEach(processNode);
        break;
      case 'nested-item':
        item.nodes.forEach(processNode);
        break;
      case 'item': {
        const importIndex = imports[`$${item.name}`];
        if (typeof importIndex === 'number') {
          // eslint-disable-next-line no-param-reassign
          item.name = `___CSS_LOADER_IMPORT___${importIndex}___`;
        }
        break;
      }
      case 'url':
        if (
          options.url &&
          item.url.replace(/\s/g, '').length &&
          !/^#/.test(item.url) &&
          loaderUtils.isUrlRequest(item.url)
        ) {
          // Strip quotes, they will be re-added if the module needs them
          /* eslint-disable no-param-reassign */
          item.stringType = '';
          delete item.innerSpacingBefore;
          delete item.innerSpacingAfter;
          const { url } = item;
          item.url = `___CSS_LOADER_URL___${urlItems.length}___`;
          /* eslint-enable no-param-reassign */
          urlItems.push({
            url,
          });
        }
        break;
      // no default
    }
  }

  css.walkDecls((decl) => {
    const values = Tokenizer.parseValues(decl.value);
    values.nodes.forEach((value) => {
      value.nodes.forEach(processNode);
    });
    // eslint-disable-next-line no-param-reassign
    decl.value = Tokenizer.stringifyValues(values);
  });
  css.walkAtRules((atrule) => {
    if (typeof atrule.params === 'string') {
      // eslint-disable-next-line no-param-reassign
      atrule.params = replaceImportsInString(atrule.params);
    }
  });

  /* eslint-disable no-param-reassign */
  options.importItems = importItems;
  options.urlItems = urlItems;
  options.exports = exports;
  /* eslint-enable no-param-reassign */
});

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
    parserPlugin(parserOptions),
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
    .catch((err) => {
      if (err.name === 'CssSyntaxError') {
        const wrappedError = new CSSLoaderError(
          'Syntax Error',
          err.reason,
          err.line != null && err.column != null
            ? { line: err.line, column: err.column }
            : null,
          err.input.source
        );
        callback(wrappedError);
      } else {
        callback(err);
      }
    });
};

function formatMessage(message, loc, source) {
  let formatted = message;
  if (loc) {
    formatted = `${formatted} (${loc.line}:${loc.column})`;
  }
  if (loc && source) {
    formatted = `${formatted}\n\n${formatCodeFrame(
      source,
      loc.line,
      loc.column
    )}\n`;
  }
  return formatted;
}

function CSSLoaderError(name, message, loc, source, error) {
  Error.call(this);
  Error.captureStackTrace(this, CSSLoaderError);
  this.name = name;
  this.error = error;
  this.message = formatMessage(message, loc, source);
  this.hideStack = true;
}

CSSLoaderError.prototype = Object.create(Error.prototype);
CSSLoaderError.prototype.constructor = CSSLoaderError;
