import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest } from 'loader-utils';

import { normalizeUrl } from '../utils';

const pluginName = 'postcss-import-parser';

function getParsedValue(node) {
  if (node.type === 'function' && node.value.toLowerCase() === 'url') {
    const { nodes } = node;
    const isStringValue = nodes.length !== 0 && nodes[0].type === 'string';
    const url = isStringValue ? nodes[0].value : valueParser.stringify(nodes);

    return { url, isStringValue };
  }

  if (node.type === 'string') {
    const url = node.value;

    return { url, isStringValue: true };
  }

  return null;
}

export default postcss.plugin(pluginName, (options) => (css, result) => {
  css.walkAtRules(/^import$/i, (atRule) => {
    // Convert only top-level @import
    if (atRule.parent.type !== 'root') {
      return;
    }

    if (atRule.nodes) {
      result.warn(
        "It looks like you didn't end your @import statement correctly. Child nodes are attached to it.",
        { node: atRule }
      );

      return;
    }

    const { nodes } = valueParser(atRule.params);

    if (nodes.length === 0) {
      result.warn(`Unable to find uri in "${atRule.toString()}"`, {
        node: atRule,
      });

      return;
    }

    const value = getParsedValue(nodes[0]);

    if (!value) {
      result.warn(`Unable to find uri in "${atRule.toString()}"`, {
        node: atRule,
      });

      return;
    }

    let { url } = value;

    if (url.trim().length === 0) {
      result.warn(`Unable to find uri in "${atRule.toString()}"`, {
        node: atRule,
      });

      return;
    }

    if (isUrlRequest(url)) {
      const { isStringValue } = value;

      url = normalizeUrl(url, isStringValue);
    }

    if (!url) {
      // eslint-disable-next-line consistent-return
      return result.warn(`Unable to find uri in "${atRule.toString()}"`, {
        node: atRule,
      });
    }

    const media = valueParser
      .stringify(nodes.slice(1))
      .trim()
      .toLowerCase();

    if (options.filter && !options.filter({ url, media })) {
      return;
    }

    atRule.remove();

    result.messages.push({
      pluginName,
      type: 'import',
      value: { type: '@import', url, media },
    });
  });
});
