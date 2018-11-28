const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const icssUtils = require('icss-utils');
const Tokenizer = require('css-selector-tokenizer');
const loaderUtils = require('loader-utils');

module.exports = postcss.plugin(
  'postcss-parser',
  (options) =>
    function process(css) {
      const importItems = options.importItems || [];
      const urlItems = options.urlItems || [];
      const icss = icssUtils.extractICSS(css);

      const imports = {};
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
        if (options.import) {
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
        return str;
      }

      Object.keys(exports).forEach((exportName) => {
        exports[exportName] = replaceImportsInString(exports[exportName]);
      });

      function processNode(item) {
        switch (item.type) {
          case 'value':
            item.nodes.forEach(processNode);
            break;
          case 'nested-item':
            item.nodes.forEach(processNode);
            break;
          case 'item': {
            const importIndex = imports[`$${item.name}`];
            if (typeof importIndex === 'number') {
              // eslint-disable-next-line no-param-reassign
              item.name = `___CSS_LOADER_IMPORT___${importIndex}___`;
            }
            break;
          }
          // no default
        }
      }

      css.walkDecls((decl) => {
        const values = Tokenizer.parseValues(decl.value);

        values.nodes.forEach((value) => {
          value.nodes.forEach(processNode);
        });

        // eslint-disable-next-line no-param-reassign
        decl.value = Tokenizer.stringifyValues(values);
      });

      css.walkAtRules((atrule) => {
        if (typeof atrule.params === 'string') {
          // eslint-disable-next-line no-param-reassign
          atrule.params = replaceImportsInString(atrule.params);
        }
      });

      /* eslint-disable no-param-reassign */
      options.importItems = importItems;
      options.urlItems = urlItems;
      options.exports = exports;
      /* eslint-enable no-param-reassign */
    }
);
