import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest, urlToRequest, stringifyRequest } from 'loader-utils';

const pluginName = 'postcss-css-loader-url';
const runtimeEscape = require.resolve('../runtime/escape');

export default postcss.plugin(
  pluginName,
  () =>
    function process(css, result) {
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
            const placeholder = `CSS___IMPORT_URL___${index}`;

            urlNode.value = placeholder;
            // Strip quotes, they will be re-added if the module needs them
            urlNode.quote = '';

            let hasURLEscapeRuntimeCode = false;

            result.messages.push({
              pluginName,
              type: 'module',
              modify(moduleObj, loaderContext) {
                if (!hasURLEscapeRuntimeCode) {
                  // eslint-disable-next-line no-param-reassign
                  moduleObj.imports = `var runtimeEscape = require(${stringifyRequest(
                    loaderContext,
                    runtimeEscape
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
);
