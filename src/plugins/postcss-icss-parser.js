import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';
import { urlToRequest } from 'loader-utils';

const pluginName = 'postcss-icss-parser';

export default postcss.plugin(
  pluginName,
  () =>
    function process(css, result) {
      const importReplacements = Object.create(null);
      const { icssImports, icssExports } = extractICSS(css);

      const normalizedIcssImports = Object.keys(icssImports).reduce(
        (accumulator, url) => {
          const tokensMap = icssImports[url];
          const tokens = Object.keys(tokensMap);

          if (tokens.length === 0) {
            return accumulator;
          }

          const normalizedUrl = urlToRequest(url);

          if (!accumulator[normalizedUrl]) {
            // eslint-disable-next-line no-param-reassign
            accumulator[normalizedUrl] = tokensMap;
          } else {
            // eslint-disable-next-line no-param-reassign
            accumulator[normalizedUrl] = {
              ...accumulator[normalizedUrl],
              ...tokensMap,
            };
          }

          return accumulator;
        },
        {}
      );

      Object.keys(normalizedIcssImports).forEach((url, importIndex) => {
        const importName = `___CSS_LOADER_ICSS_IMPORT_${importIndex}___`;

        result.messages.push({
          pluginName,
          type: 'import',
          value: { type: 'icss-import', name: importName, url },
        });

        const tokenMap = normalizedIcssImports[url];
        const tokens = Object.keys(tokenMap);

        tokens.forEach((token, replacementIndex) => {
          const name = `___CSS_LOADER_ICSS_IMPORT_${importIndex}_REPLACEMENT_${replacementIndex}___`;
          const localName = tokenMap[token];

          importReplacements[token] = name;

          result.messages.push({
            pluginName,
            type: 'replacer',
            value: { type: 'icss-import', name, importName, localName },
          });
        });
      });

      if (Object.keys(importReplacements).length > 0) {
        replaceSymbols(css, importReplacements);
      }

      Object.keys(icssExports).forEach((name) => {
        const value = replaceValueSymbols(
          icssExports[name],
          importReplacements
        );

        result.messages.push({
          pluginName,
          type: 'export',
          value: { name, value },
        });
      });
    }
);
