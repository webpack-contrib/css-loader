const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const icssUtils = require('icss-utils');
const loaderUtils = require('loader-utils');

const pluginName = 'postcss-icss-parser';

module.exports = postcss.plugin(
  pluginName,
  (options) =>
    function process(css) {
      const importItems = options.importItems || [];
      const urlItems = options.urlItems || [];
      const imports = {};
      const icss = icssUtils.extractICSS(css);
      const exports = icss.icssExports;

      Object.keys(icss.icssImports).forEach((key) => {
        const url = loaderUtils.parseString(key);

        Object.keys(icss.icssImports[key]).forEach((prop) => {
          imports[`$${prop}`] = importItems.length;
          importItems.push({
            url,
            export: icss.icssImports[key][prop],
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
          const importIndex = imports[`$${token}`];

          if (typeof importIndex === 'number') {
            // eslint-disable-next-line no-param-reassign
            node.value = `___CSS_LOADER_IMPORT___${importIndex}___`;
          }
        });

        return tokens.toString();
      }

      // Replace tokens in declarations
      css.walkDecls((decl) => {
        // eslint-disable-next-line no-param-reassign
        decl.value = replaceImportsInString(decl.value.toString());
      });

      // Replace tokens in at-rules
      css.walkAtRules((atrule) => {
        // eslint-disable-next-line no-param-reassign
        atrule.params = replaceImportsInString(atrule.params.toString());
      });

      // Replace tokens in export
      Object.keys(exports).forEach((exportName) => {
        exports[exportName] = replaceImportsInString(exports[exportName]);
      });

      /* eslint-disable no-param-reassign */
      options.importItems = importItems;
      options.urlItems = urlItems;
      options.exports = exports;
      /* eslint-enable no-param-reassign */
    }
);
