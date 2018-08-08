/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/

import validate from 'schema-utils';
import {
  getOptions,
  getRemainingRequest,
  getCurrentRequest,
  stringifyRequest,
} from 'loader-utils';
import postcss from 'postcss';

import schema from './options.json';
import plugin from './plugin';
import SyntaxError from './SyntaxError';

let runtimeFile = require.resolve('./runtime');

try {
  // run test
  runtimeFile = require.resolve('../dist/runtime');
} catch (e) {} // eslint-disable-line no-empty

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validate(schema, options, 'CSS Loader');

  const cb = this.async();
  const { url, import: importOpt, sourceMap, importLoaders } = Object.assign(
    {},
    { url: true, import: true, sourceMap: false, importLoaders: 0 },
    options
  );

  let prevMap = map;

  if (sourceMap && prevMap) {
    if (typeof prevMap === 'string') {
      prevMap = JSON.parse(prevMap);
    }

    if (prevMap.sources) {
      prevMap.sources = prevMap.sources.map((source) =>
        source.replace(/\\/g, '/')
      );
      prevMap.sourceRoot = '';
    }
  } else {
    // Some loaders (example `"postcss-loader": "1.x.x"`) always generates source map, we should remove it
    prevMap = null;
  }

  let contentOrAst = content;

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (ast && ast.type === 'postcss') {
      contentOrAst = ast.root;
    }
  }

  const plugins = [
    plugin({
      loaderContext: this,
      url,
      import: importOpt,
      importLoaders,
    }),
  ];

  const postcssOptions = {
    // We need a prefix to avoid path rewriting of PostCSS
    from: `/css-loader!${getRemainingRequest(this)
      .split('!')
      .pop()}`,
    to: getCurrentRequest(this)
      .split('!')
      .pop(),
    map: sourceMap
      ? {
          prev: prevMap,
          sourcesContent: true,
          inline: false,
          annotation: false,
        }
      : null,
  };

  postcss(plugins)
    .process(contentOrAst, postcssOptions)
    .then((result) => {
      result.warnings().forEach((msg) => this.emitWarning(msg.toString()));

      if (meta && meta.messages) {
        // eslint-disable-next-line no-param-reassign
        result.messages = result.messages.concat(meta.messages);
      }

      let newMap = result.map;

      if (sourceMap && newMap) {
        newMap = newMap.toJSON();

        if (newMap.sources) {
          newMap.sources = newMap.sources.map((source) =>
            source
              .split('!')
              .pop()
              .replace(/\\/g, '/')
          );
          newMap.sourceRoot = '';
        }

        newMap.file = newMap.file
          .split('!')
          .pop()
          .replace(/\\/g, '/');
        newMap = JSON.stringify(newMap);
      }

      let moduleObj = {
        imports: '',
        runtime: `module.exports = exports = require(${stringifyRequest(
          this,
          runtimeFile
        )})(${!!sourceMap});\n`,
        module: `exports.push([module.id, ${JSON.stringify(result.css)}, ""${
          newMap ? `,${newMap}` : ''
        }]);\n`,
        exports: '',
      };

      if (result.messages && result.messages.length > 0) {
        result.messages
          .filter(
            (message) => (message.type === 'modify-module' ? message : false)
          )
          .forEach((message) => {
            try {
              moduleObj = message.modifyModule(moduleObj, this);
            } catch (err) {
              this.emitError(err);
            }
          });
      }

      const { imports, runtime, module, exports } = moduleObj;

      cb(
        null,
        [
          imports ? `// CSS imports\n${imports}` : '',
          runtime ? `// CSS runtime\n${runtime}` : '',
          module ? `// CSS module\n${module}` : '',
          exports ? `// CSS exports\n${exports}` : '',
        ].join('\n')
      );
    })
    .catch((err) => {
      cb(err.name === 'CssSyntaxError' ? new SyntaxError(err) : err);
    });
}
