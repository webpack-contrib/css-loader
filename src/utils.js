/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import path from 'path';

import loaderUtils, { isUrlRequest, stringifyRequest } from 'loader-utils';
import normalizePath from 'normalize-path';
import cssesc from 'cssesc';
import modulesValues from 'postcss-modules-values';
import localByDefault from 'postcss-modules-local-by-default';
import extractImports from 'postcss-modules-extract-imports';
import modulesScope from 'postcss-modules-scope';
import camelCase from 'camelcase';

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

const whitespace = '[\\x20\\t\\r\\n\\f]';
const unescapeRegExp = new RegExp(
  `\\\\([\\da-f]{1,6}${whitespace}?|(${whitespace})|.)`,
  'ig'
);

function unescape(str) {
  return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
    const high = `0x${escaped}` - 0x10000;

    /* eslint-disable line-comment-position */
    // NaN means non-codepoint
    // Workaround erroneous numeric interpretation of +"0x"
    // eslint-disable-next-line no-self-compare
    return high !== high || escapedWhitespace
      ? escaped
      : high < 0
      ? // BMP codepoint
        String.fromCharCode(high + 0x10000)
      : // Supplemental Plane codepoint (surrogate pair)
        // eslint-disable-next-line no-bitwise
        String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
    /* eslint-enable line-comment-position */
  });
}

// eslint-disable-next-line no-control-regex
const filenameReservedRegex = /[<>:"/\\|?*\x00-\x1F]/g;
// eslint-disable-next-line no-control-regex
const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g;
const reRelativePath = /^\.+/;

function getLocalIdent(loaderContext, localIdentName, localName, options) {
  if (!options.context) {
    // eslint-disable-next-line no-param-reassign
    options.context = loaderContext.rootContext;
  }

  const request = normalizePath(
    path.relative(options.context || '', loaderContext.resourcePath)
  );

  // eslint-disable-next-line no-param-reassign
  options.content = `${options.hashPrefix + request}+${unescape(localName)}`;

  // Using `[path]` placeholder outputs `/` we need escape their
  // Also directories can contains invalid characters for css we need escape their too
  return cssesc(
    loaderUtils
      .interpolateName(loaderContext, localIdentName, options)
      // For `[hash]` placeholder
      .replace(/^((-?[0-9])|--)/, '_$1')
      .replace(filenameReservedRegex, '-')
      .replace(reControlChars, '-')
      .replace(reRelativePath, '-')
      .replace(/\./g, '-'),
    { isIdentifier: true }
  ).replace(/\\\[local\\\]/gi, localName);
}

function getFilter(filter, resourcePath, defaultFilter = null) {
  return (item) => {
    if (defaultFilter && !defaultFilter(item)) {
      return false;
    }

    if (typeof filter === 'function') {
      return filter(item, resourcePath);
    }

    return true;
  };
}

function getModulesPlugins(options, loaderContext) {
  let modulesOptions = {
    mode: 'local',
    localIdentName: '[hash:base64]',
    getLocalIdent,
    hashPrefix: '',
    localIdentRegExp: null,
  };

  if (
    typeof options.modules === 'boolean' ||
    typeof options.modules === 'string'
  ) {
    modulesOptions.mode =
      typeof options.modules === 'string' ? options.modules : 'local';
  } else {
    modulesOptions = Object.assign({}, modulesOptions, options.modules);
  }

  return [
    modulesValues,
    localByDefault({ mode: modulesOptions.mode }),
    extractImports(),
    modulesScope({
      generateScopedName: function generateScopedName(exportName) {
        let localIdent = modulesOptions.getLocalIdent(
          loaderContext,
          modulesOptions.localIdentName,
          exportName,
          {
            context: modulesOptions.context,
            hashPrefix: modulesOptions.hashPrefix,
            regExp: modulesOptions.localIdentRegExp,
          }
        );

        if (!localIdent) {
          localIdent = getLocalIdent(
            loaderContext,
            modulesOptions.localIdentName,
            exportName,
            {
              context: modulesOptions.context,
              hashPrefix: modulesOptions.hashPrefix,
              regExp: modulesOptions.localIdentRegExp,
            }
          );
        }

        return localIdent;
      },
    }),
  ];
}

function normalizeSourceMap(map) {
  let newMap = map;

  // Some loader emit source map as string
  // Strip any JSON XSSI avoidance prefix from the string (as documented in the source maps specification), and then parse the string as JSON.
  if (typeof newMap === 'string') {
    newMap = JSON.parse(newMap.replace(/^\)]}'[^\n]*\n/, ''));
  }

  // Source maps should use forward slash because it is URLs (https://github.com/mozilla/source-map/issues/91)
  // We should normalize path because previous loaders like `sass-loader` using backslash when generate source map

  if (newMap.file) {
    newMap.file = normalizePath(newMap.file);
  }

  if (newMap.sourceRoot) {
    newMap.sourceRoot = normalizePath(newMap.sourceRoot);
  }

  if (newMap.sources) {
    newMap.sources = newMap.sources.map((source) => normalizePath(source));
  }

  return newMap;
}

