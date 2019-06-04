/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import path from 'path';

import cc from 'camelcase';
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

/* eslint-disable line-comment-position */

const placholderRegExps = {
  importItemG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
  importItem: /___CSS_LOADER_IMPORT___([0-9]+)___/,
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

function camelCase(str) {
  return cc(str);
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

const whitespace = '[\\x20\\t\\r\\n\\f]';
const unescapeRegExp = new RegExp(
  `\\\\([\\da-f]{1,6}${whitespace}?|(${whitespace})|.)`,
  'ig'
);

function unescape(str) {
  return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
    const high = `0x${escaped}` - 0x10000;

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
        return modulesOptions.getLocalIdent(
          loaderContext,
          modulesOptions.localIdentName,
          exportName,
          {
            context: modulesOptions.context,
            hashPrefix: modulesOptions.hashPrefix,
            regExp: modulesOptions.localIdentRegExp,
          }
        );
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

function getIcssItemReplacer(result, loaderContext, importPrefix, onlyLocals) {
  const { messages } = result;

  return function replacer(placeholder) {
    const match = placholderRegExps.importItem.exec(placeholder);
    const idx = Number(match[1]);

    const message = messages.find(
      // eslint-disable-next-line no-shadow
      (message) =>
        message.type === 'icss-import' &&
        message.item &&
        message.item.index === idx
    );

    if (!message) {
      return placeholder;
    }

    const { item } = message;
    const importUrl = importPrefix + urlToRequest(item.url);

    if (onlyLocals) {
      return `" + require(${stringifyRequest(
        loaderContext,
        importUrl
      )})[${JSON.stringify(item.export)}] + "`;
    }

    return `" + require(${stringifyRequest(
      loaderContext,
      importUrl
    )}).locals[${JSON.stringify(item.export)}] + "`;
  };
}

function getRuntimeCode(result, loaderContext, sourceMap) {
  const { cssLoaderBuildInfo } = result;
  const { onlyLocals } = cssLoaderBuildInfo;

  if (onlyLocals) {
    return '';
  }

  return `exports = module.exports = require(${stringifyRequest(
    loaderContext,
    require.resolve('./runtime/api')
  )})(${!!sourceMap});\n`;
}

function getImportCode(result, loaderContext) {
  const { cssLoaderBuildInfo, messages } = result;
  const { importPrefix, onlyLocals } = cssLoaderBuildInfo;

  if (onlyLocals) {
    return '';
  }

  const importItems = [];

  // Helper for getting url
  let hasUrlHelper = false;

  messages
    .filter(
      (message) =>
        message.pluginName === 'postcss-url-parser' ||
        message.pluginName === 'postcss-import-parser' ||
        message.pluginName === 'postcss-icss-parser'
    )
    .forEach((message) => {
      if (message.type === 'import') {
        const { url } = message.item;
        const media = message.item.media || '';

        if (!isUrlRequest(url)) {
          importItems.push(
            `exports.push([module.id, ${JSON.stringify(
              `@import url(${url});`
            )}, ${JSON.stringify(media)}]);`
          );
        } else {
          const importUrl = importPrefix + urlToRequest(url);

          importItems.push(
            `exports.i(require(${stringifyRequest(
              loaderContext,
              importUrl
            )}), ${JSON.stringify(media)});`
          );
        }
      }

      if (message.type === 'url') {
        if (!hasUrlHelper) {
          importItems.push(
            `var getUrl = require(${stringifyRequest(
              loaderContext,
              require.resolve('./runtime/get-url.js')
            )});`
          );

          hasUrlHelper = true;
        }

        const { url, placeholder, needQuotes } = message.item;
        // Remove `#hash` and `?#hash` from `require`
        const [normalizedUrl, singleQuery, hashValue] = url.split(/(\?)?#/);
        const hash =
          singleQuery || hashValue
            ? `"${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}"`
            : '';

        importItems.push(
          `var ${placeholder} = getUrl(require(${stringifyRequest(
            loaderContext,
            urlToRequest(normalizedUrl)
          )})${hash ? ` + ${hash}` : ''}${needQuotes ? ', true' : ''});`
        );
      }
    });

  return importItems.length > 0
    ? `// Imports\n${importItems.join('\n')}\n\n`
    : '';
}

function getModuleCode(result) {
  const { cssLoaderBuildInfo, css, messages, map } = result;
  const { replacer, onlyLocals } = cssLoaderBuildInfo;

  if (onlyLocals) {
    return '';
  }

  let cssAsString = JSON.stringify(css).replace(
    placholderRegExps.importItemG,
    replacer
  );

  messages
    .filter(
      (message) =>
        message.pluginName === 'postcss-url-parser' && message.type === 'url'
    )
    .forEach((message) => {
      const { placeholder } = message.item;

      cssAsString = cssAsString.replace(
        new RegExp(placeholder, 'g'),
        () => `" + ${placeholder} + "`
      );
    });

  return `// Module\nexports.push([module.id, ${cssAsString}, ""${
    map ? `,${map}` : ''
  }]);\n\n`;
}

function getExportCode(result) {
  const { messages, cssLoaderBuildInfo } = result;
  const { replacer, localsStyle, onlyLocals } = cssLoaderBuildInfo;

  const exportItems = messages
    .filter(
      (message) =>
        message.pluginName === 'postcss-icss-parser' &&
        message.type === 'export'
    )
    .reduce((accumulator, message) => {
      const { key, value } = message.item;

      let valueAsString = JSON.stringify(value);

      valueAsString = valueAsString.replace(
        placholderRegExps.importItemG,
        replacer
      );

      function addEntry(k) {
        accumulator.push(`\t${JSON.stringify(k)}: ${valueAsString}`);
      }

      let targetKey;

      switch (localsStyle) {
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

      return accumulator;
    }, []);

  return exportItems.length > 0
    ? onlyLocals
      ? `module.exports = {\n${exportItems.join(',\n')}\n};`
      : `// Exports\nexports.locals = {\n${exportItems.join(',\n')}\n};`
    : '';
}

export {
  getImportPrefix,
  getLocalIdent,
  placholderRegExps,
  getFilter,
  getIcssItemReplacer,
  getModulesPlugins,
  normalizeSourceMap,
  getRuntimeCode,
  getImportCode,
  getModuleCode,
  getExportCode,
};
