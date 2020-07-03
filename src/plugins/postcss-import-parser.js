import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

import { normalizeUrl, resolveRequests, isUrlRequestable } from '../utils';

const pluginName = 'postcss-import-parser';

export default postcss.plugin(pluginName, (options) => (css, result) => {
  return new Promise((resolve, reject) => {
    const importsMap = new Map();
    const tasks = [];

    // A counter is used instead of an index in callback css.walkAtRules because we mutate AST (atRule.remove())
    let index = 0;

    css.walkAtRules(/^import$/i, (atRule) => {
      // Convert only top-level @import
      if (atRule.parent.type !== 'root') {
        return;
      }

      // Nodes do not exists - `@import url('http://') :root {}`
      if (atRule.nodes) {
        result.warn(
          "It looks like you didn't end your @import statement correctly. Child nodes are attached to it.",
          { node: atRule }
        );

        return;
      }

      const { nodes } = valueParser(atRule.params);

      // No nodes - `@import ;`
      // Invalid type - `@import foo-bar;`
      if (
        nodes.length === 0 ||
        (nodes[0].type !== 'string' && nodes[0].type !== 'function')
      ) {
        result.warn(`Unable to find uri in "${atRule.toString()}"`, {
          node: atRule,
        });

        return;
      }

      let isStringValue;
      let url;

      if (nodes[0].type === 'string') {
        isStringValue = true;
        url = nodes[0].value;
      } else if (nodes[0].type === 'function') {
        // Invalid function - `@import nourl(test.css);`
        if (nodes[0].value.toLowerCase() !== 'url') {
          result.warn(`Unable to find uri in "${atRule.toString()}"`, {
            node: atRule,
          });

          return;
        }

        isStringValue =
          nodes[0].nodes.length !== 0 && nodes[0].nodes[0].type === 'string';
        url = isStringValue
          ? nodes[0].nodes[0].value
          : valueParser.stringify(nodes[0].nodes);
      }

      // Empty url - `@import "";` or `@import url();`
      if (url.trim().length === 0) {
        result.warn(`Unable to find uri in "${atRule.toString()}"`, {
          node: atRule,
        });

        return;
      }

      let normalizedUrl;

      const isRequestable = isUrlRequestable(url);

      if (isRequestable) {
        normalizedUrl = normalizeUrl(url, isStringValue, options.rootContext);

        // Empty url after normalize - `@import '\
        // \
        // \
        // ';
        if (normalizedUrl.trim().length === 0) {
          result.warn(`Unable to find uri in "${atRule.toString()}"`, {
            node: atRule,
          });

          return;
        }
      }

      const media = valueParser.stringify(nodes.slice(1)).trim().toLowerCase();

      if (
        options.filter &&
        !options.filter({ url: normalizedUrl || url, media })
      ) {
        return;
      }

      atRule.remove();

      index += 1;

      tasks.push(
        Promise.resolve(index).then(async (currentIndex) => {
          if (isRequestable) {
            const importKey = normalizedUrl;
            let importName = importsMap.get(importKey);

            if (!importName) {
              importName = `___CSS_LOADER_AT_RULE_IMPORT_${importsMap.size}___`;
              importsMap.set(importKey, importName);

              const { resolver, context } = options;

              let resolvedUrl;

              try {
                resolvedUrl = await resolveRequests(resolver, context, [
                  normalizedUrl,
                  url,
                ]);
              } catch (error) {
                throw error;
              }

              result.messages.push({
                type: 'import',
                value: {
                  importName,
                  url: options.urlHandler
                    ? options.urlHandler(resolvedUrl)
                    : resolvedUrl,
                  index: currentIndex,
                },
              });
            }

            result.messages.push({
              type: 'api-import',
              value: {
                type: 'internal',
                importName,
                media,
                index: currentIndex,
              },
            });

            return;
          }

          result.messages.push({
            pluginName,
            type: 'api-import',
            value: { type: 'external', url, media, index: currentIndex },
          });
        })
      );
    });

    Promise.all(tasks).then(
      () => resolve(),
      (error) => reject(error)
    );
  });
});
