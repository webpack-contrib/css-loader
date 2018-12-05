import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

const pluginName = 'postcss-url-parser';

function getArg(nodes) {
  return nodes.length !== 0 && nodes[0].type === 'string'
    ? nodes[0].value
    : valueParser.stringify(nodes);
}

function walkUrls(parsed, callback) {
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url') {
      return;
    }

    /* eslint-disable */
    node.before = '';
    node.after = '';
    /* eslint-enable */

    callback(node, getArg(node.nodes));

    // Do not traverse inside url
    // eslint-disable-next-line consistent-return
    return false;
  });
}

function walkDeclsWithUrl(css, result, filter) {
  const items = [];

  css.walkDecls((decl) => {
    if (!/url\(/i.test(decl.value)) {
      return;
    }

    const parsed = valueParser(decl.value);
    const urls = [];

    walkUrls(parsed, (node, url) => {
      if (url.trim().replace(/\\[\r\n]/g, '').length === 0) {
        result.warn(`Unable to find uri in '${decl.toString()}'`, {
          node: decl,
        });

        return;
      }

      if (filter && !filter(url)) {
        return;
      }

      urls.push(url);
    });

    if (urls.length === 0) {
      return;
    }

    items.push({ decl, parsed, urls });
  });

  return items;
}

function flatten(array) {
  return array.reduce((acc, d) => [...acc, ...d], []);
}

function uniq(array) {
  return array.reduce(
    (acc, d) => (acc.indexOf(d) === -1 ? [...acc, d] : acc),
    []
  );
}

export default postcss.plugin(
  pluginName,
  (options = {}) =>
    function process(css, result) {
      const traversed = walkDeclsWithUrl(css, result, options.filter);
      const paths = uniq(flatten(traversed.map((item) => item.urls)));

      if (paths.length === 0) {
        return;
      }

      const urls = {};

      paths.forEach((path, index) => {
        const placeholder = `___CSS_LOADER_URL___${index}___`;

        urls[path] = placeholder;

        result.messages.push({
          pluginName,
          type: 'url',
          item: { url: path, placeholder },
        });
      });

      traversed.forEach((item) => {
        walkUrls(item.parsed, (node, url) => {
          const value = urls[url];

          if (!value) {
            return;
          }

          // eslint-disable-next-line no-param-reassign
          node.nodes = [{ type: 'word', value }];
        });

        // eslint-disable-next-line no-param-reassign
        item.decl.value = item.parsed.toString();
      });
    }
);
