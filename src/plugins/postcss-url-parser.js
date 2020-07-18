import { promisify } from 'util';

import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { normalizeUrl, resolveRequests } from '../utils';

const pluginName = 'postcss-url-parser';

const isUrlFunc = /url/i;
const isImageSetFunc = /^(?:-webkit-)?image-set$/i;
const needParseDecl = /(?:url|(?:-webkit-)?image-set)\(/i;

const walkCssAsync = promisify(walkCss);

function getNodeFromUrlFunc(node) {
  return node.nodes && node.nodes[0];
}

function ruleValidate(rule, decl, result, options) {
  // https://www.w3.org/TR/css-syntax-3/#typedef-url-token
  if (rule.url.replace(/^[\s]+|[\s]+$/g, '').length === 0) {
    result.warn(`Unable to find uri in '${decl.toString()}'`, { node: decl });

    return false;
  }

  if (options.filter && !options.filter(rule.url)) {
    return false;
  }

  return true;
}

function walkCss(css, result, options, callback) {
  const accumulator = [];

  css.walkDecls((decl) => {
    if (!needParseDecl.test(decl.value)) {
      return;
    }

    const parsed = valueParser(decl.value);

    parsed.walk((node) => {
      if (node.type !== 'function') {
        return;
      }

      if (isUrlFunc.test(node.value)) {
        const { nodes } = node;
        const isStringValue = nodes.length !== 0 && nodes[0].type === 'string';
        const url = isStringValue
          ? nodes[0].value
          : valueParser.stringify(nodes);

        const rule = {
          node: getNodeFromUrlFunc(node),
          url,
          needQuotes: false,
          isStringValue,
        };

        if (ruleValidate(rule, decl, result, options)) {
          accumulator.push({
            decl,
            rule,
            parsed,
          });
        }

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

            const rule = {
              node: getNodeFromUrlFunc(nNode),
              url,
              needQuotes: false,
              isStringValue,
            };

            if (ruleValidate(rule, decl, result, options)) {
              accumulator.push({
                decl,
                rule,
                parsed,
              });
            }
          }

          if (type === 'string') {
            const rule = {
              node: nNode,
              url: value,
              needQuotes: true,
              isStringValue: true,
            };

            if (ruleValidate(rule, decl, result, options)) {
              accumulator.push({
                decl,
                rule,
                parsed,
              });
            }
          }
        }

        // Do not traverse inside `image-set`
        // eslint-disable-next-line consistent-return
        return false;
      }
    });
  });

  callback(null, accumulator);
}

export default postcss.plugin(pluginName, (options) => (css, result) => {
  return new Promise(async (resolve, reject) => {
    const importsMap = new Map();
    const replacementsMap = new Map();
    const urlToHelper = require.resolve('../runtime/getUrl.js');

    const parsedResults = await walkCssAsync(css, result, options);

    if (parsedResults.length === 0) {
      resolve();

      return;
    }

    const tasks = [];

    let index = 0;
    let hasHelper = false;

    for (const parsedResult of parsedResults) {
      index += 1;

      if (!hasHelper) {
        result.messages.push({
          pluginName,
          type: 'import',
          value: {
            // 'CSS_LOADER_GET_URL_IMPORT'
            order: 2,
            importName: '___CSS_LOADER_GET_URL_IMPORT___',
            url: options.urlHandler(urlToHelper),
            index,
          },
        });

        hasHelper = true;
      }

      const { decl, rule } = parsedResult;
      const { node, url, needQuotes, isStringValue } = rule;
      const splittedUrl = url.split(/(\?)?#/);
      const [urlWithoutHash, singleQuery, hashValue] = splittedUrl;

      let hash = singleQuery ? '?' : '';
      hash += hashValue ? `#${hashValue}` : '';

      let normalizedUrl = normalizeUrl(
        urlWithoutHash,
        isStringValue,
        options.rootContext
      );

      let prefixSuffix = '';

      const queryParts = normalizedUrl.split('!');

      if (queryParts.length > 1) {
        normalizedUrl = queryParts.pop();
        prefixSuffix = queryParts.join('!');
      }

      const importKey = normalizedUrl;

      let importName = importsMap.get(importKey);

      if (!importName) {
        importName = `___CSS_LOADER_URL_IMPORT_${importsMap.size}___`;
        importsMap.set(importKey, importName);

        tasks.push(
          Promise.resolve(index).then(async (currentIndex) => {
            const { resolver, context } = options;

            let resolvedUrl;

            try {
              resolvedUrl = await resolveRequests(resolver, context, [
                ...new Set([normalizedUrl, url]),
              ]);
            } catch (error) {
              throw error;
            }

            if (prefixSuffix) {
              resolvedUrl = `${prefixSuffix}!${resolvedUrl}`;
            }

            result.messages.push({
              pluginName,
              type: 'import',
              value: {
                // 'CSS_LOADER_URL_IMPORT'
                order: 3,
                importName,
                url: options.urlHandler(resolvedUrl),
                index: currentIndex,
              },
            });
          })
        );
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
            index,
          },
        });
      }

      // eslint-disable-next-line no-param-reassign
      node.type = 'word';
      // eslint-disable-next-line no-param-reassign
      node.value = replacementName;
      // eslint-disable-next-line no-param-reassign
      decl.value = parsedResult.parsed.toString();
    }

    Promise.all(tasks).then(
      () => resolve(),
      (error) => reject(error)
    );
  });
});
