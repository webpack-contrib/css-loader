/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import path from 'path';

import {
  stringifyRequest,
  urlToRequest,
  interpolateName,
  isUrlRequest,
} from 'loader-utils';
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
const matchNativeWin32Path = /^[A-Z]:[/\\]|^\\\\/i;

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

function normalizeUrl(url, isStringValue, rootContext) {
  let normalizedUrl = url;

  if (isStringValue && /\\[\n]/.test(normalizedUrl)) {
    normalizedUrl = normalizedUrl.replace(/\\[\n]/g, '');
  }

  if (matchNativeWin32Path.test(normalizedUrl)) {
    return normalizedUrl;
  }

  return mayBeServerRelativeUrl(normalizedUrl)
    ? urlToRequest(decodeURIComponent(unescape(normalizedUrl)), rootContext)
    : urlToRequest(decodeURIComponent(unescape(normalizedUrl)));
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

function shouldUseModulesPlugins(modules, resourcePath) {
  if (typeof modules === 'undefined') {
    return false;
  }

  if (typeof modules === 'boolean') {
    return modules;
  }

  if (typeof modules === 'string') {
    return true;
  }

  if (typeof modules.auto === 'boolean') {
    return modules.auto ? /\.module\.\w+$/i.test(resourcePath) : false;
  }

  if (modules.auto instanceof RegExp) {
    return modules.auto.test(resourcePath);
  }

  if (typeof modules.auto === 'function') {
    return modules.auto(resourcePath);
  }

  return true;
}

function getModulesOptions(options, loaderContext) {
  let modulesOptions = {
    mode: 'local',
    localIdentName: '[hash:base64]',
    // eslint-disable-next-line no-undefined
    localIdentRegExp: undefined,
    localsConvention: 'asIs',
    getLocalIdent,
    hashPrefix: '',
    exportGlobals: false,
  };

  if (
    typeof options.modules === 'boolean' ||
    typeof options.modules === 'string'
  ) {
    modulesOptions.mode =
      typeof options.modules === 'string' ? options.modules : 'local';
  } else {
    modulesOptions = { ...modulesOptions, ...options.modules };
  }

  if (typeof modulesOptions.mode === 'function') {
    modulesOptions.mode = modulesOptions.mode(loaderContext.resourcePath);
  }

  return modulesOptions;
}

function getModulesPlugins(modulesOptions, loaderContext) {
  let plugins = [];

  try {
    plugins = [
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
        exportGlobals: modulesOptions.exportGlobals,
      }),
    ];
  } catch (error) {
    loaderContext.emitError(error);
  }

  return plugins;
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

function getPreRequester({ loaders, loaderIndex }) {
  const cache = Object.create(null);

  return (number) => {
    if (cache[number]) {
      return cache[number];
    }

    if (number === false) {
      cache[number] = '';
    } else {
      const loadersRequest = loaders
        .slice(
          loaderIndex,
          loaderIndex + 1 + (typeof number !== 'number' ? 0 : number)
        )
        .map((x) => x.request)
        .join('!');

      cache[number] = `-!${loadersRequest}!`;
    }

    return cache[number];
  };
}

function getImportCode(
  loaderContext,
  exportType,
  imports,
  esModule,
  namedExport
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
    const { importName, url, icss } = item;

    code += esModule
      ? icss && namedExport
        ? `import ${importName}, * as ${importName}_NAMED___ from ${url};\n`
        : `import ${importName} from ${url};\n`
      : `var ${importName} = require(${url});\n`;
  }

  return code ? `// Imports\n${code}` : '';
}

