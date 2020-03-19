import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest } from 'loader-utils';

import { normalizeUrl } from '../utils';

const pluginName = 'postcss-import-parser';

export default postcss.plugin(pluginName, (options) => (css, result) => {
  css.walkAtRules(/^import$/i, (atRule) => {
    // Convert only top-level @import
    if (atRule.parent.type !== 'root') {
      return;
    }

    // Nodes do not exists - `@import url('http://') :root {}`
    if (atRule.nodes) {
      result.warn(
        "It looks like you didn't end your @import statement correctly. Child nodes are attached to it.",
        { node: atRule }
      );

      return;
    }

    const { nodes } = valueParser(atRule.params);

    // No nodes - `@import ;`
    // Invalid type - `@import foo-bar;`
    if (
      nodes.length === 0 ||
      (nodes[0].type !== 'string' && nodes[0].type !== 'function')
    ) {
      result.warn(`Unable to find uri in "${atRule.toString()}"`, {
        node: atRule,
      });

      return;
    }

    let isStringValue;
    let url;

    if (nodes[0].type === 'string') {
      isStringValue = true;
      url = nodes[0].value;
    } else if (nodes[0].type === 'function') {
      // Invalid function - `@import nourl(test.css);`
      if (nodes[0].value.toLowerCase() !== 'url') {
        result.warn(`Unable to find uri in "${atRule.toString()}"`, {
          node: atRule,
        });

        return;
      }

      isStringValue =
        nodes[0].nodes.length !== 0 && nodes[0].nodes[0].type === 'string';
      url = isStringValue
        ? nodes[0].nodes[0].value
        : valueParser.stringify(nodes[0].nodes);
    }

    // Empty url - `@import "";` or `@import url();`
    if (url.trim().length === 0) {
      result.warn(`Unable to find uri in "${atRule.toString()}"`, {
        node: atRule,
      });

      return;
    }

    if (isUrlRequest(url)) {
      url = normalizeUrl(url, isStringValue);

      // Empty url after normalize - `@import '\
      // \
      // \
      // ';
      if (url.trim().length === 0) {
        result.warn(`Unable to find uri in "${atRule.toString()}"`, {
          node: atRule,
        });

        return;
      }
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
