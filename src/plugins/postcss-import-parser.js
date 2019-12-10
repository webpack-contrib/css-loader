import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest, urlToRequest } from 'loader-utils';

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

  return null;
}

function parseImport(params) {
  const { nodes } = valueParser(params);

  if (nodes.length === 0) {
    return null;
  }

  let url = getUrl(nodes[0]);

  if (!url || url.trim().length === 0) {
    return null;
  }

  if (isUrlRequest(url)) {
    url = urlToRequest(url);
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
