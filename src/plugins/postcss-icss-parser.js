import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';

const pluginName = 'postcss-icss-parser';

export default postcss.plugin(
  pluginName,
  () =>
    function process(css, result) {
      const importReplacements = Object.create(null);
      const { icssImports, icssExports } = extractICSS(css);

      Object.keys(icssImports).forEach((url, importIndex) => {
        const tokens = Object.keys(icssImports[url]);

        if (tokens.length === 0) {
          return;
        }

        const importName = `___CSS_LOADER_ICSS_IMPORT_${importIndex}___`;

        result.messages.push({
          pluginName,
          type: 'import',
          value: { type: 'icss-import', name: importName, url, media: '' },
        });

        tokens.forEach((token, replacementIndex) => {
          const name = `___CSS_LOADER_ICSS_IMPORT_${importIndex}_REPLACEMENT_${replacementIndex}___`;
          const localName = icssImports[url][token];

          importReplacements[token] = name;

          result.messages.push({
            pluginName,
            type: 'replacer',
            value: { type: 'icss-import', name, importName, localName },
          });
        });
      });

      replaceSymbols(css, importReplacements);

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
