const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const { isUrlRequest } = require('loader-utils');

const pluginName = 'postcss-url-parser';

function walkUrls(parsed, callback) {
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url') {
      return;
    }

    const url =
      node.nodes.length !== 0 && node.nodes[0].type === 'string'
        ? node.nodes[0].value
        : valueParser.stringify(node.nodes);

    /* eslint-disable */
    node.before = '';
    node.after = '';
    /* eslint-enable */

    callback(node, url);

    // Do not traverse inside url
    // eslint-disable-next-line consistent-return
    return false;
  });
}

function filterUrls(parsed, result, decl, filter) {
  const urls = [];

  walkUrls(parsed, (node, url) => {
    if (url.trim().replace(/\\[\r\n]/g, '').length === 0) {
      result.warn(`Unable to find uri in '${decl.toString()}'`, {
        node: decl,
      });

      return;
    }

    if (!filter(url)) {
      return;
    }

    urls.push(url);
  });

  return urls;
}

function walkDeclsWithUrl(css, result, filter) {
  const items = [];

  css.walkDecls((decl) => {
    if (!/url\(/i.test(decl.value)) {
      return;
    }

    const parsed = valueParser(decl.value);
    const values = filterUrls(parsed, result, decl, filter);

    if (values.length === 0) {
      return;
    }

    items.push({ decl, parsed, values });
  });

  return items;
}

function flatten(array) {
  return array.reduce((acc, d) => [...acc, ...d], []);
}

function mapUrls(parsed, map) {
  walkUrls(parsed, (node, content) => {
    const placeholder = map(content);

    if (!placeholder) {
      return;
    }

    // eslint-disable-next-line no-param-reassign
    node.nodes = [{ type: 'word', value: map(content) }];
  });
}

function uniq(array) {
  return array.reduce(
    (acc, d) => (acc.indexOf(d) === -1 ? [...acc, d] : acc),
    []
  );
}

module.exports = postcss.plugin(
  pluginName,
  (options) =>
    function process(css, result) {
      const urlItems = [];
      const traversed = walkDeclsWithUrl(css, result, (value) =>
        isUrlRequest(value)
      );
      const paths = uniq(flatten(traversed.map((item) => item.values)));

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
        mapUrls(item.parsed, (value) => urls[value]);
        // eslint-disable-next-line no-param-reassign
        item.decl.value = item.parsed.toString();
      });

      // eslint-disable-next-line no-param-reassign
      options.urlItems = urlItems;
    }
);
