import valueParser from "postcss-value-parser";

import {
  normalizeUrl,
  resolveRequests,
  isUrlRequestable,
  requestify,
  webpackIgnoreCommentRegexp,
} from "../utils";

function visitor(result, parsedResults, node, key) {
  // Convert only top-level @import
  if (node.parent.type !== "root") {
    return;
  }

  if (
    node.raws &&
    node.raws.afterName &&
    node.raws.afterName.trim().length > 0
  ) {
    const lastCommentIndex = node.raws.afterName.lastIndexOf("/*");
    const matched = node.raws.afterName
      .slice(lastCommentIndex)
      .match(webpackIgnoreCommentRegexp);

    if (matched && matched[2] === "true") {
      return;
    }
  }

  const prevNode = node.prev();

  if (prevNode && prevNode.type === "comment") {
    const matched = prevNode.text.match(webpackIgnoreCommentRegexp);

    if (matched && matched[2] === "true") {
      return;
    }
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
    (paramsNodes[0].type !== "string" && paramsNodes[0].type !== "function")
  ) {
    result.warn(`Unable to find uri in "${node.toString()}"`, { node });

    return;
  }

  let isStringValue;
  let url;

  if (paramsNodes[0].type === "string") {
    isStringValue = true;
    url = paramsNodes[0].value;
  } else {
    // Invalid function - `@import nourl(test.css);`
    if (paramsNodes[0].value.toLowerCase() !== "url") {
      result.warn(`Unable to find uri in "${node.toString()}"`, { node });

      return;
    }

    isStringValue =
      paramsNodes[0].nodes.length !== 0 &&
      paramsNodes[0].nodes[0].type === "string";
    url = isStringValue
      ? paramsNodes[0].nodes[0].value
      : valueParser.stringify(paramsNodes[0].nodes);
  }

  // Empty url - `@import "";` or `@import url();`
  if (url.trim().length === 0) {
    result.warn(`Unable to find uri in "${node.toString()}"`, { node });

    return;
  }

  const mediaNodes = paramsNodes.slice(1);
  let media;

  if (mediaNodes.length > 0) {
    media = valueParser.stringify(mediaNodes).trim().toLowerCase();
  }

  let normalizedUrl = normalizeUrl(url, isStringValue);

  if (normalizedUrl.trim().length === 0) {
    result.warn(`Unable to find uri in "${node.toString()}"`, {
      node,
    });

    return;
  }

  const isRequestable = isUrlRequestable(normalizedUrl);
  let prefix;

  if (isRequestable) {
    const queryParts = normalizedUrl.split("!");

    if (queryParts.length > 1) {
      normalizedUrl = queryParts.pop();
      prefix = queryParts.join("!");
    }

    if (normalizedUrl.trim().length === 0) {
      result.warn(`Unable to find uri in "${node.toString()}"`, {
        node,
      });

      return;
    }
  }

  parsedResults.push({
    node,
    prefix,
    url: normalizedUrl,
    isRequestable,
    media,
  });
}

const plugin = (options = {}) => {
  return {
    postcssPlugin: "postcss-import-parser",
    prepare(result) {
      const parsedResults = [];

      return {
        AtRule: {
          import(atRule) {
            visitor(result, parsedResults, atRule, "params");
          },
        },
        async OnceExit() {
          if (parsedResults.length === 0) {
            return;
          }

          const imports = new Map();
          const tasks = [];

          for (const parsedResult of parsedResults) {
            const { node, isRequestable, prefix, url, media } = parsedResult;

            tasks.push(
              (async () => {
                if (options.filter) {
                  const processURL = await options.filter(url, media);

                  if (!processURL) {
                    return null;
                  }
                }

                node.remove();

                if (isRequestable) {
                  const request = requestify(url, options.rootContext);

                  const { resolver, context } = options;
                  const resolvedUrl = await resolveRequests(resolver, context, [
                    ...new Set([request, url]),
                  ]);

                  return { url: resolvedUrl, media, prefix, isRequestable };
                }

                return { url, media, prefix, isRequestable };
              })()
            );
          }

          const results = await Promise.all(tasks);

          for (let index = 0; index <= results.length - 1; index++) {
            const item = results[index];

            if (item === null) {
              // eslint-disable-next-line no-continue
              continue;
            }

            const { url, isRequestable, media } = item;

            if (isRequestable) {
              const { prefix } = item;
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
