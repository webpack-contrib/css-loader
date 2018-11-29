/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const path = require('path');

const camelCase = require('lodash/camelCase');
const loaderUtils = require('loader-utils');

const placholderRegExps = {
  importItemG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
  importItem: /___CSS_LOADER_IMPORT___([0-9]+)___/,
  urlItemG: /___CSS_LOADER_URL___([0-9]+)___/g,
  urlItem: /___CSS_LOADER_URL___([0-9]+)___/,
};

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function compileExports(exports, importItemMatcher, camelCaseKeys) {
  if (!exports || Object.keys(exports).length === 0) {
    return '';
  }

  const exportJs = Object.keys(exports)
    .reduce((res, key) => {
      let valueAsString = JSON.stringify(exports[key]);

      valueAsString = valueAsString.replace(
        placholderRegExps.importItemG,
        importItemMatcher
      );

      function addEntry(k) {
        res.push(`\t${JSON.stringify(k)}: ${valueAsString}`);
      }

      let targetKey;

      switch (camelCaseKeys) {
        case true:
          addEntry(key);
          targetKey = camelCase(key);

          if (targetKey !== key) {
            addEntry(targetKey);
          }
          break;
        case 'dashes':
          addEntry(key);
          targetKey = dashesCamelCase(key);

          if (targetKey !== key) {
            addEntry(targetKey);
          }
          break;
        case 'only':
          addEntry(camelCase(key));
          break;
        case 'dashesOnly':
          addEntry(dashesCamelCase(key));
          break;
        default:
          addEntry(key);
          break;
      }

      return res;
    }, [])
    .join(',\n');

  return `{\n${exportJs}\n}`;
}

function getImportPrefix(loaderContext, query) {
  if (query.importLoaders === false) {
    return '';
  }

  const importLoaders = parseInt(query.importLoaders, 10) || 0;
  const loadersRequest = loaderContext.loaders
    .slice(
      loaderContext.loaderIndex,
      loaderContext.loaderIndex + 1 + importLoaders
    )
    .map((x) => x.request)
    .join('!');
  return `-!${loadersRequest}!`;
}

function getLocalIdent(loaderContext, localIdentName, localName, options) {
  if (!options.context) {
    if (loaderContext.rootContext) {
      // eslint-disable-next-line no-param-reassign
      options.context = loaderContext.rootContext;
    } else if (
      loaderContext.options &&
      typeof loaderContext.options.context === 'string'
    ) {
      // eslint-disable-next-line no-param-reassign
      options.context = loaderContext.options.context;
    } else {
      // eslint-disable-next-line no-param-reassign
      options.context = loaderContext.context;
    }
  }
  const request = path.relative(options.context, loaderContext.resourcePath);
  // eslint-disable-next-line no-param-reassign
  options.content = `${options.hashPrefix +
    request.replace(/\\/g, '/')}+${localName}`;
  // eslint-disable-next-line no-param-reassign
  localIdentName = localIdentName.replace(/\[local\]/gi, localName);
  const hash = loaderUtils.interpolateName(
    loaderContext,
    localIdentName,
    options
  );
  return hash
    .replace(new RegExp('[^a-zA-Z0-9\\-_\u00A0-\uFFFF]', 'g'), '-')
    .replace(/^((-?[0-9])|--)/, '_$1');
}

function placeholderImportItemReplacer(
  loaderContext,
  importItems,
  importUrlPrefix,
  onlyLocals = false
) {
  return (item) => {
    const match = placholderRegExps.importItem.exec(item);
    const idx = +match[1];
    const importItem = importItems[idx];
    const importUrl = importUrlPrefix + importItem.url;

    if (onlyLocals) {
      return `" + require(${loaderUtils.stringifyRequest(
        loaderContext,
        importUrl
      )})[${JSON.stringify(importItem.export)}] + "`;
    }

    return `" + require(${loaderUtils.stringifyRequest(
      loaderContext,
      importUrl
    )}).locals[${JSON.stringify(importItem.export)}] + "`;
  };
}

module.exports = {
  dashesCamelCase,
  compileExports,
  getImportPrefix,
  getLocalIdent,
  placeholderImportItemReplacer,
  placholderRegExps,
};
