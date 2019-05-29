import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';
import loaderUtils from 'loader-utils';

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
  () =>
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
            result.messages.push({
              pluginName,
              type: 'import',
              item: { url, media: '' },
            });
          }
        }
      }

      replaceSymbols(css, importReplacements);

      for (const exportName of Object.keys(icssExports)) {
        result.messages.push({
          pluginName,
          type: 'export',
          item: {
            key: exportName,
            value: replaceValueSymbols(
              icssExports[exportName],
              importReplacements
            ),
          },
        });
      }
    }
);
