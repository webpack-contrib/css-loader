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
    media: valueParser
      .stringify(nodes.slice(1))
      .trim()
      .toLowerCase(),
  };
}

module.exports = postcss.plugin(
  pluginName,
  () =>
    function process(css, result) {
      css.walkAtRules(/^import$/i, (atRule) => {
        // Convert only top-level @import
        if (atRule.parent.type !== 'root') {
          return;
        }

        if (atRule.nodes) {
          result.warn(
            "It looks like you didn't end your @import statement correctly. " +
              'Child nodes are attached to it.',
            { node: atRule }
          );
          return;
        }

        const parsed = parseImport(atRule.params);

        if (!parsed) {
          // eslint-disable-next-line consistent-return
          return result.warn(`Unable to find uri in '${atRule.toString()}'`, {
            node: atRule,
          });
        }

        atRule.remove();

        const { media } = parsed;
        let { url } = parsed;
        const isUrlRequest = loaderUtils.isUrlRequest(url);

        if (isUrlRequest) {
          url = loaderUtils.urlToRequest(url);
        }

        const alreadyIncluded = result.messages.find(
          (message) =>
            message.pluginName === pluginName &&
            message.type === 'import' &&
            message.item.url === url &&
            message.item.media === media
        );

        if (alreadyIncluded) {
          return;
        }

        result.messages.push({
          pluginName,
          type: 'import',
          item: { url, media },
        });
      });
    }
);
