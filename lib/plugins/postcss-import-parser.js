const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const loaderUtils = require('loader-utils');

const pluginName = 'postcss-import-parser';

function getArg(nodes) {
  return nodes.length !== 0 && nodes[0].type === 'string'
    ? nodes[0].value
    : valueParser.stringify(nodes);
}

function getUrl(node) {
  if (node.type === 'function' && node.value.toLowerCase() === 'url') {
    return getArg(node.nodes);
  }

  if (node.type === 'string') {
    return node.value;
  }

  return '';
}

function parseImport(params) {
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
}

module.exports = postcss.plugin(
  pluginName,
  (options) =>
    function process(css, result) {
      const importItems = [];

      css.walkAtRules(/^import$/i, (atrule) => {
        // Convert only top-level @import
        if (atrule.parent.type !== 'root') {
          return;
        }

        if (atrule.nodes) {
          result.warn(
            "It looks like you didn't end your @import statement correctly. " +
              'Child nodes are attached to it.',
            { node: atrule }
          );
          return;
        }

        const parsed = parseImport(atrule.params);

        if (!parsed) {
          // eslint-disable-next-line consistent-return
          return result.warn(`Unable to find uri in '${atrule.toString()}'`, {
            node: atrule,
          });
        }

        let { url } = parsed;

        if (loaderUtils.isUrlRequest(url)) {
          url = loaderUtils.urlToRequest(url);
        }

        importItems.push({ url, mediaQuery: parsed.media });

        atrule.remove();
      });

      // eslint-disable-next-line no-param-reassign
      options.importItems = importItems;
    }
);
