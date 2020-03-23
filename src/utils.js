/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import path from 'path';

import { stringifyRequest, urlToRequest, interpolateName } from 'loader-utils';
import normalizePath from 'normalize-path';
import cssesc from 'cssesc';
import modulesValues from 'postcss-modules-values';
import localByDefault from 'postcss-modules-local-by-default';
import extractImports from 'postcss-modules-extract-imports';
import modulesScope from 'postcss-modules-scope';
import camelCase from 'camelcase';

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
    interpolateName(loaderContext, localIdentName, options)
      // For `[hash]` placeholder
      .replace(/^((-?[0-9])|--)/, '_$1')
      .replace(filenameReservedRegex, '-')
      .replace(reControlChars, '-')
      .replace(reRelativePath, '-')
      .replace(/\./g, '-'),
    { isIdentifier: true }
  ).replace(/\\\[local\\\]/gi, localName);
}

function normalizeUrl(url, isStringValue) {
  let normalizedUrl = url;

  if (isStringValue && /\\[\n]/.test(normalizedUrl)) {
    normalizedUrl = normalizedUrl.replace(/\\[\n]/g, '');
  }

  return urlToRequest(decodeURIComponent(unescape(normalizedUrl)));
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
    newMap = JSON.parse(newMap);
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

function getImportCode(
  loaderContext,
  imports,
  exportType,
  importLoaders,
  esModule
) {
  let code = '';

  if (exportType === 'full') {
    const apiUrl = stringifyRequest(
      loaderContext,
      require.resolve('./runtime/api')
    );

    code += esModule
      ? `import ___CSS_LOADER_API_IMPORT___ from ${apiUrl};\n`
      : `var ___CSS_LOADER_API_IMPORT___ = require(${apiUrl});\n`;
  }

  for (const item of imports) {
    const { importName, url } = item;
    const importUrl = stringifyRequest(
      loaderContext,
      item.type !== 'url'
        ? getImportPrefix(loaderContext, importLoaders) + url
        : url
    );

    code += esModule
      ? `import ${importName} from ${importUrl};\n`
      : `var ${importName} = require(${importUrl});\n`;
  }

  return code ? `// Imports\n${code}` : '';
}

function getModuleCode(
  result,
  exportType,
  esModule,
  sourceMap,
  apiImports,
  urlReplacements,
  icssReplacements
) {
  if (exportType !== 'full') {
    return '';
  }

  const { css, map } = result;
  const sourceMapValue = sourceMap && map ? `,${map}` : '';

  let code = JSON.stringify(css);
  let beforeCode = '';

  beforeCode += esModule
    ? `var exports = ___CSS_LOADER_API_IMPORT___(${sourceMap});\n`
    : `exports = ___CSS_LOADER_API_IMPORT___(${sourceMap});\n`;

  for (const item of apiImports) {
    const { type, media, dedupe } = item;

    beforeCode +=
      type === 'internal'
        ? `exports.i(${item.importName}${
            media ? `, ${JSON.stringify(media)}` : dedupe ? ', ""' : ''
          }${dedupe ? ', true' : ''});\n`
        : `exports.push([module.id, ${JSON.stringify(
            `@import url(${item.url});`
          )}${media ? `, ${JSON.stringify(media)}` : ''}]);\n`;
  }

  for (const item of urlReplacements) {
    const { replacementName, importName, hash, needQuotes } = item;

    const getUrlOptions = []
      .concat(hash ? [`hash: ${JSON.stringify(hash)}`] : [])
      .concat(needQuotes ? 'needQuotes: true' : []);
    const preparedOptions =
      getUrlOptions.length > 0 ? `, { ${getUrlOptions.join(', ')} }` : '';

    beforeCode += `var ${replacementName} = ___CSS_LOADER_GET_URL_IMPORT___(${importName}${preparedOptions});\n`;

    code = code.replace(
      new RegExp(replacementName, 'g'),
      () => `" + ${replacementName} + "`
    );
  }

  for (const replacement of icssReplacements) {
    const { replacementName, importName, localName } = replacement;

    code = code.replace(
      new RegExp(replacementName, 'g'),
      () => `" + ${importName}.locals[${JSON.stringify(localName)}] + "`
    );
  }

  return `${beforeCode}// Module\nexports.push([module.id, ${code}, ""${sourceMapValue}]);\n`;
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function getExportCode(
  exports,
  exportType,
  localsConvention,
  icssReplacements,
  esModule
) {
  let code = '';
  let localsCode = '';

  const addExportToLocalsCode = (name, value, index) => {
    const isLastItem = index === exports.length - 1;

    localsCode += `\t${JSON.stringify(name)}: ${JSON.stringify(value)}${
      isLastItem ? '' : ',\n'
    }`;
  };

  for (const [index, item] of exports.entries()) {
    const { name, value } = item;

    switch (localsConvention) {
      case 'camelCase': {
        addExportToLocalsCode(name, value, index);

        const modifiedName = camelCase(name);

        if (modifiedName !== name) {
          addExportToLocalsCode(modifiedName, value, index);
        }
        break;
      }
      case 'camelCaseOnly': {
        addExportToLocalsCode(camelCase(name), value, index);
        break;
      }
      case 'dashes': {
        addExportToLocalsCode(name, value);

        const modifiedName = dashesCamelCase(name, index);

        if (modifiedName !== name) {
          addExportToLocalsCode(modifiedName, value, index);
        }
        break;
      }
      case 'dashesOnly': {
        addExportToLocalsCode(dashesCamelCase(name), value, index);
        break;
      }
      case 'asIs':
      default:
        addExportToLocalsCode(name, value, index);
        break;
    }
  }

  for (const replacement of icssReplacements) {
    const { replacementName, importName, localName } = replacement;

    localsCode = localsCode.replace(new RegExp(replacementName, 'g'), () =>
      exportType === 'locals'
        ? `" + ${importName}[${JSON.stringify(localName)}] + "`
        : `" + ${importName}.locals[${JSON.stringify(localName)}] + "`
    );
  }

  if (exportType === 'locals') {
    code += `${esModule ? 'export default' : 'module.exports ='} ${
      localsCode ? `{\n${localsCode}\n}` : '{}'
    };\n`;
  } else {
    if (localsCode) {
      code += `exports.locals = {\n${localsCode}\n};\n`;
    }

    code += `${esModule ? 'export default' : 'module.exports ='} exports;\n`;
  }

  return `// Exports\n${code}`;
}

export {
  normalizeUrl,
  getFilter,
  getModulesPlugins,
  normalizeSourceMap,
  getImportCode,
  getModuleCode,
  getExportCode,
};
