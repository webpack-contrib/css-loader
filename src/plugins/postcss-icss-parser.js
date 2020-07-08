import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';

import { normalizeUrl, resolveRequests, isUrlRequestable } from '../utils';

function makeRequestableIcssImports(icssImports, rootContext) {
  return Object.keys(icssImports).reduce((accumulator, url) => {
    const tokensMap = icssImports[url];
    const tokens = Object.keys(tokensMap);

    if (tokens.length === 0) {
      return accumulator;
    }

    const isRequestable = isUrlRequestable(url);

    let normalizedUrl;

    if (isRequestable) {
      normalizedUrl = normalizeUrl(url, true, rootContext);
    }

    const key = typeof normalizedUrl !== 'undefined' ? normalizedUrl : url;

    if (!accumulator[key]) {
      // eslint-disable-next-line no-param-reassign
      accumulator[key] = { url, tokenMap: tokensMap };
    } else {
      // eslint-disable-next-line no-param-reassign
      accumulator[key] = {
        url,
        tokenMap: {
          ...accumulator[key].tokenMap,
          ...tokensMap,
        },
      };
    }

    return accumulator;
  }, {});
}

export default postcss.plugin(
  'postcss-icss-parser',
  (options) => (css, result) => {
    return new Promise(async (resolve, reject) => {
      const importReplacements = Object.create(null);
      const extractedICSS = extractICSS(css);
      const icssImports = makeRequestableIcssImports(
        extractedICSS.icssImports,
        options.rootContext
      );

      const tasks = [];

      let index = 0;

      for (const [importIndex, normalizedUrl] of Object.keys(
        icssImports
      ).entries()) {
        const { url } = icssImports[normalizedUrl];

        index += 1;

        tasks.push(
          Promise.resolve(index).then(async (currentIndex) => {
            const importName = `___CSS_LOADER_ICSS_IMPORT_${importIndex}___`;
            const { resolver, context } = options;

            let resolvedUrl;

            try {
              resolvedUrl = await resolveRequests(resolver, context, [
                ...new Set([normalizedUrl, url]),
              ]);
            } catch (error) {
              throw error;
            }

            result.messages.push(
              {
                type: 'import',
                value: {
                  // 'CSS_LOADER_ICSS_IMPORT'
                  order: 0,
                  importName,
                  url: options.urlHandler
                    ? options.urlHandler(resolvedUrl)
                    : resolvedUrl,
                  index: currentIndex,
                },
              },
              {
                type: 'api-import',
                value: {
                  // 'CSS_LOADER_ICSS_IMPORT'
                  order: 0,
                  type: 'internal',
                  importName,
                  dedupe: true,
                  index: currentIndex,
                },
              }
            );

            const { tokenMap } = icssImports[normalizedUrl];
            const tokens = Object.keys(tokenMap);

            for (const [replacementIndex, token] of tokens.entries()) {
              const replacementName = `___CSS_LOADER_ICSS_IMPORT_${importIndex}_REPLACEMENT_${replacementIndex}___`;
              const localName = tokenMap[token];

              importReplacements[token] = replacementName;

              result.messages.push({
                type: 'icss-replacement',
                value: { replacementName, importName, localName },
              });
            }
          })
        );
      }

      try {
        await Promise.all(tasks);
      } catch (error) {
        reject(error);
      }

      if (Object.keys(importReplacements).length > 0) {
        replaceSymbols(css, importReplacements);
      }

      const { icssExports } = extractedICSS;

      for (const name of Object.keys(icssExports)) {
        const value = replaceValueSymbols(
          icssExports[name],
          importReplacements
        );

        result.messages.push({ type: 'export', value: { name, value } });
      }

      resolve();
    });
  }
);
