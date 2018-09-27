import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { isUrlRequest, stringifyRequest, urlToRequest } from 'loader-utils';

const pluginName = 'postcss-css-loader-icss-url';

function normalizeUrl(url) {
  return url.split(/(\?)?#/);
}

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
      // Remove `#hash` and `?#hash` to avoid duplicate require for assets with `#hash` and `?#hash`
      values: values.map((value) => normalizeUrl(value)[0]),
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
        mapUrls(item.parsed, (url) => {
          const [normalizedUrl, singleQuery, hashValue] = normalizeUrl(url);

          // Return `#hash` and `?#hash` in css
          return `${urls[normalizedUrl]}${singleQuery || ''}${
            hashValue ? `#${hashValue}` : ''
          }`;
        });

        // eslint-disable-next-line no-param-reassign
        item.decl.value = item.parsed.toString();
      });

      let hasURLEscapeRuntime = false;

      Object.keys(urls).forEach((url) => {
        result.messages.push({
          pluginName,
          type: 'module',
          modify(moduleObj, loaderContext) {
            if (!hasURLEscapeRuntime) {
              moduleObj.imports.push(
                `var escape = require(${stringifyRequest(
                  loaderContext,
                  require.resolve('../runtime/escape')
                )});`
              );

              hasURLEscapeRuntime = true;
            }

            const placeholder = urls[url];
            const [normalizedUrl] = normalizeUrl(url);

            moduleObj.imports.push(
              `var ${placeholder} = escape(require(${stringifyRequest(
                loaderContext,
                urlToRequest(normalizedUrl)
              )}));`
            );
            moduleObj.module = moduleObj.module.replace(
              new RegExp(placeholder, 'g'),
              `" + ${placeholder} + "`
            );

            return moduleObj;
          },
        });
      });
    }
);
