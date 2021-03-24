import valueParser from "postcss-value-parser";

import {
  normalizeUrl,
  requestify,
  resolveRequests,
  isUrlRequestable,
  webpackIgnoreCommentRegexp,
} from "../utils";

const isUrlFunc = /url/i;
const isImageSetFunc = /^(?:-webkit-)?image-set$/i;
const needParseDeclaration = /(?:url|(?:-webkit-)?image-set)\(/i;

function getNodeFromUrlFunc(node) {
  return node.nodes && node.nodes[0];
}

function shouldHandleRule(rule, node, result) {
  // https://www.w3.org/TR/css-syntax-3/#typedef-url-token
  if (rule.url.replace(/^[\s]+|[\s]+$/g, "").length === 0) {
    result.warn(`Unable to find uri in '${node.toString()}'`, { node });

    return false;
  }

  if (!isUrlRequestable(rule.url)) {
    return false;
  }

  return true;
}

function getWebpackIgnoreCommentValue(index, nodes, inBetween) {
  if (index === 0 && typeof inBetween !== "undefined") {
    return inBetween;
  }

  let prevValueNode = nodes[index - 1];

  if (!prevValueNode) {
    // eslint-disable-next-line consistent-return
    return;
  }

  if (prevValueNode.type === "space") {
    if (!nodes[index - 2]) {
      // eslint-disable-next-line consistent-return
      return;
    }

    prevValueNode = nodes[index - 2];
  }

  if (prevValueNode.type !== "comment") {
    // eslint-disable-next-line consistent-return
    return;
  }

  const matched = prevValueNode.value.match(webpackIgnoreCommentRegexp);

  return matched && matched[2] === "true";
}

function parseDeclaration(node, key, result, parsedResults) {
  if (!needParseDeclaration.test(node[key])) {
    return;
  }

  const parsed = valueParser(
    node.raws && node.raws.value && node.raws.value.raw
      ? node.raws.value.raw
      : node[key]
  );

  let inBetween;

  if (node.raws && node.raws.between) {
    const lastCommentIndex = node.raws.between.lastIndexOf("/*");

    const matched = node.raws.between
      .slice(lastCommentIndex)
      .match(webpackIgnoreCommentRegexp);

    if (matched) {
      inBetween = matched[2] === "true";
    }
  }

  let isIgnoreOnDeclaration = false;

  const prevNode = node.prev();

  if (prevNode && prevNode.type === "comment") {
    const matched = prevNode.text.match(webpackIgnoreCommentRegexp);

    if (matched) {
      isIgnoreOnDeclaration = matched[2] === "true";
    }
  }

  let needIgnore;

  parsed.walk((valueNode, index, valueNodes) => {
    if (valueNode.type !== "function") {
      return;
    }

    if (isUrlFunc.test(valueNode.value)) {
      needIgnore = getWebpackIgnoreCommentValue(index, valueNodes, inBetween);

      if (
        (isIgnoreOnDeclaration && typeof needIgnore === "undefined") ||
        needIgnore
      ) {
        if (needIgnore) {
          // eslint-disable-next-line no-undefined
          needIgnore = undefined;
        }

        return;
      }

      const { nodes } = valueNode;
      const isStringValue = nodes.length !== 0 && nodes[0].type === "string";
      const url = isStringValue ? nodes[0].value : valueParser.stringify(nodes);

      const rule = {
        node: getNodeFromUrlFunc(valueNode),
        url,
        needQuotes: false,
        isStringValue,
      };

      if (shouldHandleRule(rule, node, result)) {
        parsedResults.push({ node, rule, parsed });
      }

      // Do not traverse inside `url`
      // eslint-disable-next-line consistent-return
      return false;
    } else if (isImageSetFunc.test(valueNode.value)) {
      for (const [innerIndex, nNode] of valueNode.nodes.entries()) {
        const { type, value } = nNode;

        if (type === "function" && isUrlFunc.test(value)) {
          needIgnore = getWebpackIgnoreCommentValue(
            innerIndex,
            valueNode.nodes
          );

          if (
            (isIgnoreOnDeclaration && typeof needIgnore === "undefined") ||
            needIgnore
          ) {
            if (needIgnore) {
              // eslint-disable-next-line no-undefined
              needIgnore = undefined;
            }

            // eslint-disable-next-line no-continue
            continue;
          }

          const { nodes } = nNode;
          const isStringValue =
            nodes.length !== 0 && nodes[0].type === "string";
          const url = isStringValue
            ? nodes[0].value
            : valueParser.stringify(nodes);

          const rule = {
            node: getNodeFromUrlFunc(nNode),
            url,
            needQuotes: false,
            isStringValue,
          };

          if (shouldHandleRule(rule, node, result)) {
            parsedResults.push({
              node,
              rule,
              parsed,
            });
          }
        } else if (type === "string") {
          needIgnore = getWebpackIgnoreCommentValue(
            innerIndex,
            valueNode.nodes
          );

          if (
            (isIgnoreOnDeclaration && typeof needIgnore === "undefined") ||
            needIgnore
          ) {
            if (needIgnore) {
              // eslint-disable-next-line no-undefined
              needIgnore = undefined;
            }

            // eslint-disable-next-line no-continue
            continue;
          }

          const rule = {
            node: nNode,
            url: value,
            needQuotes: true,
            isStringValue: true,
          };

          if (shouldHandleRule(rule, node, result)) {
            parsedResults.push({
              node,
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
}

const plugin = (options = {}) => {
  return {
    postcssPlugin: "postcss-url-parser",
    prepare(result) {
      const parsedDeclarations = [];

      return {
        Declaration(declaration) {
          parseDeclaration(declaration, "value", result, parsedDeclarations);
        },
        async OnceExit() {
          if (parsedDeclarations.length === 0) {
            return;
          }

          const tasks = [];
          const imports = new Map();
          const replacements = new Map();

          for (const parsedResult of parsedDeclarations) {
            const { url, isStringValue } = parsedResult.rule;

            let normalizedUrl = url;
            let prefix = "";

            const queryParts = normalizedUrl.split("!");

            if (queryParts.length > 1) {
              normalizedUrl = queryParts.pop();
              prefix = queryParts.join("!");
            }

            normalizedUrl = normalizeUrl(normalizedUrl, isStringValue);

            tasks.push(
              (async () => {
                const processUrl = await options.filter(normalizedUrl);
                if (!processUrl) {
                  return null;
                }

                const splittedUrl = normalizedUrl.split(/(\?)?#/);
                const [pathname, query, hashOrQuery] = splittedUrl;

                let hash = query ? "?" : "";
                hash += hashOrQuery ? `#${hashOrQuery}` : "";

                const request = requestify(pathname, options.rootContext);

                const { resolver, context } = options;
                const resolvedUrl = await resolveRequests(resolver, context, [
                  ...new Set([request, normalizedUrl]),
                ]);

                return { url: resolvedUrl, prefix, hash, parsedResult };
              })()
            );
          }

          const results = await Promise.all(tasks);

          let hasUrlImportHelper = false;

          for (let index = 0; index <= results.length - 1; index++) {
            const item = results[index];

            if (item === null) {
              // eslint-disable-next-line no-continue
              continue;
            }

            if (!hasUrlImportHelper) {
              options.imports.push({
                importName: "___CSS_LOADER_GET_URL_IMPORT___",
                url: options.urlHandler(
                  require.resolve("../runtime/getUrl.js")
                ),
                index: -1,
              });

              hasUrlImportHelper = true;
            }

            const {
              url,
              prefix,
              hash,
              parsedResult: { node, rule, parsed },
            } = item;
            const newUrl = prefix ? `${prefix}!${url}` : url;
            let importName = imports.get(newUrl);

            if (!importName) {
              importName = `___CSS_LOADER_URL_IMPORT_${imports.size}___`;
              imports.set(newUrl, importName);

              options.imports.push({
                importName,
                url: options.urlHandler(newUrl),
                index,
              });
            }

            const { needQuotes } = item.parsedResult.rule;
            const replacementKey = JSON.stringify({ newUrl, hash, needQuotes });
            let replacementName = replacements.get(replacementKey);

            if (!replacementName) {
              replacementName = `___CSS_LOADER_URL_REPLACEMENT_${replacements.size}___`;
              replacements.set(replacementKey, replacementName);

              options.replacements.push({
                replacementName,
                importName,
                hash,
                needQuotes,
              });
            }

            // eslint-disable-next-line no-param-reassign
            rule.node.type = "word";
            // eslint-disable-next-line no-param-reassign
            rule.node.value = replacementName;

            // eslint-disable-next-line no-param-reassign
            node.value = parsed.toString();
          }
        },
      };
    },
  };
};

plugin.postcss = true;

export default plugin;
