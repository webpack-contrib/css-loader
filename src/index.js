/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
import validateOptions from 'schema-utils';
import postcss from 'postcss';
import postcssPkg from 'postcss/package.json';

import {
  getOptions,
  isUrlRequest,
  getRemainingRequest,
  getCurrentRequest,
} from 'loader-utils';

import schema from './options.json';
import { importParser, icssParser, urlParser } from './plugins';
import {
  normalizeSourceMap,
  getModulesPlugins,
  getImportPrefix,
  getIcssItemReplacer,
  getFilter,
  getRuntimeCode,
  getImportCode,
  getModuleCode,
  getExportCode,
} from './utils';
import Warning from './Warning';
import CssSyntaxError from './CssSyntaxError';

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validateOptions(schema, options, 'CSS Loader');

  const callback = this.async();
  const sourceMap = options.sourceMap || false;

  if (sourceMap && map) {
    // eslint-disable-next-line no-param-reassign
    map = normalizeSourceMap(map);
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    // eslint-disable-next-line no-param-reassign
    map = null;
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (ast && ast.type === 'postcss' && ast.version === postcssPkg.version) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  const plugins = [];

  if (options.modules) {
    plugins.push(...getModulesPlugins(options, this));
  }

  plugins.push(icssParser());

  if (options.import !== false) {
    plugins.push(
      importParser({
        filter: getFilter(options.import, this.resourcePath),
      })
    );
  }

  if (options.url !== false) {
    plugins.push(
      urlParser({
        filter: getFilter(options.url, this.resourcePath, (value) =>
          isUrlRequest(value)
        ),
      })
    );
  }

  postcss(plugins)
    .process(content, {
      from: getRemainingRequest(this)
        .split('!')
        .pop(),
      to: getCurrentRequest(this)
        .split('!')
        .pop(),
      map: options.sourceMap
        ? {
            prev: map,
            inline: false,
            annotation: false,
          }
        : null,
    })
    .then((result) => {
      result
        .warnings()
        .forEach((warning) => this.emitWarning(new Warning(warning)));

      if (!result.messages) {
        // eslint-disable-next-line no-param-reassign
        result.messages = [];
      }

      const {
        exportOnlyLocals: onlyLocals,
        exportLocalsStyle: localsStyle,
      } = options;
      // Run other loader (`postcss-loader`, `sass-loader` and etc) for importing CSS
      const importPrefix = getImportPrefix(this, options.importLoaders);
      // Prepare replacer to change from `___CSS_LOADER_IMPORT___INDEX___` to `require('./file.css').locals`
      const replacer = getIcssItemReplacer(
        result,
        this,
        importPrefix,
        onlyLocals
      );

      // eslint-disable-next-line no-param-reassign
      result.cssLoaderBuildInfo = {
        onlyLocals,
        localsStyle,
        importPrefix,
        replacer,
      };

      const runtimeCode = getRuntimeCode(result, this, sourceMap);
      const importCode = getImportCode(result, this);
      const moduleCode = getModuleCode(result);
      const exportsCode = getExportCode(result);

      return callback(
        null,
        runtimeCode + importCode + moduleCode + exportsCode
      );
    })
    .catch((error) => {
      callback(
        error.name === 'CssSyntaxError' ? new CssSyntaxError(error) : error
      );
    });
}
