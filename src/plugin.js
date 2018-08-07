import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest, urlToRequest, stringifyRequest } from 'loader-utils';

const pluginName = 'postcss-css-loader';

let runtimeEscapeFile = require.resolve('./runtimeEscape');

try {
  // run test
  runtimeEscapeFile = require.resolve('../dist/runtimeEscape');
} catch (e) {} // eslint-disable-line no-empty

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

export default postcss.plugin(
  pluginName,
  (options) =>
    function process(css, result) {
      if (options.import) {
        const alreadyImported = {};

        css.walkAtRules(/^import$/i, (rule) => {
          const parsedValue = valueParser(rule.params);

          if (!parsedValue.nodes || !parsedValue.nodes[0]) {
            throw rule.error(`Unexpected format ${rule.params}`);
          }

          const [firstNode] = parsedValue.nodes;

          let url = null;

          if (
            firstNode.type === 'function' &&
            firstNode.value.toLowerCase() === 'url'
          ) {
            if (firstNode.nodes[0]) {
              firstNode.nodes[0].quote = '';
            }

            url = valueParser.stringify(firstNode.nodes);
          } else if (firstNode.type === 'string') {
            url = firstNode.value;
          }

          if (url.replace(/\s/g, '').length === 0) {
            return;
          }

          const mediaQuery = valueParser
            .stringify(parsedValue.nodes.slice(1))
            .trim();

          let runtimeCode = '';

          if (isUrlRequest(url)) {
            url = urlToRequest(url);

            const importUrlPrefix = getImportPrefix(
              options.loaderContext,
              options.importLoaders
            );

            runtimeCode = `exports.i(require(${stringifyRequest(
              options.loaderContext,
              importUrlPrefix + url
            )}), ${JSON.stringify(mediaQuery)});\n`;
          } else {
            runtimeCode = `exports.push([module.id, ${JSON.stringify(
              `@import url(${url});`
            )}, ${JSON.stringify(mediaQuery)}]);`;
          }

          if (!alreadyImported[url]) {
            result.messages.push({
              pluginName,
              type: 'modify-module',
              modifyModule: (moduleObj) => {
                // eslint-disable-next-line no-param-reassign
                moduleObj.runtime = `${moduleObj.runtime}${runtimeCode}\n`;

                return moduleObj;
              },
            });

            alreadyImported[url] = true;
          }

          rule.remove();
        });
      }

      if (options.url) {
        let index = 0;

        css.walkDecls((decl) => {
          if (!/url\(/i.test(decl.value)) {
            return decl;
          }

          const parsedValue = valueParser(decl.value);

          // eslint-disable-next-line no-param-reassign
          decl.value = parsedValue
            .walk((node) => {
              if (
                node.type !== 'function' ||
                node.value.toLowerCase() !== 'url' ||
                node.nodes.length === 0
              ) {
                return;
              }

              const [urlNode] = node.nodes;
              const url = urlNode.value.trim().replace(/\\[\r\n]/g, '');

              // Skip empty URLs
              // Empty URL function equals request to current stylesheet where it is declared
              if (url.length === 0) {
                return;
              }

              if (!isUrlRequest(url)) {
                return;
              }

              // Remove spaces before and after
              // eslint-disable-next-line no-param-reassign
              node.before = '';
              // eslint-disable-next-line no-param-reassign
              node.after = '';

              const splittedURL = url.split(/(\?)?#/);
              const [normalizedURL] = splittedURL;

              const requestedURL = urlToRequest(normalizedURL);
              const placeholder = `___CSS_LOADER_IMPORT_URL_PLACEHOLDER___${index}___`;

              urlNode.value = placeholder;
              // Strip quotes, they will be re-added if the module needs them
              urlNode.quote = '';

              let hasURLEscapeRuntimeCode = false;

              result.messages.push({
                pluginName,
                type: 'modify-module',
                modifyModule: (moduleObj, loaderContext) => {
                  if (!hasURLEscapeRuntimeCode) {
                    // eslint-disable-next-line no-param-reassign
                    moduleObj.imports = `var runtimeEscape = require(${stringifyRequest(
                      loaderContext,
                      runtimeEscapeFile
                    )});\n${moduleObj.imports}`;

                    hasURLEscapeRuntimeCode = true;
                  }

                  // eslint-disable-next-line no-param-reassign
                  moduleObj.imports = `${
                    moduleObj.imports
                  }var ${placeholder} = require(${stringifyRequest(
                    loaderContext,
                    requestedURL
                  )});\n`;

                  // eslint-disable-next-line no-param-reassign
                  moduleObj.module = moduleObj.module.replace(
                    placeholder,
                    `" + runtimeEscape(${placeholder}) + "${
                      splittedURL[1] ? splittedURL[1] : ''
                    }${splittedURL[2] ? `#${splittedURL[2]}` : ''}`
                  );

                  return moduleObj;
                },
              });

              index += 1;

              // Stop walk inside `url` function
              // eslint-disable-next-line consistent-return
              return false;
            })
            .toString();

          return decl;
        });
      }
    }
);
