import { promisify } from 'util';

import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { normalizeUrl, resolveRequests } from '../utils';

const pluginName = 'postcss-url-parser';

const isUrlFunc = /url/i;
const isImageSetFunc = /^(?:-webkit-)?image-set$/i;
const needParseDecl = /(?:url|(?:-webkit-)?image-set)\(/i;

const walkUrlsAsync = promisify(walkUrls);
const walkDeclsAsync = promisify(walkDecls);

function getNodeFromUrlFunc(node) {
  return node.nodes && node.nodes[0];
}

async function walkUrls(parsed, callback) {
  const result = [];

  parsed.walk((node) => {
    if (node.type !== 'function') {
      return;
    }

    if (isUrlFunc.test(node.value)) {
      const { nodes } = node;
      const isStringValue = nodes.length !== 0 && nodes[0].type === 'string';
      const url = isStringValue ? nodes[0].value : valueParser.stringify(nodes);

      result.push({
        node: getNodeFromUrlFunc(node),
        url,
        needQuotes: false,
        isStringValue,
      });

      // Do not traverse inside `url`
      // eslint-disable-next-line consistent-return
      return false;
    }

    if (isImageSetFunc.test(node.value)) {
      for (const nNode of node.nodes) {
        const { type, value } = nNode;

        if (type === 'function' && isUrlFunc.test(value)) {
          const { nodes } = nNode;
          const isStringValue =
            nodes.length !== 0 && nodes[0].type === 'string';
          const url = isStringValue
            ? nodes[0].value
            : valueParser.stringify(nodes);

          result.push({
            node: getNodeFromUrlFunc(nNode),
            url,
            needQuotes: false,
            isStringValue,
          });
        }

        if (type === 'string') {
          result.push({
            node: nNode,
            url: value,
            needQuotes: true,
            isStringValue: true,
          });
        }
      }

      // Do not traverse inside `image-set`
      // eslint-disable-next-line consistent-return
      return false;
    }
  });

  callback(null, result);
}

function walkDecls(css, callback) {
  const result = [];

  css.walkDecls((decl) => {
    if (!needParseDecl.test(decl.value)) {
      return;
    }

    result.push(decl);
  });

  callback(null, result);
}

export default postcss.plugin(pluginName, (options) => (css, result) => {
  return new Promise(async (resolve, reject) => {
    const importsMap = new Map();
    const replacementsMap = new Map();
    const control = {
      index: 0,
      hasHelper: false,
    };

    const decls = await walkDeclsAsync(css);

    if (decls.length === 0) {
      resolve();
    }

    for await (const decl of decls) {
      await (async () => {
        const parsed = valueParser(decl.value);

        let parsedResults;

        try {
          parsedResults = await walkUrlsAsync(parsed);
        } catch (error) {
          return;
        }

        if (parsedResults.length === 0) {
          return;
        }

        const tasks = [];

        for (const parsedResult of parsedResults) {
          control.index += 1;

          tasks.push(
            Promise.resolve(control.index).then(async (currentIndex) => {
              const { node, url, needQuotes, isStringValue } = parsedResult;

              // https://www.w3.org/TR/css-syntax-3/#typedef-url-token
              if (url.replace(/^[\s]+|[\s]+$/g, '').length === 0) {
                result.warn(
                  `Unable to find uri in '${
                    decl ? decl.toString() : decl.value
                  }'`,
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
                  ? `${singleQuery ? '?' : ''}${
                      hashValue ? `#${hashValue}` : ''
                    }`
                  : '';

              let normalizedUrl = normalizeUrl(urlWithoutHash, isStringValue);

              let preUrl = '';
              const queryParts = normalizedUrl.split('!');

              if (queryParts.length > 1) {
                normalizedUrl = queryParts.pop();
                preUrl = queryParts.join('!');
              }

              const importKey = normalizedUrl;
              let importName = importsMap.get(importKey);

              let needAddImportMessage = false;

              if (!importName) {
                importName = `___CSS_LOADER_URL_IMPORT_${importsMap.size}___`;
                importsMap.set(importKey, importName);

                needAddImportMessage = true;
              }

              const replacementKey = JSON.stringify({
                importKey,
                hash,
                needQuotes,
              });
              let replacementName = replacementsMap.get(replacementKey);

              if (!replacementName) {
                replacementName = `___CSS_LOADER_URL_REPLACEMENT_${replacementsMap.size}___`;
                replacementsMap.set(replacementKey, replacementName);

                result.messages.push({
                  pluginName,
                  type: 'url-replacement',
                  value: {
                    // 'CSS_LOADER_URL_REPLACEMENT'
                    order: 4,
                    replacementName,
                    importName,
                    hash,
                    needQuotes,
                    index: currentIndex,
                  },
                });
              }

              if (needAddImportMessage) {
                if (!control.hasHelper) {
                  const urlToHelper = require.resolve('../runtime/getUrl.js');

                  result.messages.push({
                    pluginName,
                    type: 'import',
                    value: {
                      // 'CSS_LOADER_GET_URL_IMPORT'
                      order: 2,
                      importName: '___CSS_LOADER_GET_URL_IMPORT___',
                      url: options.urlHandler
                        ? options.urlHandler(urlToHelper)
                        : urlToHelper,
                      index: currentIndex,
                    },
                  });

                  control.hasHelper = true;
                }

                const { resolver, context } = options;

                let resolvedUrl;

                try {
                  resolvedUrl = await resolveRequests(resolver, context, [
                    ...new Set([normalizedUrl, url]),
                  ]);
                } catch (error) {
                  throw error;
                }

                if (preUrl) {
                  resolvedUrl = `${preUrl}!${resolvedUrl}`;
                }

                result.messages.push({
                  pluginName,
                  type: 'import',
                  value: {
                    // 'CSS_LOADER_URL_IMPORT'
                    order: 3,
                    importName,
                    url: options.urlHandler
                      ? options.urlHandler(resolvedUrl)
                      : resolvedUrl,
                    index: currentIndex,
                  },
                });
              }

              // eslint-disable-next-line no-param-reassign
              node.type = 'word';
              // eslint-disable-next-line no-param-reassign
              node.value = replacementName;
            })
          );
        }

        try {
          await Promise.all(tasks);
        } catch (error) {
          reject(error);
        }

        // eslint-disable-next-line no-param-reassign
        decl.value = parsed.toString();
      })();
    }

    resolve();
  });
});
