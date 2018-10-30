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
import postcssPkg from 'postcss/package.json';

import schema from './options.json';
import urlPlugin from './plugins/url';
import importPlugin from './plugins/import';
import Warning from './Warning';
import SyntaxError from './SyntaxError';
import { messageReducer } from './utils';

export default function loader(content, map, meta) {
  const options = getOptions(this) || {};

  validate(schema, options, 'CSS Loader');

  const cb = this.async();
  const {
    url: urlOpt,
    import: importOpt,
    sourceMap,
    importLoaders,
  } = Object.assign(
    {},
    { url: true, import: true, sourceMap: false, importLoaders: 0 },
    options
  );

  const plugins = [];

  if (urlOpt) {
    plugins.push(urlPlugin());
  }

  if (importOpt) {
    plugins.push(importPlugin({ importLoaders }));
  }

  // Reuse CSS AST (PostCSS AST e.g 'postcss-loader') to avoid reparsing
  if (meta) {
    const { ast } = meta;

    if (ast && ast.type === 'postcss' && ast.version === postcssPkg.version) {
      // eslint-disable-next-line no-param-reassign
      content = ast.root;
    }
  }

  let prevMap = map;

  // Some loader emit source map as `{String}`
  if (sourceMap && typeof map === 'string') {
    prevMap = JSON.parse(map);
  }

  if (sourceMap && prevMap) {
    prevMap.sources = prevMap.sources.map((source) =>
      source.replace(/\\/g, '/')
    );
    prevMap.sourceRoot = '';
  }

  postcss(plugins)
    .process(content, {
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
    })
    .then((result) => {
      result
        .warnings()
        .forEach((warning) => this.emitWarning(new Warning(warning)));

      if (meta && meta.messages) {
        // eslint-disable-next-line no-param-reassign
        result.messages = result.messages.concat(meta.messages);
      }

      let newMap = result.map;

      if (sourceMap && newMap) {
        newMap = newMap.toJSON();
        newMap.sources = newMap.sources.map((source) =>
          source
            .split('!')
            .pop()
            .replace(/\\/g, '/')
        );
        newMap.sourceRoot = '';
        newMap.file = newMap.file
          .split('!')
          .pop()
          .replace(/\\/g, '/');
        newMap = JSON.stringify(newMap);
      }

      const runtimeCode = `module.exports = exports = require(${stringifyRequest(
        this,
        require.resolve('./runtime/api')
      )})(${!!sourceMap});\n`;
      const importCode = messageReducer(result.messages, 'import', '', this);
      const moduleCode = messageReducer(
        result.messages,
        'module',
        `exports.push([module.id, ${JSON.stringify(result.css)}, ""${
          newMap ? `,${newMap}` : ''
        }]);\n`,
        this
      );
      const exportCode = messageReducer(result.messages, 'export', '', this);

      return cb(
        null,
        [
          `// CSS runtime\n${runtimeCode}\n`,
          importCode ? `// CSS imports\n${importCode}\n` : '',
          moduleCode ? `// CSS module\n${moduleCode}\n` : '',
          exportCode ? `// CSS exports\n${exportCode}\n` : '',
        ].join('')
      );
    })
    .catch((error) => {
      cb(error.name === 'CssSyntaxError' ? new SyntaxError(error) : error);
    });
}
