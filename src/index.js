import path from 'path';
import OriginalSource from 'webpack-sources/lib/OriginalSource';
import RawSource from 'webpack-sources/lib/RawSource';
import ReplaceSource from 'webpack-sources/lib/ReplaceSource';
import SourceMapSource from 'webpack-sources/lib/SourceMapSource';
import loaderUtils from 'loader-utils';
import parse from './parse';

function toRelativeUrl(p, context) {
  const url = path.relative(context, p).replace(/\\/g, '/');
  if (/^\.\.?\//.test(url)) {
    return url;
  }
  return `./${url}`;
}

export default function loader(source, map) {
  const options = loaderUtils.getOptions(this) || {};
  const remainingRequest = loaderUtils.getRemainingRequest(this);
  const parseResult = parse(source);

  let replacer;
  if (options.sourceMap) {
    replacer = new ReplaceSource(
      map ? new SourceMapSource(source, remainingRequest, map) : new OriginalSource(source, remainingRequest),
      remainingRequest);
  } else {
    replacer = new ReplaceSource(new RawSource(source), remainingRequest);
  }

  // List of @imports with media queries
  const includedStylesheets = new Set();
  const includedStylesheetsMediaQuery = new Map();

  // Interate parsed @import
  parseResult.atImports.forEach((imp) => {
    if (loaderUtils.isUrlRequest(imp.url, options.root)) {
      const request = loaderUtils.urlToRequest(imp.url, options.root);
      replacer.replace(imp.start, imp.end, '');
      includedStylesheets.add(request);
      includedStylesheetsMediaQuery.set(request, imp.mediaQuery.join(' '));
    }
  });

  // Flag if column mappings make sense for this SourceMap
  // It only makes sense if we don't replace values from imported values
  let columns = true;

  // Mapping from css-identifier to import
  const importedNames = new Map();

  // Interate parsed :import
  parseResult.imports.forEach((imp) => {
    importedNames.set(imp.alias, imp);
  });

  // List of all declarates that should be emitted to the output
  const declarations = [];

  // Mapping from css-identifier to imported identifier
  const importReplacements = new Map();

  // Counter to generate unique ids for identifiers
  let id = 0;

  // Iterate all imported names and internal identifiers
  // Also make sure that :imports are imported like @imports
  for (const pair of importedNames) {
    const internalName = `cssLoaderImport${id}_${pair[1].importName}`;
    id += 1;
    importReplacements.set(pair[0], internalName);
    declarations.push(`import { ${pair[1].importName} as ${internalName} } from ${JSON.stringify(pair[1].from)};`);
    includedStylesheets.add(pair[1].from);
  }

  // Iterate all replacements and replace them with a maker token
  for (const pair of importReplacements) {
    const identifier = parseResult.identifiers.get(pair[0]);
    if (identifier) {
      columns = false;
      const offset = identifier.name.length - 1;
      identifier.locations.forEach((loc) => {
        replacer.replace(loc, loc + offset, `$CSS$LOADER$\{${pair[1]}}`);
      });
    }
  }

  // Delete all metablocks, they only contain meta information and are not valid css
  parseResult.metablocks.forEach((block) => {
    replacer.replace(block.start, block.end, '');
  });

  // Generate declarations for all imports
  const includedStylesheetsArray = [];
  for (const include of includedStylesheets) {
    const internalName = `cssLoaderImport${id}`;
    id += 1;
    declarations.push(`import ${internalName} from ${loaderUtils.stringifyRequest(this, include)};`);
    includedStylesheetsArray.push({
      name: internalName,
      mediaQuery: includedStylesheetsMediaQuery.get(include) || '',
    });
  }

  // Mapping from exported name to exported value as array (will be joined by spaces)
  const exportedNames = new Map();

  // Iterate parsed exports
  parseResult.exports.forEach((exp) => {
    // Note this elimiate duplicates, only last exported value is valid
    exportedNames.set(exp.name, exp.value);
  });

  for (const pair of exportedNames) {
    const [name, value] = pair;
    const processedValues = value.map((item) => {
      const replacement = importReplacements.get(item);
      if (replacement) {
        return {
          name: replacement,
        };
      }
      return item;
    }).reduce((arr, item) => {
      if (typeof item === 'string' && arr.length > 0 && typeof arr[arr.length - 1] === 'string') {
        arr[arr.length - 1] += item; // eslint-disable-line no-param-reassign
        return arr;
      }
      arr.push(item);
      return arr;
    }, []);
    if (processedValues.length === 1 && typeof processedValues[0] !== 'string') {
      declarations.push(`export { ${processedValues[0].name} as ${name} };`);
    } else {
      const valuesJs = processedValues.map((item) => {
        if (typeof item === 'string') {
          return JSON.stringify(item);
        }
        return item.name;
      }).join(' + ');
      declarations.push(`export var ${name} = ${valuesJs};`);
    }
  }

  let css;
  let sourceMap;
  if (options.sourceMap) {
    const sourceAndMap = replacer.sourceAndMap(typeof options.sourceMap === 'object' ? options.sourceMap : {
      columns,
    });
    css = sourceAndMap.source;
    sourceMap = sourceAndMap.map;
    if (options.sourceMapContext) {
      sourceMap.sources = sourceMap.sources.map(absPath => toRelativeUrl(absPath, options.sourceMapContext));
    }
    if (options.sourceMapPrefix) {
      sourceMap.sources = sourceMap.sources.map(sourcePath => options.sourceMapPrefix + sourcePath);
    } else {
      sourceMap.sources = sourceMap.sources.map(sourcePath => `webpack-css:///${sourcePath}`);
    }
  } else {
    css = replacer.source();
    sourceMap = null;
  }

  const cssJs = JSON.stringify(css).replace(/\$CSS\$LOADER\$\{([^}]+)\}/g, (match, identifer) => `" + ${identifer} + "`);

  return [
    '// css runtime',
    `import * as runtime from ${loaderUtils.stringifyRequest(this, require.resolve('../runtime'))};`,
    declarations.join('\n'),
    '',
    '// CSS',
    'export default /*#__PURE__*/runtime.create([',
  ].concat(
    includedStylesheetsArray.map((include) => {
      if (!include.mediaQuery) return `  ${include.name},`;
      return `  runtime.importStylesheet(${include.name}, ${JSON.stringify(include.mediaQuery)}),`;
    }),
  ).concat([
    `  runtime.${sourceMap ? 'moduleWithSourceMap' : 'moduleWithoutSourceMap'}(module.id, ${cssJs}${sourceMap ? `, ${JSON.stringify(sourceMap)}` : ''})`,
    ']);',
  ]).join('\n');
}
