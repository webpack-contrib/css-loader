/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import path from 'path';

import loaderUtils, {
  isUrlRequest,
  stringifyRequest,
  urlToRequest,
} from 'loader-utils';
import normalizePath from 'normalize-path';
import cssesc from 'cssesc';
import modulesValues from 'postcss-modules-values';
import localByDefault from 'postcss-modules-local-by-default';
import extractImports from 'postcss-modules-extract-imports';
import modulesScope from 'postcss-modules-scope';
import camelCase from 'camelcase';

function uniqWith(array, comparator) {
  return array.reduce(
    (acc, d) => (!acc.some((item) => comparator(d, item)) ? [...acc, d] : acc),
    []
  );
}

function flatten(array) {
  return array.reduce((a, b) => a.concat(b), []);
}

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

function getApiCode(loaderContext, sourceMap) {
  const url = stringifyRequest(loaderContext, require.resolve('./runtime/api'));

  return `exports = module.exports = require(${url})(${sourceMap});\n`;
}

function getImportCode(loaderContext, imports, options) {
  const items = [];

  let hasUrlHelperCode = false;

  imports.forEach((item) => {
    if (item.type === '@import' || item.type === 'icss-import') {
      const url = !isUrlRequest(item.url)
        ? JSON.stringify(`@import url(${item.url});`)
        : stringifyRequest(
            loaderContext,
            options.importPrefix + urlToRequest(item.url)
          );
      const media = JSON.stringify(item.media);

      if (!isUrlRequest(item.url)) {
        items.push(`exports.push([module.id, ${url}, ${media}]);`);

        return;
      }

      items.push(`exports.i(require(${url}), ${media});`);
    }

    if (item.type === 'url') {
      if (!hasUrlHelperCode) {
        const pathToGetUrl = require.resolve('./runtime/getUrl.js');
        const url = stringifyRequest(loaderContext, pathToGetUrl);

        items.push(`var getUrl = require(${url});`);

        hasUrlHelperCode = true;
      }

      const { url, name, needQuotes } = item;
      const [normalizedUrl, singleQuery, hashValue] = url.split(/(\?)?#/);
      const hash =
        singleQuery || hashValue
          ? `"${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}"`
          : '';

      const getUrlOptions = [];

      if (hash) {
        getUrlOptions.push(`hash: ${hash}`);
      }

      if (needQuotes) {
        getUrlOptions.push(`needQuotes: true`);
      }

      const preparedUrl = stringifyRequest(
        loaderContext,
        urlToRequest(normalizedUrl)
      );
      const preparedOptions =
        getUrlOptions.length > 0 ? `, { ${getUrlOptions.join(', ')} }` : '';

      items.push(
        `var ${name} = getUrl(require(${preparedUrl})${preparedOptions});`
      );
    }
  });

  return `// Imports\n${items.join('\n')}\n`;
}

function getModuleCode(loaderContext, result, replacers, options) {
  const { css, map } = result;
  const sourceMapValue = options.sourceMap && map ? `,${map}` : '';
  let cssCode = JSON.stringify(css);

  replacers.forEach((replacer) => {
    const { type, name } = replacer;

    if (type === 'url') {
      cssCode = cssCode.replace(new RegExp(name, 'g'), () => `" + ${name} + "`);
    }

    if (type === 'icss-import') {
      const url = stringifyRequest(
        loaderContext,
        options.importPrefix + urlToRequest(replacer.url)
      );
      const exportName = JSON.stringify(replacer.export);

      // eslint-disable-next-line no-param-reassign
      cssCode = cssCode.replace(
        new RegExp(replacer.name, 'g'),
        `" + require(${url}).locals[${exportName}] + "`
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

function getExportCode(loaderContext, exports, replacers, options) {
  const items = [];

  function addExportedItem(name, value) {
    items.push(`\t${JSON.stringify(name)}: ${JSON.stringify(value)}`);
  }

  exports.forEach((item) => {
    const { name, value } = item;

    switch (options.localsConvention) {
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

  const exportType = options.onlyLocals ? 'module.exports' : 'exports.locals';
  let exportCode = `// Exports\n${exportType} = {\n${items.join(',\n')}\n};`;

  replacers.forEach((replacer) => {
    const { type } = replacer;

    if (type === 'icss-import') {
      const importUrl = options.importPrefix + urlToRequest(replacer.url);

      exportCode = exportCode.replace(new RegExp(replacer.name, 'g'), () => {
        const url = stringifyRequest(loaderContext, importUrl);
        const importName = JSON.stringify(replacer.export);

        return options.onlyLocals
          ? `" + require(${url})[${importName}] + "`
          : `" + require(${url}).locals[${importName}] + "`;
      });
    }
  });

  return exportCode;
}

export {
  uniqWith,
  flatten,
  dashesCamelCase,
  getImportPrefix,
  getLocalIdent,
  getFilter,
  getModulesPlugins,
  normalizeSourceMap,
  getApiCode,
  getImportCode,
  getModuleCode,
  getExportCode,
};
