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

function getImportPrefix(loaderContext, importLoaders) {
  if (importLoaders === false) {
    return '';
  }

  const numberImportedLoaders = parseInt(importLoaders, 10) || 0;
  const loadersRequest = loaderContext.loaders
    .slice(
      loaderContext.loaderIndex,
      loaderContext.loaderIndex + 1 + numberImportedLoaders
    )
    .map((x) => x.request)
    .join('!');

  return `-!${loadersRequest}!`;
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function compileExports(exports, camelCaseKeys, valueHandler) {
  if (!exports || Object.keys(exports).length === 0) {
    return '';
  }

  const exportJs = Object.keys(exports)
    .reduce((res, key) => {
      let valueAsString = JSON.stringify(exports[key]);

      valueAsString = valueHandler(valueAsString);

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

function getLocalIdent(loaderContext, localIdentName, localName, options) {
  if (!options.context) {
    // eslint-disable-next-line no-param-reassign
    options.context = loaderContext.rootContext;
  }

  const request = path
    .relative(options.context, loaderContext.resourcePath)
    .replace(/\\/g, '/');

  // eslint-disable-next-line no-param-reassign
  options.content = `${options.hashPrefix + request}+${localName}`;

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

module.exports = {
  compileExports,
  getImportPrefix,
  getLocalIdent,
  placholderRegExps,
};
