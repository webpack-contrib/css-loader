import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { stringifyRequest, isUrlRequest, urlToRequest } from 'loader-utils';

function normalizeUrl(url) {
  return url.split(/(\?)?#/);
}

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

const pluginName = 'postcss-css-loader-import';

const getArg = (nodes) =>
  nodes.length !== 0 && nodes[0].type === 'string'
    ? nodes[0].value
    : valueParser.stringify(nodes);

const getUrl = (node) => {
  if (node.type === 'function' && node.value.toLowerCase() === 'url') {
    return getArg(node.nodes);
  }

  if (node.type === 'string') {
    return node.value;
  }

  return '';
};

const parseImport = (params) => {
  const { nodes } = valueParser(params);

  if (nodes.length === 0) {
    return null;
  }

  const url = getUrl(nodes[0]);

  if (url.trim().length === 0) {
    return null;
  }

  return {
    url,
    media: valueParser.stringify(nodes.slice(1)).trim(),
  };
};

export default postcss.plugin(
  pluginName,
  (options = {}) =>
    function process(css, result) {
      const { importLoaders } = options;
      const imports = {};

      css.walkAtRules(/^import$/i, (atrule) => {
        // Convert only top-level @import
        if (atrule.parent.type !== 'root') {
          return;
        }

        if (atrule.nodes) {
          // eslint-disable-next-line consistent-return
          return result.warn(
            "It looks like you didn't end your @import statement correctly. " +
              'Child nodes are attached to it.',
            { node: atrule }
          );
        }

        const parsed = parseImport(atrule.params);

        if (!parsed) {
          // eslint-disable-next-line consistent-return
          return result.warn(`Unable to find uri in '${atrule.toString()}'`, {
            node: atrule,
          });
        }

        atrule.remove();

        imports[
          `"${parsed.url}"${
            parsed.media ? ` "${parsed.media.toLowerCase()}"` : ''
          }`
        ] = parsed;
      });

      Object.keys(imports).forEach((token) => {
        const importee = imports[token];

        result.messages.push({
          pluginName,
          type: 'css-loader',
          modify(moduleObj, loaderContext) {
            const { url, media } = importee;

            if (isUrlRequest(url)) {
              // Remove `#` from `require`
              const [normalizedUrl] = normalizeUrl(url);

              // Requestable url in `@import` at-rule (`@import './style.css`)
              moduleObj.imports.push(
                `exports.i(require(${stringifyRequest(
                  loaderContext,
                  getImportPrefix(loaderContext, importLoaders) +
                    urlToRequest(normalizedUrl)
                )}), ${JSON.stringify(media)});`
              );
            } else {
              // Absolute url in `@import` at-rule (`@import 'https://example.com/style.css`)
              moduleObj.imports.push(
                `exports.push([module.id, ${JSON.stringify(
                  `@import url(${url});`
                )}, ${JSON.stringify(media)}]);`
              );
            }

            return moduleObj;
          },
        });
      });
    }
);
