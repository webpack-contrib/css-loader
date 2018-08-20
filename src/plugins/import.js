import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest, urlToRequest, stringifyRequest } from 'loader-utils';

const pluginName = 'postcss-css-loader-import';

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
            type: 'module',
            modify(moduleObj) {
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
);
