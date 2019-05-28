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

function getImportItemReplacer(
  messages,
  loaderContext,
  importUrlPrefix,
  exportOnlyLocals
) {
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
    const importUrl = importUrlPrefix + urlToRequest(item.url);

    if (exportOnlyLocals) {
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

function getExports(messages, exportLocalsStyle, importItemReplacer) {
  return messages
    .filter((message) => message.type === 'export')
    .reduce((accumulator, message) => {
      const { key, value } = message.item;

      let valueAsString = JSON.stringify(value);

      valueAsString = valueAsString.replace(
        placholderRegExps.importItemG,
        importItemReplacer
      );

      function addEntry(k) {
        accumulator.push(`\t${JSON.stringify(k)}: ${valueAsString}`);
      }

      let targetKey;

      switch (exportLocalsStyle) {
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
}

function getImports(messages, importUrlPrefix, loaderContext, callback) {
  const imports = [];

  // Helper for ensuring valid CSS strings from requires
  let hasUrlEscapeHelper = false;

  messages.forEach((message) => {
    if (message.type === 'import') {
      const { url } = message.item;
      const media = message.item.media || '';

      if (!isUrlRequest(url)) {
        imports.push(
          `exports.push([module.id, ${JSON.stringify(
            `@import url(${url});`
          )}, ${JSON.stringify(media)}]);`
        );
      } else {
        const importUrl = importUrlPrefix + urlToRequest(url);

        imports.push(
          `exports.i(require(${stringifyRequest(
            loaderContext,
            importUrl
          )}), ${JSON.stringify(media)});`
        );
      }
    }

    if (message.type === 'url') {
      if (!hasUrlEscapeHelper) {
        imports.push(
          `var urlEscape = require(${stringifyRequest(
            loaderContext,
            require.resolve('./runtime/url-escape.js')
          )});`
        );

        hasUrlEscapeHelper = true;
      }

      const { url, placeholder, needQuotes } = message.item;
      // Remove `#hash` and `?#hash` from `require`
      const [normalizedUrl, singleQuery, hashValue] = url.split(/(\?)?#/);
      const hash =
        singleQuery || hashValue
          ? `"${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}"`
          : '';

      imports.push(
        `var ${placeholder} = urlEscape(require(${stringifyRequest(
          loaderContext,
          urlToRequest(normalizedUrl)
        )})${hash ? ` + ${hash}` : ''}${needQuotes ? ', true' : ''});`
      );
    }

    callback(message);
  });

  return imports;
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

export {
  getImportPrefix,
  getLocalIdent,
  placholderRegExps,
  getFilter,
  getImportItemReplacer,
  getExports,
  getImports,
  getModulesPlugins,
  normalizeSourceMap,
};
