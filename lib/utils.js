/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const path = require('path');

const camelCase = require('lodash/camelCase');
const loaderUtils = require('loader-utils');

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function compileExports(result, importItemMatcher, camelCaseKeys) {
  if (!Object.keys(result.exports).length) {
    return '';
  }

  const exportJs = Object.keys(result.exports)
    .reduce((res, key) => {
      let valueAsString = JSON.stringify(result.exports[key]);
      valueAsString = valueAsString.replace(
        result.importItemRegExpG,
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

module.exports = {
  dashesCamelCase,
  compileExports,
  getImportPrefix,
  getLocalIdent,
};
