import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';
import loaderUtils from 'loader-utils';

const pluginName = 'postcss-icss-parser';

function hasImportMessage(messages, url) {
  return messages.find(
    (message) =>
      message.pluginName === pluginName &&
      message.type === 'import' &&
      message.value &&
      message.value.url === url &&
      message.value.media === ''
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
          const name = `___CSS_LOADER_IMPORT___${index}___`;

          index += 1;
          importReplacements[token] = name;

          result.messages.push({
            pluginName,
            type: 'replacer',
            value: {
              type: 'icss-import',
              name,
              url,
              export: icssImports[importUrl][token],
            },
          });

          if (!hasImportMessage(result.messages, url)) {
            result.messages.push({
              pluginName,
              type: 'import',
              value: { type: 'icss-import', url, media: '', name },
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
          type: 'export',
          value: { name, value },
        });
      }
    }
);
