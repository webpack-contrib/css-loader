import valueParser from 'postcss-value-parser';

import {
  normalizeUrl,
  resolveRequests,
  isUrlRequestable,
  requestify,
} from '../utils';

function visitor(result, parsedResults, node, key) {
  // Convert only top-level @import
  if (node.parent.type !== 'root') {
    return;
  }

  // Nodes do not exists - `@import url('http://') :root {}`
  if (node.nodes) {
    result.warn(
      "It looks like you didn't end your @import statement correctly. Child nodes are attached to it.",
      { node }
    );

    return;
  }

  const { nodes: paramsNodes } = valueParser(node[key]);

  // No nodes - `@import ;`
  // Invalid type - `@import foo-bar;`
  if (
    paramsNodes.length === 0 ||
    (paramsNodes[0].type !== 'string' && paramsNodes[0].type !== 'function')
  ) {
    result.warn(`Unable to find uri in "${node.toString()}"`, { node });

    return;
  }

  let isStringValue;
  let url;

  if (paramsNodes[0].type === 'string') {
    isStringValue = true;
    url = paramsNodes[0].value;
  } else {
    // Invalid function - `@import nourl(test.css);`
    if (paramsNodes[0].value.toLowerCase() !== 'url') {
      result.warn(`Unable to find uri in "${node.toString()}"`, { node });

      return;
    }

    isStringValue =
      paramsNodes[0].nodes.length !== 0 &&
      paramsNodes[0].nodes[0].type === 'string';
    url = isStringValue
      ? paramsNodes[0].nodes[0].value
      : valueParser.stringify(paramsNodes[0].nodes);
  }

  // Empty url - `@import "";` or `@import url();`
  if (url.trim().length === 0) {
    result.warn(`Unable to find uri in "${node.toString()}"`, { node });

    return;
  }

  parsedResults.push({
    node,
    url,
    isStringValue,
    mediaNodes: paramsNodes.slice(1),
  });
}

const plugin = (options = {}) => {
  return {
    postcssPlugin: 'postcss-import-parser',
    prepare(result) {
      const parsedResults = [];

      return {
        AtRule: {
          import(atRule) {
            visitor(result, parsedResults, atRule, 'params');
          },
        },
        async OnceExit() {
          if (parsedResults.length === 0) {
            return;
          }

          const imports = new Map();
          const tasks = [];

          for (const parsedResult of parsedResults) {
            const { node, url, isStringValue, mediaNodes } = parsedResult;

            let normalizedUrl = url;
            let prefix = '';

            const isRequestable = isUrlRequestable(normalizedUrl);

            if (isRequestable) {
              const queryParts = normalizedUrl.split('!');

              if (queryParts.length > 1) {
                normalizedUrl = queryParts.pop();
                prefix = queryParts.join('!');
              }

              normalizedUrl = normalizeUrl(normalizedUrl, isStringValue);

              // Empty url after normalize - `@import '\
              // \
              // \
              // ';
              if (normalizedUrl.trim().length === 0) {
                result.warn(`Unable to find uri in "${node.toString()}"`, {
                  node,
                });

                // eslint-disable-next-line no-continue
                continue;
              }
            }

            let media;

            if (mediaNodes.length > 0) {
              media = valueParser.stringify(mediaNodes).trim().toLowerCase();
            }

            if (options.filter && !options.filter(normalizedUrl, media)) {
              // eslint-disable-next-line no-continue
              continue;
            }

            node.remove();

            if (isRequestable) {
              const request = requestify(normalizedUrl, options.rootContext);

              tasks.push(
                (async () => {
                  const { resolver, context } = options;
                  const resolvedUrl = await resolveRequests(resolver, context, [
                    ...new Set([request, normalizedUrl]),
                  ]);

                  return { url: resolvedUrl, media, prefix, isRequestable };
                })()
              );
            } else {
              tasks.push({ url, media, prefix, isRequestable });
            }
          }

          const results = await Promise.all(tasks);

          for (let index = 0; index <= results.length - 1; index++) {
            const { url, isRequestable, media } = results[index];

            if (isRequestable) {
              const { prefix } = results[index];
              const newUrl = prefix ? `${prefix}!${url}` : url;
              const importKey = newUrl;
              let importName = imports.get(importKey);

              if (!importName) {
                importName = `___CSS_LOADER_AT_RULE_IMPORT_${imports.size}___`;
                imports.set(importKey, importName);

                options.imports.push({
                  importName,
                  url: options.urlHandler(newUrl),
                  index,
                });
              }

              options.api.push({ importName, media, index });

              // eslint-disable-next-line no-continue
              continue;
            }

            options.api.push({ url, media, index });
          }
        },
      };
    },
  };
};

plugin.postcss = true;

export default plugin;
