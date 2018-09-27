import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest } from 'loader-utils';

const pluginName = 'postcss-css-loader-icss-url';

const walkUrls = (parsed, callback) => {
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url') {
      return;
    }

    const content =
      node.nodes.length !== 0 && node.nodes[0].type === 'string'
        ? node.nodes[0].value
        : valueParser.stringify(node.nodes);

    if (content.trim().replace(/\\[\r\n]/g, '').length !== 0) {
      callback(node, content);
    }

    // Do not traverse inside url
    // eslint-disable-next-line consistent-return
    return false;
  });
};

const filterUrls = (parsed, filter) => {
  const result = [];

  walkUrls(parsed, (node, content) => {
    if (!filter(content)) {
      return;
    }

    result.push(content);
  });

  return result;
};

const walkDeclsWithUrl = (css, filter) => {
  const result = [];

  css.walkDecls((decl) => {
    if (!/url\(/i.test(decl.value)) {
      return;
    }

    const parsed = valueParser(decl.value);
    const values = filterUrls(parsed, filter);

    if (values.length === 0) {
      return;
    }

    result.push({
      decl,
      parsed,
      values,
    });
  });

  return result;
};

const flatten = (array) => array.reduce((acc, d) => [...acc, ...d], []);

const uniq = (array) =>
  array.reduce((acc, d) => (acc.indexOf(d) === -1 ? [...acc, d] : acc), []);

const mapUrls = (parsed, map) => {
  walkUrls(parsed, (node, content) => {
    // eslint-disable-next-line no-param-reassign
    node.nodes = [{ type: 'word', value: map(content) }];
  });
};

export default postcss.plugin(
  pluginName,
  () =>
    function process(css) {
      const traversed = walkDeclsWithUrl(css, (value) => isUrlRequest(value));
      const paths = uniq(flatten(traversed.map((item) => item.values)));
      const imports = {};
      const aliases = {};

      paths.forEach((path, index) => {
        const alias = `__url__${index}__`;

        imports[`"${path}"`] = {
          [alias]: 'default',
        };
        aliases[path] = alias;
      });

      traversed.forEach((item) => {
        mapUrls(item.parsed, (value) => aliases[value]);

        // eslint-disable-next-line no-param-reassign
        item.decl.value = item.parsed.toString();
      });
    }
);
