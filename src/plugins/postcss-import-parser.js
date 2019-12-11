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

function parseImport(params) {
  const { nodes } = valueParser(params);

  if (nodes.length === 0) {
    return null;
  }

  const value = getParsedValue(nodes[0]);

  if (!value) {
    return null;
  }

  let { url } = value;

  if (url.trim().length === 0) {
    return null;
  }

  if (isUrlRequest(url)) {
    const { isStringValue } = value;

    url = normalizeUrl(url, isStringValue);
  }

  return {
    url,
    media: valueParser
      .stringify(nodes.slice(1))
      .trim()
      .toLowerCase(),
  };
}

function walkAtRules(css, result, filter) {
  const items = new Map();

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

    if (filter && !filter(parsed)) {
      return;
    }

    atRule.remove();

    const { url, media } = parsed;
    const value = items.get(url);

    if (!value) {
      items.set(url, new Set([media]));
    } else {
      value.add(media);
    }
  });

  return items;
}

export default postcss.plugin(
  pluginName,
  (options) =>
    function process(css, result) {
      const items = walkAtRules(css, result, options.filter);

      [...items]
        .reduce((accumulator, currentValue) => {
          const [url, medias] = currentValue;

          medias.forEach((media) => {
            accumulator.push({ url, media });
          });

          return accumulator;
        }, [])
        .forEach((item, index) => {
          const { url, media } = item;
          const name = `___CSS_LOADER_AT_RULE_IMPORT_${index}___`;

          result.messages.push({
            pluginName,
            type: 'import',
            value: { type: '@import', name, url, media },
          });
        });
    }
);
