import OriginalSource from 'webpack-sources/lib/OriginalSource';
import RawSource from 'webpack-sources/lib/RawSource';
import ReplaceSource from 'webpack-sources/lib/ReplaceSource';
import SourceMapSource from 'webpack-sources/lib/SourceMapSource';
import loaderUtils from 'loader-utils';
import parse from './parse';

export default function loader(source, map) {
  const options = loaderUtils.getOptions(this) || {};
  const remainingRequest = loaderUtils.getRemainingRequest(this);
  const parseResult = parse(source);

  let replacer;
  if(options.sourceMap) {
    replacer = new ReplaceSource(
      map ? new SourceMapSource(source, remainingRequest, map) : new OriginalSource(source, remainingRequest),
      remainingRequest);
  } else {
    replacer = new ReplaceSource(new RawSource(source), remainingRequest);
  }

  const includedStylesheets = new Set();
  const includedStylesheetsMediaQuery = new Map();

  parseResult.atImports.forEach((imp) => {
    if(loaderUtils.isUrlRequest(imp.url, options.root)) {
      const request = loaderUtils.urlToRequest(imp.url, options.root);
      replacer.replace(imp.start, imp.end, '');
      includedStylesheets.add(request);
      includedStylesheetsMediaQuery.set(request, imp.mediaQuery.join(' '));
    }
  });

  let columns = true;
  const importedNames = new Map();

  parseResult.imports.forEach((imp) => {
    importedNames.set(imp.alias, imp);
  });

  const declarations = [];
  const importReplacements = new Map();

  let id = 0;
  for(const pair of importedNames) {
    const internalName = `cssLoaderImport${id}_${pair[1].importName}`;
    id += 1;
    importReplacements.set(pair[0], internalName);
    declarations.push(`import { ${pair[1].importName} as ${internalName} } from ${JSON.stringify(pair[1].from)};`);
    includedStylesheets.add(pair[1].from);
  }

  for(const pair of importReplacements) {
    const identifier = parseResult.identifiers.get(pair[0]);
    if(identifier) {
      columns = false;
      const length = identifier.name.length;
      identifier.locations.forEach((loc) => {
        replacer.replace(loc, loc + length - 1, `$CSS$LOADER$\{${pair[1]}}`);
      });
    }
  }

  parseResult.metablocks.forEach((block) => {
    replacer.replace(block.start, block.end, '');
  });

  const includedStylesheetsArray = [];
  for(const include of includedStylesheets) {
    const internalName = `cssLoaderImport${id}`;
    id += 1;
    declarations.push(`import ${internalName} from ${loaderUtils.stringifyRequest(this, include)};`);
    includedStylesheetsArray.push({
      name: internalName,
      mediaQuery: includedStylesheetsMediaQuery.get(include) || ''
    });
  }

  let css;
  let sourceMap;
  if(options.sourceMap) {
    const sourceAndMap = replacer.sourceAndMap(typeof options.sourceMap === 'object' ? options.sourceMap : {
      columns: columns
    });
    css = sourceAndMap.code;
    sourceMap = sourceAndMap.map;
  } else {
    css = replacer.source();
    sourceMap = null;
  }

  const cssJs = JSON.stringify(css).replace(/\$CSS\$LOADER\$\{([^}]+)\}/g, (match, identifer) => `" + ${identifer} + "`);

  return [
    '// css runtime',
    `import * as runtime from ${loaderUtils.stringifyRequest(this, require.resolve("../runtime"))};`,
    '',
    '// declarations',
    declarations.join('\n'),
    '',
    '// CSS',
    'export default runtime.create([',
  ].concat(
    includedStylesheetsArray.map((include) => {
      if(!include.mediaQuery) return `  ${include.name},`;
      return `  runtime.importStylesheet(${include.name}, ${JSON.stringify(include.mediaQuery)},`;
    })
  ).concat([
    sourceMap ?
    `  runtime.moduleWithSourceMap(module.id, ${cssJs}, ${sourceMap})` :
    `  runtime.moduleWithoutSourceMap(module.id, ${cssJs})`,
    ']);'
  ]).join('\n');
}