function getModuleCode(
  result,
  exportType,
  sourceMap,
  apiImports,
  urlReplacements,
  icssReplacements,
  esModule,
  namedExport
) {
  if (exportType !== 'full') {
    return 'var ___CSS_LOADER_EXPORT___ = {};\n';
  }

  const { css, map } = result;
  const sourceMapValue = sourceMap && map ? `,${map}` : '';

  let code = JSON.stringify(css);
  let beforeCode = '';

  beforeCode += esModule
    ? `var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(${sourceMap});\n`
    : `___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(${sourceMap});\n`;

  for (const item of apiImports) {
    const { type, media, dedupe } = item;

    beforeCode +=
      type === 'internal'
        ? `___CSS_LOADER_EXPORT___.i(${item.importName}${
            media ? `, ${JSON.stringify(media)}` : dedupe ? ', ""' : ''
          }${dedupe ? ', true' : ''});\n`
        : `___CSS_LOADER_EXPORT___.push([module.id, ${JSON.stringify(
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

    code = code.replace(new RegExp(replacementName, 'g'), () =>
      namedExport
        ? `" + ${importName}_NAMED___[${JSON.stringify(
            camelCase(localName)
          )}] + "`
        : `" + ${importName}.locals[${JSON.stringify(localName)}] + "`
    );
  }

  return `${beforeCode}// Module\n___CSS_LOADER_EXPORT___.push([module.id, ${code}, ""${sourceMapValue}]);\n`;
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function getExportCode(
  exports,
  exportType,
  icssReplacements,
  esModule,
  modulesOptions,
  namedExport
) {
  let code = '';
  let localsCode = '';
  let namedCode = '';

  const addExportToLocalsCode = (name, value) => {
    if (localsCode) {
      localsCode += `,\n`;
    }

    localsCode += `\t${JSON.stringify(name)}: ${JSON.stringify(value)}`;

    if (namedExport) {
      namedCode += `export const ${name} = ${JSON.stringify(value)};\n`;
    }
  };

  for (const { name, value } of exports) {
    switch (modulesOptions.localsConvention) {
      case 'camelCase': {
        addExportToLocalsCode(name, value);

        const modifiedName = camelCase(name);

        if (modifiedName !== name) {
          addExportToLocalsCode(modifiedName, value);
        }
        break;
      }
      case 'camelCaseOnly': {
        addExportToLocalsCode(camelCase(name), value);
        break;
      }
      case 'dashes': {
        addExportToLocalsCode(name, value);

        const modifiedName = dashesCamelCase(name);

        if (modifiedName !== name) {
          addExportToLocalsCode(modifiedName, value);
        }
        break;
      }
      case 'dashesOnly': {
        addExportToLocalsCode(dashesCamelCase(name), value);
        break;
      }
      case 'asIs':
      default:
        addExportToLocalsCode(name, value);
        break;
    }
  }

  for (const replacement of icssReplacements) {
    const { replacementName, importName, localName } = replacement;

    localsCode = localsCode.replace(
      new RegExp(replacementName, 'g'),
      () => `" + ${importName}.locals[${JSON.stringify(localName)}] + "`
    );

    if (namedExport) {
      namedCode = namedCode.replace(
        new RegExp(replacementName, 'g'),
        () =>
          `" + ${importName}_NAMED___[${JSON.stringify(
            camelCase(localName)
          )}] + "`
      );
    }
  }

  if (localsCode) {
    code += namedCode
      ? `${namedCode}\n`
      : `___CSS_LOADER_EXPORT___.locals = {\n${localsCode}\n};\n`;
  }

  code += `${
    esModule ? 'export default' : 'module.exports ='
  } ___CSS_LOADER_EXPORT___;\n`;

  return `// Exports\n${code}`;
}

async function resolveRequests(resolve, context, possibleRequests) {
  return resolve(context, possibleRequests[0])
    .then((result) => {
      return result;
    })
    .catch((error) => {
      const [, ...tailPossibleRequests] = possibleRequests;

      if (tailPossibleRequests.length === 0) {
        throw error;
      }

      return resolveRequests(resolve, context, tailPossibleRequests);
    });
}

/*
 * May be url is server-relative url, but not //example.com
 * */
function mayBeServerRelativeUrl(url) {
  if (url.charAt(0) === '/' && !/^\/\//.test(url)) {
    return true;
  }

  return false;
}

function isUrlRequestable(url) {
  if (mayBeServerRelativeUrl(url)) {
    return true;
  }

  return isUrlRequest(url);
}

export {
  normalizeUrl,
  getFilter,
  getModulesOptions,
  getModulesPlugins,
  normalizeSourceMap,
  getPreRequester,
  getImportCode,
  getModuleCode,
  getExportCode,
  shouldUseModulesPlugins,
  resolveRequests,
  isUrlRequestable,
};
