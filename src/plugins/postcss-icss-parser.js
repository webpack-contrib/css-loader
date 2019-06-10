import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';
import loaderUtils from 'loader-utils';

import { getExportItemCode, getImportItemCode } from '../utils';

const pluginName = 'postcss-icss-parser';

function hasImportMessage(messages, url) {
  return messages.find(
    (message) =>
      message.pluginName === pluginName &&
      message.type === 'import' &&
      message.item.url === url &&
      message.item.media === ''
  );
}

export default postcss.plugin(
  pluginName,
  (options = {}) =>
    function process(css, result) {
      const importReplacements = Object.create(null);
      const { icssImports, icssExports } = extractICSS(css);

      let index = 0;

      for (const importUrl of Object.keys(icssImports)) {
        const url = loaderUtils.parseString(importUrl);

        for (const token of Object.keys(icssImports[importUrl])) {
          index += 1;
          importReplacements[token] = `___CSS_LOADER_IMPORT___${index}___`;

          result.messages.push({
            pluginName,
            type: 'icss-import',
            item: { url, export: icssImports[importUrl][token], index },
          });

          if (!hasImportMessage(result.messages, url)) {
            const media = '';
            const { loaderContext, importPrefix } = options;

            result.messages.push({
              pluginName,
              type: 'import',
              import: getImportItemCode(
                { url, media },
                loaderContext,
                importPrefix
              ),
              item: { url, media },
            });
          }
        }
      }

      replaceSymbols(css, importReplacements);

      for (const exportName of Object.keys(icssExports)) {
        const name = exportName;
        const value = replaceValueSymbols(
          icssExports[name],
          importReplacements
        );

        result.messages.push({
          pluginName,
          export: getExportItemCode(name, value, options.exportLocalsStyle),
          type: 'export',
          item: { name, value },
        });
      }
    }
);
