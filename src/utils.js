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
  const request = normalizePath(
    path.relative(options.context, loaderContext.resourcePath)
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

  return decodeURIComponent(unescape(normalizedUrl));
}

function requestify(url, rootContext) {
  return mayBeServerRelativeUrl(url)
    ? urlToRequest(url, rootContext)
    : urlToRequest(url);
}

function getFilter(filter, resourcePath) {
  return (item) => {
    if (typeof filter === 'function') {
      return filter(item, resourcePath);
    }

    return true;
  };
}

const moduleRegExp = /\.module\.\w+$/i;

function getModulesOptions(rawOptions, loaderContext) {
  const { resourcePath } = loaderContext;

  if (typeof rawOptions.modules === 'undefined') {
    const isModules = moduleRegExp.test(resourcePath);

    if (!isModules) {
      return false;
    }
  } else if (
    typeof rawOptions.modules === 'boolean' &&
    rawOptions.modules === false
  ) {
    return false;
  }

  let modulesOptions = {
    auto: true,
    mode: 'local',
    exportGlobals: false,
    localIdentName: '[hash:base64]',
    localIdentContext: loaderContext.rootContext,
    localIdentHashPrefix: '',
    // eslint-disable-next-line no-undefined
    localIdentRegExp: undefined,
    getLocalIdent,
    localsConvention: 'asIs',
    namedExport: false,
    exportOnlyLocals: false,
  };

  if (
    typeof rawOptions.modules === 'boolean' ||
    typeof rawOptions.modules === 'string'
  ) {
    modulesOptions.mode =
      typeof rawOptions.modules === 'string' ? rawOptions.modules : 'local';
  } else {
    if (rawOptions.modules) {
      if (typeof rawOptions.modules.auto === 'boolean') {
        const isModules =
          rawOptions.modules.auto && moduleRegExp.test(resourcePath);

        if (!isModules) {
          return false;
        }
      } else if (rawOptions.modules.auto instanceof RegExp) {
        const isModules = rawOptions.modules.auto.test(resourcePath);

        if (!isModules) {
          return false;
        }
      } else if (typeof rawOptions.modules.auto === 'function') {
        const isModule = rawOptions.modules.auto(resourcePath);

        if (!isModule) {
          return false;
        }
      }
    }

    modulesOptions = { ...modulesOptions, ...(rawOptions.modules || {}) };
  }

  if (typeof modulesOptions.mode === 'function') {
    modulesOptions.mode = modulesOptions.mode(loaderContext.resourcePath);
  }

  if (modulesOptions.namedExport === true && rawOptions.esModule === false) {
    loaderContext.emitError(
      new Error(
        '`Options.module.namedExport` cannot be used without `options.esModule`'
      )
    );
  }

  return modulesOptions;
}

function normalizeOptions(rawOptions, loaderContext) {
  return {
    url: typeof rawOptions.url === 'undefined' ? true : rawOptions.url,
    import: typeof rawOptions.import === 'undefined' ? true : rawOptions.import,
    modules: getModulesOptions(rawOptions, loaderContext),
    sourceMap:
      typeof rawOptions.sourceMap === 'boolean'
        ? rawOptions.sourceMap
        : loaderContext.sourceMap,
    importLoaders: rawOptions.importLoaders,
    esModule:
      typeof rawOptions.esModule === 'undefined' ? true : rawOptions.esModule,
  };
}

function shouldUseImportPlugin(options) {
  if (options.modules.exportOnlyLocals) {
    return false;
  }

  if (typeof options.import === 'boolean') {
    return options.import;
  }

  return true;
}

function shouldUseURLPlugin(options) {
  if (options.modules.exportOnlyLocals) {
    return false;
  }

  if (typeof options.url === 'boolean') {
    return options.url;
  }

  return true;
}

function shouldUseModulesPlugins(options) {
  return Boolean(options.modules);
}

function getModulesPlugins(options, loaderContext) {
  let plugins = [];

  try {
    plugins = [
      modulesValues,
      localByDefault({ mode: options.modules.mode }),
      extractImports(),
      modulesScope({
        generateScopedName: function generateScopedName(exportName) {
          let localIdent;

          if (options.modules.getLocalIdent) {
            localIdent = options.modules.getLocalIdent(
              loaderContext,
              options.modules.localIdentName,
              exportName,
              {
                context: options.modules.localIdentContext,
                hashPrefix: options.modules.localIdentHashPrefix,
                regExp: options.modules.localIdentRegExp,
              }
            );
          }

          if (!localIdent) {
            localIdent = getLocalIdent(
              loaderContext,
              options.modules.localIdentName,
              exportName,
              {
                context: options.modules.localIdentContext,
                hashPrefix: options.modules.localIdentHashPrefix,
                regExp: options.modules.localIdentRegExp,
              }
            );
          }

          return localIdent;
        },
        exportGlobals: options.modules.exportGlobals,
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

function getImportCode(loaderContext, imports, options) {
  let code = '';

  if (options.modules.exportOnlyLocals !== true) {
    const apiUrl = stringifyRequest(
      loaderContext,
      require.resolve('./runtime/api')
    );

    code += options.esModule
      ? `import ___CSS_LOADER_API_IMPORT___ from ${apiUrl};\n`
      : `var ___CSS_LOADER_API_IMPORT___ = require(${apiUrl});\n`;
  }

  for (const item of imports) {
    const { importName, url, icss } = item;

    code += options.esModule
      ? icss && options.modules.namedExport
        ? `import ${importName}, * as ${importName}_NAMED___ from ${url};\n`
        : `import ${importName} from ${url};\n`
      : `var ${importName} = require(${url});\n`;
  }

  return code ? `// Imports\n${code}` : '';
}

function getModuleCode(
  result,
  apiImports,
  urlReplacements,
  icssReplacements,
  options
) {
  if (options.modules.exportOnlyLocals === true) {
    return 'var ___CSS_LOADER_EXPORT___ = {};\n';
  }

  const { css, map } = result;
  const sourceMapValue = options.sourceMap && map ? `,${map}` : '';
  let code = JSON.stringify(css);
  let beforeCode = `var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(${options.sourceMap});\n`;

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
      options.modules.namedExport
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

function getExportCode(exports, icssReplacements, options) {
  let code = '';
  let localsCode = '';
  let namedCode = '';

  const addExportToLocalsCode = (name, value) => {
    if (localsCode) {
      localsCode += `,\n`;
    }

    localsCode += `\t${JSON.stringify(name)}: ${JSON.stringify(value)}`;

    if (options.modules.namedExport) {
      namedCode += `export const ${camelCase(name)} = ${JSON.stringify(
        value
      )};\n`;
    }
  };

  for (const { name, value } of exports) {
    switch (options.modules.localsConvention) {
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

    if (options.modules.namedExport) {
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
    options.esModule ? 'export default' : 'module.exports ='
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
  if (matchNativeWin32Path.test(url)) {
    return false;
  }

  if (mayBeServerRelativeUrl(url)) {
    return true;
  }

  return isUrlRequest(url);
}

function sortImports(a, b) {
  return (
    (b.order < a.order) - (a.order < b.order) ||
    (b.index < a.index) - (a.index < b.index)
  );
}

export {
  normalizeOptions,
  shouldUseModulesPlugins,
  shouldUseImportPlugin,
  shouldUseURLPlugin,
  normalizeUrl,
  requestify,
  getFilter,
  getModulesOptions,
  getModulesPlugins,
  normalizeSourceMap,
  getPreRequester,
  getImportCode,
  getModuleCode,
  getExportCode,
  resolveRequests,
  isUrlRequestable,
  sortImports,
};
