import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { uniqWith, flatten } from '../utils';

const pluginName = 'postcss-url-parser';

const isUrlFunc = /url/i;
const isImageSetFunc = /^(?:-webkit-)?image-set$/i;
const needParseDecl = /(?:url|(?:-webkit-)?image-set)\(/i;

function getNodeFromUrlFunc(node) {
  return node.nodes && node.nodes[0];
}

function getUrlFromUrlFunc(node) {
  return node.nodes.length !== 0 && node.nodes[0].type === 'string'
    ? node.nodes[0].value
    : valueParser.stringify(node.nodes);
}

function walkUrls(parsed, callback) {
  parsed.walk((node) => {
    if (node.type !== 'function') {
      return;
    }

    if (isUrlFunc.test(node.value)) {
      callback(getNodeFromUrlFunc(node), getUrlFromUrlFunc(node), false);

      // Do not traverse inside `url`
      // eslint-disable-next-line consistent-return
      return false;
    }

    if (isImageSetFunc.test(node.value)) {
      node.nodes.forEach((nNode) => {
        if (nNode.type === 'function' && isUrlFunc.test(nNode.value)) {
          callback(getNodeFromUrlFunc(nNode), getUrlFromUrlFunc(nNode), false);
        }

        if (nNode.type === 'string') {
          callback(nNode, nNode.value, true);
        }
      });

      // Do not traverse inside `image-set`
      // eslint-disable-next-line consistent-return
      return false;
    }
  });
}

function getUrlsFromValue(value, result, filter, decl = null) {
  if (!needParseDecl.test(value)) {
    return;
  }

  const parsed = valueParser(value);
  const urls = [];

  walkUrls(parsed, (node, url, needQuotes) => {
    if (url.trim().replace(/\\[\r\n]/g, '').length === 0) {
      result.warn(
        `Unable to find uri in '${decl ? decl.toString() : value}'`,
        decl
          ? {
              node: decl,
            }
          : {}
      );

      return;
    }

    if (filter && !filter(url)) {
      return;
    }

    urls.push({ url, needQuotes });
  });

  // eslint-disable-next-line consistent-return
  return { parsed, urls };
}

function walkDeclsWithUrl(css, result, filter) {
  const items = [];

  css.walkDecls((decl) => {
    const item = getUrlsFromValue(decl.value, result, filter, decl);

    if (!item || item.urls.length === 0) {
      return;
    }

    items.push({ decl, parsed: item.parsed, urls: item.urls });
  });

  return items;
}

export default postcss.plugin(
  pluginName,
  (options) =>
    function process(css, result) {
      const traversed = walkDeclsWithUrl(css, result, options.filter);
      const paths = uniqWith(
        flatten(traversed.map((item) => item.urls)),
        (value, other) =>
          value.url === other.url && value.needQuotes === other.needQuotes
      );

      if (paths.length === 0) {
        return;
      }

      const placeholders = [];

      paths.forEach((path, index) => {
        const name = `___CSS_LOADER_URL___${index}___`;
        const { url, needQuotes } = path;

        const [normalizedUrl, singleQuery, hashValue] = url.split(/(\?)?#/);
        const hash =
          singleQuery || hashValue
            ? `${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}`
            : '';

        placeholders.push({ name, path });

        result.messages.push(
          {
            pluginName,
            type: 'import',
            value: { type: 'url', name, url: normalizedUrl, needQuotes, hash },
          },
          {
            pluginName,
            type: 'replacer',
            value: { type: 'url', name },
          }
        );
      });

      traversed.forEach((item) => {
        walkUrls(item.parsed, (node, url, needQuotes) => {
          const value = placeholders.find(
            (placeholder) =>
              placeholder.path.url === url &&
              placeholder.path.needQuotes === needQuotes
          );

          if (!value) {
            return;
          }

          const { name } = value;

          // eslint-disable-next-line no-param-reassign
          node.type = 'word';
          // eslint-disable-next-line no-param-reassign
          node.value = name;
        });

        // eslint-disable-next-line no-param-reassign
        item.decl.value = item.parsed.toString();
      });
    }
);
