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

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
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
      .replace(/^((-?[0-9])|--)/, '_$1'),
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
    context: null,
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

function getImportItemCode(item, loaderContext, importPrefix) {
  const { url } = item;
  const media = item.media || '';

  if (!isUrlRequest(url)) {
    return `exports.push([module.id, ${JSON.stringify(
      `@import url(${url});`
    )}, ${JSON.stringify(media)}]);`;
  }

  const importUrl = importPrefix + urlToRequest(url);

  return `exports.i(require(${stringifyRequest(
    loaderContext,
    importUrl
  )}), ${JSON.stringify(media)});`;
}

function getUrlHelperCode(loaderContext) {
  return `var getUrl = require(${stringifyRequest(
    loaderContext,
    require.resolve('./runtime/getUrl.js')
  )});`;
}

function getUrlItemCode(item, loaderContext) {
  const { url, placeholder, needQuotes } = item;

  // Remove `#hash` and `?#hash` from `require`
  const [normalizedUrl, singleQuery, hashValue] = url.split(/(\?)?#/);
  const hash =
    singleQuery || hashValue
      ? `"${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}"`
      : '';

  return `var ${placeholder} = getUrl(require(${stringifyRequest(
    loaderContext,
    urlToRequest(normalizedUrl)
  )})${hash ? ` + ${hash}` : ''}${needQuotes ? ', true' : ''});`;
}

function getApiCode(loaderContext, sourceMap, onlyLocals) {
  if (onlyLocals) {
    return '';
  }

  return `exports = module.exports = require(${stringifyRequest(
    loaderContext,
    require.resolve('./runtime/api')
  )})(${sourceMap});\n`;
}

function getImportCode(importItems, onlyLocals) {
  if (importItems.length === 0 || onlyLocals) {
    return '';
  }

  return `// Imports\n${importItems.join('\n')}\n`;
}

function getModuleCode(result, sourceMap, onlyLocals) {
  if (onlyLocals) {
    return '';
  }

  return `// Module\nexports.push([module.id, ${JSON.stringify(
    result.css
  )}, ""${sourceMap && result.map ? `,${result.map}` : ''}]);\n`;
}

function getExportItemCode(key, value, localsConvention) {
  let targetKey;
  const items = [];

  function addEntry(k) {
    items.push(`\t${JSON.stringify(k)}: ${JSON.stringify(value)}`);
  }

  switch (localsConvention) {
    case 'camelCase':
      addEntry(key);
      targetKey = camelCase(key);

      if (targetKey !== key) {
        addEntry(targetKey);
      }
      break;
    case 'camelCaseOnly':
      addEntry(camelCase(key));
      break;
    case 'dashes':
      addEntry(key);
      targetKey = dashesCamelCase(key);

      if (targetKey !== key) {
        addEntry(targetKey);
      }
      break;
    case 'dashesOnly':
      addEntry(dashesCamelCase(key));
      break;
    case 'asIs':
    default:
      addEntry(key);
      break;
  }

  return items.join(',\n');
}

function getExportCode(exportItems, onlyLocals) {
  if (exportItems.length === 0) {
    return '';
  }

  return `// Exports\n${
    onlyLocals ? 'module.exports' : 'exports.locals'
  } = {\n${exportItems.join(',\n')}\n};`;
}

function getIcssReplacer(item, loaderContext, importPrefix, onlyLocals) {
  const importUrl = importPrefix + urlToRequest(item.url);

  return () =>
    onlyLocals
      ? `" + require(${stringifyRequest(
          loaderContext,
          importUrl
        )})[${JSON.stringify(item.export)}] + "`
      : `" + require(${stringifyRequest(
          loaderContext,
          importUrl
        )}).locals[${JSON.stringify(item.export)}] + "`;
}

function prepareCode(file, messages, loaderContext, importPrefix, onlyLocals) {
  const { apiCode, importCode } = file;
  let { moduleCode, exportCode } = file;

  messages
    .filter(
      (message) =>
        message.type === 'icss-import' ||
        (message.type === 'import' && message.importType === 'url')
    )
    .forEach((message) => {
      // Replace all urls on `require`
      if (message.type === 'import') {
        const { placeholder } = message;

        if (moduleCode) {
          // eslint-disable-next-line no-param-reassign
          moduleCode = moduleCode.replace(
            new RegExp(placeholder, 'g'),
            () => `" + ${placeholder} + "`
          );
        }
      }

      // Replace external ICSS import on `require`
      if (message.type === 'icss-import') {
        const { item } = message;
        const replacer = getIcssReplacer(
          item,
          loaderContext,
          importPrefix,
          onlyLocals
        );

        if (moduleCode) {
          // eslint-disable-next-line no-param-reassign
          moduleCode = moduleCode.replace(
            new RegExp(`___CSS_LOADER_IMPORT___(${item.index})___`, 'g'),
            replacer
          );
        }

        if (exportCode) {
          // eslint-disable-next-line no-param-reassign
          exportCode = exportCode.replace(
            new RegExp(`___CSS_LOADER_IMPORT___(${item.index})___`, 'g'),
            replacer
          );
        }
      }
    });

  return [apiCode, importCode, moduleCode, exportCode].filter(Boolean).join('');
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
  getImportItemCode,
  getUrlHelperCode,
  getUrlItemCode,
  getApiCode,
  getImportCode,
  getModuleCode,
  getExportItemCode,
  getExportCode,
  prepareCode,
};
