/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

import postcss from "postcss";
import postcssPkg from "postcss/package.json";
import { satisfies } from "semver";

import CssSyntaxError from "./CssSyntaxError";
import Warning from "./Warning";
import schema from "./options.json";
import { icssParser, importParser, urlParser } from "./plugins";
import {
  normalizeOptions,
  shouldUseModulesPlugins,
  shouldUseImportPlugin,
  shouldUseURLPlugin,
  shouldUseIcssPlugin,
  getPreRequester,
  getExportCode,
  getFilter,
  getImportLoaders,
  getImportCode,
  getModuleCode,
  getModulesPlugins,
  normalizeSourceMap,
  sort,
  combineRequests,
  stringifyRequest,
} from "./utils";

export default async function loader(content, map, meta) {
  const rawOptions = this.getOptions(schema);
  const plugins = [];
  const callback = this.async();

  let options;

  try {
    options = normalizeOptions(rawOptions, this);
  } catch (error) {
    callback(error);

    return;
  }

  const replacements = [];
  const exports = [];

  if (shouldUseModulesPlugins(options)) {
    plugins.push(...getModulesPlugins(options, this));
  }

  const importPluginImports = [];
  const importPluginApi = [];

  if (shouldUseImportPlugin(options)) {
    const resolver = this.getResolve({
      conditionNames: ["style"],
      extensions: [".css"],
      mainFields: ["css", "style", "main", "..."],
      mainFiles: ["index", "..."],
    });

    plugins.push(
      importParser({
        imports: importPluginImports,
        api: importPluginApi,
        context: this.context,
        rootContext: this.rootContext,
        filter: getFilter(options.import.filter, this.resourcePath),
        resolver,
        urlHandler: (url) =>
          stringifyRequest(
            this,
            combineRequests(
              getPreRequester(this)(getImportLoaders(options.import.loaders)),
              url
            )
          ),
      })
    );
  }

  const urlPluginImports = [];

  if (shouldUseURLPlugin(options)) {
    const urlResolver = this.getResolve({
      conditionNames: ["asset"],
      mainFields: ["asset"],
      mainFiles: [],
      extensions: [],
    });

    plugins.push(
      urlParser({
        imports: urlPluginImports,
        replacements,
        context: this.context,
        rootContext: this.rootContext,
        filter: getFilter(options.url.filter, this.resourcePath),
        resolver: urlResolver,
        urlHandler: (url) => stringifyRequest(this, url),
      })
    );
  }

  const icssPluginImports = [];
  const icssPluginApi = [];

  const needToUseIcssPlugin = shouldUseIcssPlugin(options);

  if (needToUseIcssPlugin) {
    const icssResolver = this.getResolve({
      conditionNames: ["style"],
      extensions: [],
      mainFields: ["css", "style", "main", "..."],
      mainFiles: ["index", "..."],
    });

    plugins.push(
      icssParser({
        imports: icssPluginImports,
        api: icssPluginApi,
        replacements,
        exports,
        context: this.context,
        rootContext: this.rootContext,
        resolver: icssResolver,
        urlHandler: (url) =>
          stringifyRequest(
            this,
            combineRequests(
              getPreRequester(this)(getImportLoaders(options.import.loaders)),
              url
            )
          ),
      })
    );
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (
      ast &&
      ast.type === "postcss" &&
      satisfies(ast.version, `^${postcssPkg.version}`)
    ) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  const { resourcePath } = this;

  let result;

  try {
    result = await postcss(plugins).process(content, {
      hideNothingWarning: true,
      from: resourcePath,
      to: resourcePath,
      map: options.sourceMap
        ? {
            prev: map ? normalizeSourceMap(map, resourcePath) : null,
            inline: false,
            annotation: false,
          }
        : false,
    });
  } catch (error) {
    if (error.file) {
      this.addDependency(error.file);
    }

    callback(
      error.name === "CssSyntaxError" ? new CssSyntaxError(error) : error
    );

    return;
  }

  for (const warning of result.warnings()) {
    this.emitWarning(new Warning(warning));
  }

  const imports = []
    .concat(icssPluginImports.sort(sort))
    .concat(importPluginImports.sort(sort))
    .concat(urlPluginImports.sort(sort));
  const api = []
    .concat(importPluginApi.sort(sort))
    .concat(icssPluginApi.sort(sort));

  if (options.modules.exportOnlyLocals !== true) {
    imports.unshift({
      type: "api_import",
      importName: "___CSS_LOADER_API_IMPORT___",
      url: stringifyRequest(this, require.resolve("./runtime/api")),
    });

    if (options.sourceMap) {
      imports.unshift({
        type: "api_sourcemap_import",
        importName: "___CSS_LOADER_API_SOURCEMAP_IMPORT___",
        url: stringifyRequest(
          this,
          require.resolve("./runtime/cssWithMappingToString")
        ),
      });
    }
  }

  const importCode = getImportCode(imports, options);
  const moduleCode = getModuleCode(result, api, replacements, options, this);
  const exportCode = getExportCode(
    exports,
    replacements,
    needToUseIcssPlugin,
    options
  );

  callback(null, `${importCode}${moduleCode}${exportCode}`);
}
