import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest, stringifyRequest, urlToRequest } from 'loader-utils';

const pluginName = 'postcss-css-loader-url';

const walkUrls = (parsed, callback) => {
  parsed.walk((node) => {
    if (node.type !== 'function' || node.value.toLowerCase() !== 'url') {
      return;
    }

    const url =
      node.nodes.length !== 0 && node.nodes[0].type === 'string'
        ? node.nodes[0].value
        : valueParser.stringify(node.nodes);

    if (url.trim().replace(/\\[\r\n]/g, '').length !== 0) {
      callback(node, url);
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
      values: values.map((value) => value),
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
    function process(css, result) {
      const traversed = walkDeclsWithUrl(css, (value) => isUrlRequest(value));
      const paths = uniq(flatten(traversed.map((item) => item.values)));

      if (paths.length === 0) {
        return;
      }

      const urls = {};

      paths.forEach((path, index) => {
        urls[path] = `___CSS_LOADER_URL___${index}___`;
      });

      traversed.forEach((item) => {
        mapUrls(item.parsed, (value) => urls[value]);
        // eslint-disable-next-line no-param-reassign
        item.decl.value = item.parsed.toString();
      });

      let URLEscapeRuntime = false;

      Object.keys(urls).forEach((url) => {
        result.messages.push({
          pluginName,
          type: 'import',
          import(accumulator, currentValue, index, array, loaderContext) {
            const placeholder = urls[url];
            // Remove `#hash` and `?#hash` from `require`
            const [normalizedUrl, singleQuery, hashValue] = url.split(/(\?)?#/);
            let URLEscapeRuntimeCode = '';

            if (!URLEscapeRuntime) {
              URLEscapeRuntimeCode = `var escape = require(${stringifyRequest(
                loaderContext,
                require.resolve('../runtime/escape')
              )});\n`;

              URLEscapeRuntime = true;
            }

            const hash =
              singleQuery || hashValue
                ? `"${singleQuery ? '?' : ''}${
                    hashValue ? `#${hashValue}` : ''
                  }"`
                : '';

            return `${URLEscapeRuntimeCode}${accumulator}var ${placeholder} = escape(require(${stringifyRequest(
              loaderContext,
              urlToRequest(normalizedUrl)
            )})${hash ? ` + ${hash}` : ''});\n`;
          },
        });

        result.messages.push({
          pluginName,
          type: 'module',
          module(accumulator) {
            const placeholder = urls[url];

            return accumulator.replace(
              new RegExp(placeholder, 'g'),
              `" + ${placeholder} + "`
            );
          },
        });
      });
    }
);