function getImportCode(
  loaderContext,
  imports,
  exportType,
  sourceMap,
  importLoaders
) {
  const importItems = [];
  const codeItems = [];
  const urlImportNames = new Map();

  let hasUrlHelperCode = false;
  let importPrefix;

  if (exportType === 'full') {
    const url = stringifyRequest(
      loaderContext,
      require.resolve('./runtime/api')
    );
    importItems.push(`var ___CSS_LOADER_API_IMPORT___ = require(${url});`);
    codeItems.push(
      `exports = module.exports = ___CSS_LOADER_API_IMPORT___(${sourceMap});`
    );
  }

  imports.forEach((item) => {
    if (item.type === '@import' || item.type === 'icss-import') {
      const media = item.media ? `, ${JSON.stringify(item.media)}` : '';

      if (!isUrlRequest(item.url)) {
        const url = JSON.stringify(`@import url(${item.url});`);
        codeItems.push(`exports.push([module.id, ${url}${media}]);`);

        return;
      }

      if (!importPrefix) {
        importPrefix = getImportPrefix(loaderContext, importLoaders);
      }

      const url = stringifyRequest(loaderContext, importPrefix + item.url);

      importItems.push(`var ${item.name} = require(${url});`);

      if (exportType === 'full') {
        codeItems.push(`exports.i(${item.name}${media});`);
      }
    }

    if (item.type === 'url') {
      if (!hasUrlHelperCode) {
        const pathToGetUrl = require.resolve('./runtime/getUrl.js');
        const url = stringifyRequest(loaderContext, pathToGetUrl);

        importItems.push(
          `var ___CSS_LOADER_GET_URL_IMPORT___ = require(${url});`
        );

        hasUrlHelperCode = true;
      }

      const { name, url, hash, needQuotes, index } = item;

      let importName = urlImportNames.get(url);

      if (!importName) {
        const preparedUrl = stringifyRequest(loaderContext, url);

        importName = `___CSS_LOADER_URL_PURE_IMPORT_${index}___`;
        importItems.push(`var ${importName} = require(${preparedUrl});`);
        urlImportNames.set(url, importName);
      }

      const getUrlOptions = []
        .concat(hash ? [`hash: ${JSON.stringify(hash)}`] : [])
        .concat(needQuotes ? 'needQuotes: true' : []);
      const preparedOptions =
        getUrlOptions.length > 0 ? `, { ${getUrlOptions.join(', ')} }` : '';

      codeItems.push(
        `var ${name} = ___CSS_LOADER_GET_URL_IMPORT___(${importName}${preparedOptions});`
      );
    }
  });

  const items = importItems.concat(codeItems);

  return items.length > 0 ? `// Imports\n${items.join('\n')}\n` : '';
}

function getModuleCode(
  loaderContext,
  result,
  exportType,
  sourceMap,
  replacers
) {
  if (exportType !== 'full') {
    return '';
  }

  const { css, map } = result;
  const sourceMapValue = sourceMap && map ? `,${map}` : '';

  let cssCode = JSON.stringify(css);

  replacers.forEach((replacer) => {
    const { type, name } = replacer;

    if (type === 'url') {
      cssCode = cssCode.replace(new RegExp(name, 'g'), () => `" + ${name} + "`);
    }

    if (type === 'icss-import') {
      const { importName, localName } = replacer;

      cssCode = cssCode.replace(
        new RegExp(name, 'g'),
        () => `" + ${importName}.locals[${JSON.stringify(localName)}] + "`
      );
    }
  });

  return `// Module\nexports.push([module.id, ${cssCode}, ""${sourceMapValue}]);\n`;
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function getExportCode(
  loaderContext,
  exports,
  exportType,
  replacers,
  localsConvention
) {
  if (exports.length === 0) {
    return '';
  }

  const items = [];

  function addExportedItem(name, value) {
    items.push(`\t${JSON.stringify(name)}: ${JSON.stringify(value)}`);
  }

  exports.forEach((item) => {
    const { name, value } = item;

    switch (localsConvention) {
      case 'camelCase': {
        addExportedItem(name, value);

        const modifiedName = camelCase(name);

        if (modifiedName !== name) {
          addExportedItem(modifiedName, value);
        }
        break;
      }
      case 'camelCaseOnly': {
        addExportedItem(camelCase(name), value);
        break;
      }
      case 'dashes': {
        addExportedItem(name, value);

        const modifiedName = dashesCamelCase(name);

        if (modifiedName !== name) {
          addExportedItem(modifiedName, value);
        }
        break;
      }
      case 'dashesOnly': {
        addExportedItem(dashesCamelCase(name), value);
        break;
      }
      case 'asIs':
      default:
        addExportedItem(name, value);
        break;
    }
  });

  let exportCode = `// Exports\n${
    exportType === 'locals' ? 'module.exports' : 'exports.locals'
  } = {\n${items.join(',\n')}\n};`;

  replacers.forEach((replacer) => {
    if (replacer.type === 'icss-import') {
      const { name, importName } = replacer;
      const localName = JSON.stringify(replacer.localName);

      exportCode = exportCode.replace(new RegExp(name, 'g'), () =>
        exportType === 'locals'
          ? `" + ${importName}[${localName}] + "`
          : `" + ${importName}.locals[${localName}] + "`
      );
    }
  });

  return exportCode;
}

export {
  unescape,
  getFilter,
  getModulesPlugins,
  normalizeSourceMap,
  getImportCode,
  getModuleCode,
  getExportCode,
};
