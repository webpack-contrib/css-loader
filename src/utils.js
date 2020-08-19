/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import { fileURLToPath } from 'url';
import path from 'path';

import { urlToRequest, interpolateName } from 'loader-utils';
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
const filenameReservedRegex = /[<>:"/\\|?*]/g;
// eslint-disable-next-line no-control-regex
const reControlChars = /[\u0000-\u001f\u0080-\u009f]/g;

function defaultGetLocalIdent(
  loaderContext,
  localIdentName,
  localName,
  options
) {
  const { context, hashPrefix } = options;
  const { resourcePath } = loaderContext;
  const request = normalizePath(path.relative(context, resourcePath));

  // eslint-disable-next-line no-param-reassign
  options.content = `${hashPrefix + request}\x00${unescape(localName)}`;

  // Using `[path]` placeholder outputs `/` we need escape their
  // Also directories can contains invalid characters for css we need escape their too
  return cssesc(
    interpolateName(loaderContext, localIdentName, options)
      // For `[hash]` placeholder
      .replace(/^((-?[0-9])|--)/, '_$1')
      .replace(filenameReservedRegex, '-')
      .replace(reControlChars, '-')
      .replace(/\./g, '-'),
    { isIdentifier: true }
  ).replace(/\\\[local\\]/gi, localName);
}

function normalizeUrl(url, isStringValue) {
  let normalizedUrl = url;

  if (isStringValue && /\\[\n]/.test(normalizedUrl)) {
    normalizedUrl = normalizedUrl.replace(/\\[\n]/g, '');
  }

  if (matchNativeWin32Path.test(url)) {
    return decodeURIComponent(normalizedUrl);
  }

  return decodeURIComponent(unescape(normalizedUrl));
}

function requestify(url, rootContext) {
  if (/^file:/i.test(url)) {
    return fileURLToPath(url);
  }

  return url.charAt(0) === '/'
    ? urlToRequest(url, rootContext)
    : urlToRequest(url);
}

function getFilter(filter, resourcePath) {
  return (...args) => {
    if (typeof filter === 'function') {
      return filter(...args, resourcePath);
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
    compileType: rawOptions.icss ? 'icss' : 'module',
    auto: true,
    mode: 'local',
    exportGlobals: false,
    localIdentName: '[hash:base64]',
    localIdentContext: loaderContext.rootContext,
    localIdentHashPrefix: '',
    // eslint-disable-next-line no-undefined
    localIdentRegExp: undefined,
    getLocalIdent: defaultGetLocalIdent,
    namedExport: false,
    exportLocalsConvention: 'asIs',
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

      if (
        rawOptions.modules.namedExport === true &&
        typeof rawOptions.modules.exportLocalsConvention === 'undefined'
      ) {
        modulesOptions.exportLocalsConvention = 'camelCaseOnly';
      }
    }

    modulesOptions = { ...modulesOptions, ...(rawOptions.modules || {}) };
  }

  if (typeof modulesOptions.mode === 'function') {
    modulesOptions.mode = modulesOptions.mode(loaderContext.resourcePath);
  }

  if (modulesOptions.namedExport === true) {
    if (rawOptions.esModule === false) {
      throw new Error(
        'The "modules.namedExport" option requires the "esModules" option to be enabled'
      );
    }

    if (modulesOptions.exportLocalsConvention !== 'camelCaseOnly') {
      throw new Error(
        'The "modules.namedExport" option requires the "modules.exportLocalsConvention" option to be "camelCaseOnly"'
      );
    }
  }

  return modulesOptions;
}

function normalizeOptions(rawOptions, loaderContext) {
  if (rawOptions.icss) {
    loaderContext.emitWarning(
      new Error(
        'The "icss" option is deprecated, use "modules.compileType: "icss"" instead'
      )
    );
  }

  const modulesOptions = getModulesOptions(rawOptions, loaderContext);

  return {
    url: typeof rawOptions.url === 'undefined' ? true : rawOptions.url,
    import: typeof rawOptions.import === 'undefined' ? true : rawOptions.import,
    modules: modulesOptions,
    // TODO remove in the next major release
    icss: typeof rawOptions.icss === 'undefined' ? false : rawOptions.icss,
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
  return options.modules.compileType === 'module';
}

function shouldUseIcssPlugin(options) {
  return options.icss === true || Boolean(options.modules);
}

function getModulesPlugins(options, loaderContext) {
  const {
    mode,
    getLocalIdent,
    localIdentName,
    localIdentContext,
    localIdentHashPrefix,
    localIdentRegExp,
  } = options.modules;

  let plugins = [];

  try {
    plugins = [
      modulesValues,
      localByDefault({ mode }),
      extractImports(),
      modulesScope({
        generateScopedName(exportName) {
          return getLocalIdent(loaderContext, localIdentName, exportName, {
            context: localIdentContext,
            hashPrefix: localIdentHashPrefix,
            regExp: localIdentRegExp,
          });
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
    delete newMap.file;
  }

  const { sourceRoot } = newMap;

  if (newMap.sourceRoot) {
    delete newMap.sourceRoot;
  }

  if (newMap.sources) {
    newMap.sources = newMap.sources.map((source) => {
      return !sourceRoot
        ? normalizePath(source)
        : normalizePath(path.resolve(sourceRoot, source));
    });
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

function getImportCode(imports, options) {
  let code = '';

  for (const item of imports) {
    const { importName, url, icss } = item;

    if (options.esModule) {
      if (icss && options.modules.namedExport) {
        code += `import ${
          options.modules.exportOnlyLocals ? '' : `${importName}, `
        }* as ${importName}_NAMED___ from ${url};\n`;
      } else {
        code += `import ${importName} from ${url};\n`;
      }
    } else {
      code += `var ${importName} = require(${url});\n`;
    }
  }

  return code ? `// Imports\n${code}` : '';
}

function getSourceMapRelativePath(file, from) {
  if (file.indexOf('<') === 0) return file;
  if (/^\w+:\/\//.test(file)) return file;

  const result = path.relative(from, file);

  if (path.sep === '\\') {
    return result.replace(/\\/g, '/');
  }

  return result;
}

function getSourceMapContextifyPath(file, to, rootContext) {
  if (file.indexOf('<') === 0) return file;
  if (/^\w+:\/\//.test(file)) return file;

  if (typeof to === 'undefined') return file;

  const dirname = path.dirname(to);

  const result = path.resolve(dirname, file);

  let contextifyPath;

  if (path.sep === '\\') {
    contextifyPath = path.relative(rootContext, result).replace(/\\/g, '/');
  } else {
    contextifyPath = path.relative(rootContext, result);
  }

  return `webpack:///${contextifyPath}`;
}

function getModuleCode(result, api, replacements, options, to, rootContext) {
  if (options.modules.exportOnlyLocals === true) {
    return '';
  }

  const { css, map } = result;

  const sourceMap = map ? JSON.parse(map.toString()) : null;

  if (sourceMap) {
    if (typeof sourceMap.file !== 'undefined') {
      delete sourceMap.file;
    }

    sourceMap.sources = sourceMap.sources.map((src) =>
      getSourceMapContextifyPath(src, to, rootContext)
    );
  }

  const sourceMapValue =
    options.sourceMap && sourceMap ? `,${JSON.stringify(sourceMap)}` : '';
  let code = JSON.stringify(css);
  let beforeCode = `var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(${options.sourceMap});\n`;

  for (const item of api) {
    const { url, media, dedupe } = item;

    beforeCode += url
      ? `___CSS_LOADER_EXPORT___.push([module.id, ${JSON.stringify(
          `@import url(${url});`
        )}${media ? `, ${JSON.stringify(media)}` : ''}]);\n`
      : `___CSS_LOADER_EXPORT___.i(${item.importName}${
          media ? `, ${JSON.stringify(media)}` : dedupe ? ', ""' : ''
        }${dedupe ? ', true' : ''});\n`;
  }

  for (const item of replacements) {
    const { replacementName, importName, localName } = item;

    if (localName) {
      code = code.replace(new RegExp(replacementName, 'g'), () =>
        options.modules.namedExport
          ? `" + ${importName}_NAMED___[${JSON.stringify(
              camelCase(localName)
            )}] + "`
          : `" + ${importName}.locals[${JSON.stringify(localName)}] + "`
      );
    } else {
      const { hash, needQuotes } = item;
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
  }

  return `${beforeCode}// Module\n___CSS_LOADER_EXPORT___.push([module.id, ${code}, ""${sourceMapValue}]);\n`;
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function getExportCode(exports, replacements, options) {
  let code = '// Exports\n';
  let localsCode = '';

  const addExportToLocalsCode = (name, value) => {
    if (options.modules.namedExport) {
      localsCode += `export const ${camelCase(name)} = ${JSON.stringify(
        value
      )};\n`;
    } else {
      if (localsCode) {
        localsCode += `,\n`;
      }

      localsCode += `\t${JSON.stringify(name)}: ${JSON.stringify(value)}`;
    }
  };

  for (const { name, value } of exports) {
    switch (options.modules.exportLocalsConvention) {
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

  for (const item of replacements) {
    const { replacementName, localName } = item;

    if (localName) {
      const { importName } = item;

      localsCode = localsCode.replace(new RegExp(replacementName, 'g'), () => {
        if (options.modules.namedExport) {
          return `" + ${importName}_NAMED___[${JSON.stringify(
            camelCase(localName)
          )}] + "`;
        } else if (options.modules.exportOnlyLocals) {
          return `" + ${importName}[${JSON.stringify(localName)}] + "`;
        }

        return `" + ${importName}.locals[${JSON.stringify(localName)}] + "`;
      });
    } else {
      localsCode = localsCode.replace(
        new RegExp(replacementName, 'g'),
        () => `" + ${replacementName} + "`
      );
    }
  }

  if (options.modules.exportOnlyLocals) {
    code += options.modules.namedExport
      ? localsCode
      : `${
          options.esModule ? 'export default' : 'module.exports ='
        } {\n${localsCode}\n};\n`;

    return code;
  }

  if (localsCode) {
    code += options.modules.namedExport
      ? localsCode
      : `___CSS_LOADER_EXPORT___.locals = {\n${localsCode}\n};\n`;
  }

  code += `${
    options.esModule ? 'export default' : 'module.exports ='
  } ___CSS_LOADER_EXPORT___;\n`;

  return code;
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

function isUrlRequestable(url) {
  // Protocol-relative URLs
  if (/^\/\//.test(url)) {
    return false;
  }

  // `file:` protocol
  if (/^file:/i.test(url)) {
    return true;
  }

  // Absolute URLs
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !matchNativeWin32Path.test(url)) {
    return false;
  }

  // `#` URLs
  if (/^#/.test(url)) {
    return false;
  }

  return true;
}

function sort(a, b) {
  return a.index - b.index;
}

export {
  normalizeOptions,
  shouldUseModulesPlugins,
  shouldUseImportPlugin,
  shouldUseURLPlugin,
  shouldUseIcssPlugin,
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
  sort,
  getSourceMapRelativePath,
};
