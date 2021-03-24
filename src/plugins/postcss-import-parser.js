import valueParser from "postcss-value-parser";

import {
  normalizeUrl,
  resolveRequests,
  isUrlRequestable,
  requestify,
  webpackIgnoreCommentRegexp,
} from "../utils";

function parseNode(node, key) {
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
    const error = new Error(
      "It looks like you didn't end your @import statement correctly. Child nodes are attached to it."
    );

    error.node = node;

    throw error;
  }

  const { nodes: paramsNodes } = valueParser(node[key]);

  // No nodes - `@import ;`
  // Invalid type - `@import foo-bar;`
  if (
    paramsNodes.length === 0 ||
    (paramsNodes[0].type !== "string" && paramsNodes[0].type !== "function")
  ) {
    const error = new Error(`Unable to find uri in "${node.toString()}"`);

    error.node = node;

    throw error;
  }

  let isStringValue;
  let url;

  if (paramsNodes[0].type === "string") {
    isStringValue = true;
    url = paramsNodes[0].value;
  } else {
    // Invalid function - `@import nourl(test.css);`
    if (paramsNodes[0].value.toLowerCase() !== "url") {
      const error = new Error(`Unable to find uri in "${node.toString()}"`);

      error.node = node;

      throw error;
    }

    isStringValue =
      paramsNodes[0].nodes.length !== 0 &&
      paramsNodes[0].nodes[0].type === "string";
    url = isStringValue
      ? paramsNodes[0].nodes[0].value
      : valueParser.stringify(paramsNodes[0].nodes);
  }

  url = normalizeUrl(url, isStringValue);

  const isRequestable = isUrlRequestable(url);
  let prefix;

  if (isRequestable) {
    const queryParts = url.split("!");

    if (queryParts.length > 1) {
      url = queryParts.pop();
      prefix = queryParts.join("!");
    }
  }

  // Empty url - `@import "";` or `@import url();`
  if (url.trim().length === 0) {
    const error = new Error(`Unable to find uri in "${node.toString()}"`);

    error.node = node;

    throw error;
  }

  const mediaNodes = paramsNodes.slice(1);
  let media;

  if (mediaNodes.length > 0) {
    media = valueParser.stringify(mediaNodes).trim().toLowerCase();
  }

  // eslint-disable-next-line consistent-return
  return { node, prefix, url, isRequestable, media };
}

const plugin = (options = {}) => {
  return {
    postcssPlugin: "postcss-import-parser",
    prepare(result) {
      const parsedNodes = [];

      return {
        AtRule: {
          import(atRule) {
            let parsedNode;

            try {
              parsedNode = parseNode(atRule, "params", result);
            } catch (error) {
              result.warn(error.message, { node: error.node });
            }

            if (!parsedNode) {
              return;
            }

            parsedNodes.push(parsedNode);
          },
        },
        async OnceExit() {
          if (parsedNodes.length === 0) {
            return;
          }

          const resolvedNodes = await Promise.all(
            parsedNodes.map(async (parsedNode) => {
              const { node, isRequestable, prefix, url, media } = parsedNode;

              if (options.filter) {
                const needKeep = await options.filter(url, media);

                if (!needKeep) {
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
            })
          );

          const urlToNameMap = new Map();

          for (let index = 0; index <= resolvedNodes.length - 1; index++) {
            const item = resolvedNodes[index];

            if (!item) {
              // eslint-disable-next-line no-continue
              continue;
            }

            const { url, isRequestable, media } = item;

            if (!isRequestable) {
              options.api.push({ url, media, index });

              // eslint-disable-next-line no-continue
              continue;
            }

            const { prefix } = item;
            const newUrl = prefix ? `${prefix}!${url}` : url;
            let importName = urlToNameMap.get(newUrl);

            if (!importName) {
              importName = `___CSS_LOADER_AT_RULE_IMPORT_${urlToNameMap.size}___`;
              urlToNameMap.set(newUrl, importName);

              options.imports.push({
                importName,
                url: options.urlHandler(newUrl),
                index,
              });
            }

            options.api.push({ importName, media, index });
          }
        },
      };
    },
  };
};

plugin.postcss = true;

export default plugin;
