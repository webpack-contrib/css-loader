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

function visitor(result, parsedResults, node, key) {
  if (!needParseDeclaration.test(node[key])) {
    return;
  }

  const value =
    typeof node.raws.value === "undefined" ? node[key] : node.raws.value.raw;
  const parsed = valueParser(value);

  let needIgnore;

  if (typeof node.raws.between !== "undefined") {
    const lastCommentIndex = node.raws.between.lastIndexOf("/*");

    const matched = node.raws.between
      .slice(lastCommentIndex)
      .match(webpackIgnoreCommentRegexp);

    if (matched) {
      needIgnore = matched[2] === "true";
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

  parsed.walk((valueNode) => {
    if (valueNode.type === "comment") {
      const matched = valueNode.value.match(webpackIgnoreCommentRegexp);

      needIgnore = matched && matched[2] === "true";

      return;
    }

    if (valueNode.type !== "function") {
      return;
    }

    if (isIgnoreOnDeclaration && needIgnore !== false) {
      return;
    }

    if (needIgnore) {
      // eslint-disable-next-line no-undefined
      needIgnore = undefined;
      return;
    }

    if (isUrlFunc.test(valueNode.value)) {
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
      // TODO bug
      let imageSetWebpackIgnore = false;

      for (const nNode of valueNode.nodes) {
        const { type, value } = nNode;

        if (type === "comment") {
          if (webpackIgnoreCommentRegexp.test(value)) {
            imageSetWebpackIgnore = true;
          }
          // eslint-disable-next-line no-continue
          continue;
        }

        if (type === "function" && isUrlFunc.test(value)) {
          if (imageSetWebpackIgnore) {
            imageSetWebpackIgnore = false;
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
          if (imageSetWebpackIgnore) {
            imageSetWebpackIgnore = false;
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
      const parsedResults = [];

      return {
        Declaration(declaration) {
          visitor(result, parsedResults, declaration, "value");
        },
        async OnceExit() {
          if (parsedResults.length === 0) {
            return;
          }

          const tasks = [];
          const imports = new Map();
          const replacements = new Map();

          let hasUrlImportHelper = false;

          for (const parsedResult of parsedResults) {
            const { url, isStringValue } = parsedResult.rule;

            let normalizedUrl = url;
            let prefix = "";

            const queryParts = normalizedUrl.split("!");

            if (queryParts.length > 1) {
              normalizedUrl = queryParts.pop();
              prefix = queryParts.join("!");
            }

            normalizedUrl = normalizeUrl(normalizedUrl, isStringValue);

            if (!options.filter(normalizedUrl)) {
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

            const splittedUrl = normalizedUrl.split(/(\?)?#/);
            const [pathname, query, hashOrQuery] = splittedUrl;

            let hash = query ? "?" : "";
            hash += hashOrQuery ? `#${hashOrQuery}` : "";

            const request = requestify(pathname, options.rootContext);

            tasks.push(
              (async () => {
                const { resolver, context } = options;
                const resolvedUrl = await resolveRequests(resolver, context, [
                  ...new Set([request, normalizedUrl]),
                ]);

                return { url: resolvedUrl, prefix, hash, parsedResult };
              })()
            );
          }

          const results = await Promise.all(tasks);

          for (let index = 0; index <= results.length - 1; index++) {
            const {
              url,
              prefix,
              hash,
              parsedResult: { node, rule, parsed },
            } = results[index];
            const newUrl = prefix ? `${prefix}!${url}` : url;
            const importKey = newUrl;
            let importName = imports.get(importKey);

            if (!importName) {
              importName = `___CSS_LOADER_URL_IMPORT_${imports.size}___`;
              imports.set(importKey, importName);

              options.imports.push({
                importName,
                url: options.urlHandler(newUrl),
                index,
              });
            }

            const { needQuotes } = rule;
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
