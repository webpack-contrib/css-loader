import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';
import { urlToRequest } from 'loader-utils';

function makeRequestableIcssImports(icssImports) {
  return Object.keys(icssImports).reduce((accumulator, url) => {
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
  }, {});
}

export default postcss.plugin('postcss-icss-parser', () => (css, result) => {
  const importReplacements = Object.create(null);
  const extractedICSS = extractICSS(css);
  const icssImports = makeRequestableIcssImports(extractedICSS.icssImports);

  for (const [importIndex, url] of Object.keys(icssImports).entries()) {
    const importName = `___CSS_LOADER_ICSS_IMPORT_${importIndex}___`;

    result.messages.push(
      {
        type: 'import',
        value: { type: 'icss', importName, url },
      },
      {
        type: 'api-internal-import',
        value: { importName },
      }
    );

    const tokenMap = icssImports[url];
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
  }

  if (Object.keys(importReplacements).length > 0) {
    replaceSymbols(css, importReplacements);
  }

  const { icssExports } = extractedICSS;

  for (const name of Object.keys(icssExports)) {
    const value = replaceValueSymbols(icssExports[name], importReplacements);

    result.messages.push({ type: 'export', value: { name, value } });
  }
});
