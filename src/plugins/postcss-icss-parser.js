import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import { extractICSS, replaceValueSymbols } from 'icss-utils';
import loaderUtils from 'loader-utils';

const pluginName = 'postcss-icss-parser';

export default postcss.plugin(
  pluginName,
  () =>
    function process(css, result) {
      const importReplacements = Object.create(null);
      const { icssImports, icssExports } = extractICSS(css);

      let index = 0;

      Object.keys(icssImports).forEach((key) => {
        const url = loaderUtils.parseString(key);

        Object.keys(icssImports[key]).forEach((prop) => {
          index += 1;

          importReplacements[prop] = `___CSS_LOADER_IMPORT___${index}___`;

          result.messages.push({
            pluginName,
            type: 'icss-import',
            item: { url, export: icssImports[key][prop], index },
          });

          const alreadyIncluded = result.messages.find(
            (message) =>
              message.pluginName === pluginName &&
              message.type === 'import' &&
              message.item.url === url &&
              message.item.media === ''
          );

          if (alreadyIncluded) {
            return;
          }

          result.messages.push({
            pluginName,
            type: 'import',
            item: { url, media: '' },
          });
        });
      });

      function replaceImportsInString(str) {
        const tokens = valueParser(str);

        tokens.walk((node) => {
          if (node.type !== 'word') {
            return;
          }

          const token = node.value;
          const replacement = importReplacements[token];

          if (replacement) {
            // eslint-disable-next-line no-param-reassign
            node.value = replacement;
          }
        });

        return tokens.toString();
      }

      // Replace tokens
      css.walk((node) => {
        // Due reusing `ast` from `postcss-loader` some plugins may remove `value`, `selector` or `params` properties
        if (node.type === 'decl' && node.value) {
          // eslint-disable-next-line no-param-reassign
          node.value = replaceImportsInString(node.value.toString());
        } else if (node.type === 'rule' && node.selector) {
          // eslint-disable-next-line no-param-reassign
          node.selector = replaceValueSymbols(
            node.selector.toString(),
            importReplacements
          );
        } else if (node.type === 'atrule' && node.params) {
          // eslint-disable-next-line no-param-reassign
          node.params = replaceImportsInString(node.params.toString());
        }
      });

      // Replace tokens in export
      Object.keys(icssExports).forEach((exportName) => {
        result.messages.push({
          pluginName,
          type: 'export',
          item: {
            key: exportName,
            value: replaceImportsInString(icssExports[exportName]),
          },
        });
      });
    }
);
