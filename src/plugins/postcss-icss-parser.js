import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';
import loaderUtils from 'loader-utils';
import cc from 'camelcase';

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

function camelCase(str) {
  return cc(str);
}

function dashesCamelCase(str) {
  return str.replace(/-+(\w)/g, (match, firstLetter) =>
    firstLetter.toUpperCase()
  );
}

function getExportItem(key, value, localsStyle) {
  let targetKey;
  const items = [];

  function addEntry(k) {
    items.push(`\t${JSON.stringify(k)}: ${JSON.stringify(value)}`);
  }

  switch (localsStyle) {
    case 'camelCase':
      addEntry(key);
      targetKey = camelCase(key);

      if (targetKey !== key) {
        addEntry(targetKey);
      }
      break;
    case 'camelCaseOnly':
      addEntry(camelCase(key));
      break;
    case 'dashes':
      addEntry(key);
      targetKey = dashesCamelCase(key);

      if (targetKey !== key) {
        addEntry(targetKey);
      }
      break;
    case 'dashesOnly':
      addEntry(dashesCamelCase(key));
      break;
    case 'asIs':
    default:
      addEntry(key);
      break;
  }

  return items;
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
          export: getExportItem(
            exportName,
            replaceValueSymbols(icssExports[exportName], importReplacements),
            options.exportLocalsStyle
          ).join(',\n'),
          type: 'export',
        });
      }
    }
);
