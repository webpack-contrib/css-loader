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
  isUrlRequest,
  urlToRequest,
} from 'loader-utils';
import postcss from 'postcss';
import postcssPkg from 'postcss/package.json';

import schema from './options.json';
import urlPlugin from './plugins/url';
import importPlugin from './plugins/import';
import icssPlugin from './plugins/icss';
import Warning from './Warning';
import SyntaxError from './SyntaxError';

const runtimeApi = require.resolve('./runtime/api');
const runtimeEscape = require.resolve('./runtime/escape');

function getImportPrefix(loaderContext, importLoaders) {
  const loadersRequest = loaderContext.loaders
    .slice(
      loaderContext.loaderIndex,
      loaderContext.loaderIndex + 1 + importLoaders
    )
    .map((x) => x.request)
    .join('!');

  return `-!${loadersRequest}!`;
}

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
    plugins.push(importPlugin());
  }

  plugins.push(icssPlugin());

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

      let hasURLEscapeRuntime = false;
      let moduleCode = JSON.stringify(result.css);
      const imports = [];
      const exports = [];

      if (result.messages && result.messages.length > 0) {
        let exportedTokens = {};

        result.messages
          .filter((message) => (message.type === 'export' ? message : false))
          .forEach((message) => {
            exportedTokens = Object.assign(
              {},
              exportedTokens,
              message.tokens || {}
            );
          });

        let importedTokens = {};

        result.messages
          .filter((message) => (message.type === 'import' ? message : false))
          .forEach((message) => {
            importedTokens = Object.assign(
              {},
              importedTokens,
              message.tokens || {}
            );
          });

        let exportsCode =
          Object.keys(exportedTokens).length > 0
            ? JSON.stringify(exportedTokens)
            : '';

        Object.keys(importedTokens).forEach((token) => {
          const value = importedTokens[token];
          const isUrlToken =
            Object.keys(value).length === 1 &&
            value[Object.keys(value)[0]] === 'default';
          const splittedToken = token.split(/(\?)?#/);
          const [normalizedToken] = splittedToken;

          if (isUrlToken) {
            // URLs in `url` function
            hasURLEscapeRuntime = true;

            const [placeholder] = Object.keys(value);

            imports.push(
              `var ${placeholder} = escape(require(${stringifyRequest(
                this,
                urlToRequest(normalizedToken)
              )}));`
            );
          } else {
            const media = value['{media}'] || '';

            if (isUrlRequest(token)) {
              // Requestable url in `@import` at-rule (`@import './style.css`)
              imports.push(
                `exports.i(require(${stringifyRequest(
                  this,
                  getImportPrefix(this, importLoaders) +
                    urlToRequest(normalizedToken)
                )}), ${JSON.stringify(media)});`
              );
            } else {
              // Absolute url in `@import` at-rule (`@import 'https://example.com/style.css`)
              imports.push(
                `exports.push([module.id, ${JSON.stringify(
                  `@import url(${normalizedToken});`
                )}, ${JSON.stringify(media)}]);`
              );
            }
          }

          Object.keys(value).forEach((replacedToken) => {
            if (['{media}', '{type}'].includes(replacedToken)) {
              return;
            }

            let replacedCode = null;

            if (isUrlToken) {
              // Code for `url` tokens
              replacedCode = `" + ${replacedToken} + "${
                splittedToken[1] ? splittedToken[1] : ''
              }${splittedToken[2] ? `#${splittedToken[2]}` : ''}`;
            } else {
              // Code for `local` tokens
              replacedCode = `" + require(${stringifyRequest(
                this,
                getImportPrefix(this, importLoaders) +
                  urlToRequest(normalizedToken)
              )}).locals[${JSON.stringify(value[replacedToken])}] +"`;
            }

            moduleCode = moduleCode.replace(
              new RegExp(replacedToken, 'g'),
              replacedCode
            );
            exportsCode = exportsCode.replace(
              new RegExp(replacedToken, 'g'),
              replacedCode
            );
          });
        });

        if (exportsCode) {
          exports.push(`exports.locals = ${exportsCode}`);
        }
      }

      cb(
        null,
        [
          ...(hasURLEscapeRuntime
            ? [
                '// CSS runtime escape',
                `var escape = require(${stringifyRequest(
                  this,
                  runtimeEscape
                )});`,
                '',
              ]
            : []),
          '// CSS runtime',
          `module.exports = exports = require(${stringifyRequest(
            this,
            runtimeApi
          )})(${!!sourceMap});`,
          '',
          ...(imports.length > 0
            ? ['// CSS imports', imports.join('\n'), '']
            : []),
          '// CSS module',
          `exports.push([module.id, ${moduleCode}, ""${
            newMap ? `,${newMap}` : ''
          }]);\n`,
          ...(exports.length > 0 ? ['// CSS exports', exports.join('\n')] : []),
        ].join('\n')
      );
    })
    .catch((err) => {
      cb(err.name === 'CssSyntaxError' ? new SyntaxError(err) : err);
    });
}
