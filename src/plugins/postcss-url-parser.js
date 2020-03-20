import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { normalizeUrl } from '../utils';

const pluginName = 'postcss-url-parser';

const isUrlFunc = /url/i;
const isImageSetFunc = /^(?:-webkit-)?image-set$/i;
const needParseDecl = /(?:url|(?:-webkit-)?image-set)\(/i;

function getNodeFromUrlFunc(node) {
  return node.nodes && node.nodes[0];
}

function walkUrls(parsed, callback) {
  parsed.walk((node) => {
    if (node.type !== 'function') {
      return;
    }

    if (isUrlFunc.test(node.value)) {
      const { nodes } = node;
      const isStringValue = nodes.length !== 0 && nodes[0].type === 'string';
      const url = isStringValue ? nodes[0].value : valueParser.stringify(nodes);

      callback(getNodeFromUrlFunc(node), url, false, isStringValue);

      // Do not traverse inside `url`
      // eslint-disable-next-line consistent-return
      return false;
    }

    if (isImageSetFunc.test(node.value)) {
      node.nodes.forEach((nNode) => {
        const { type, value } = nNode;

        if (type === 'function' && isUrlFunc.test(value)) {
          const { nodes } = nNode;

          const isStringValue =
            nodes.length !== 0 && nodes[0].type === 'string';
          const url = isStringValue
            ? nodes[0].value
            : valueParser.stringify(nodes);

          callback(getNodeFromUrlFunc(nNode), url, false, isStringValue);
        }

        if (type === 'string') {
          callback(nNode, value, true, true);
        }
      });

      // Do not traverse inside `image-set`
      // eslint-disable-next-line consistent-return
      return false;
    }
  });
}

export default postcss.plugin(pluginName, (options) => (css, result) => {
  const importsMap = new Map();
  const replacersMap = new Map();

  css.walkDecls((decl) => {
    if (!needParseDecl.test(decl.value)) {
      return;
    }

    const parsed = valueParser(decl.value);

    walkUrls(parsed, (node, url, needQuotes, isStringValue) => {
      if (url.trim().replace(/\\[\r\n]/g, '').length === 0) {
        result.warn(
          `Unable to find uri in '${decl ? decl.toString() : decl.value}'`,
          { node: decl }
        );

        return;
      }

      if (options.filter && !options.filter(url)) {
        return;
      }

      const splittedUrl = url.split(/(\?)?#/);
      const [urlWithoutHash, singleQuery, hashValue] = splittedUrl;
      const hash =
        singleQuery || hashValue
          ? `${singleQuery ? '?' : ''}${hashValue ? `#${hashValue}` : ''}`
          : '';

      const normalizedUrl = normalizeUrl(urlWithoutHash, isStringValue);

      const importKey = normalizedUrl;
      let importName = importsMap.get(importKey);

      if (!importName) {
        importName = `___CSS_LOADER_URL_IMPORT_${importsMap.size}___`;
        importsMap.set(importKey, importName);

        result.messages.push({
          pluginName,
          type: 'import',
          value: {
            type: 'url',
            importName,
            url: normalizedUrl,
          },
        });
      }

      const replacerKey = JSON.stringify({ importKey, hash, needQuotes });

      let replacerName = replacersMap.get(replacerKey);

      if (!replacerName) {
        replacerName = `___CSS_LOADER_URL_REPLACEMENT_${replacersMap.size}___`;
        replacersMap.set(replacerKey, replacerName);

        result.messages.push({
          pluginName,
          type: 'replacer',
          value: { type: 'url', replacerName, importName, hash, needQuotes },
        });
      }

      // eslint-disable-next-line no-param-reassign
      node.type = 'word';
      // eslint-disable-next-line no-param-reassign
      node.value = replacerName;
    });

    // eslint-disable-next-line no-param-reassign
    decl.value = parsed.toString();
  });
});
