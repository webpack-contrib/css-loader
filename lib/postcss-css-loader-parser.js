const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const icssUtils = require('icss-utils');
const Tokenizer = require('css-selector-tokenizer');
const loaderUtils = require('loader-utils');

module.exports = postcss.plugin(
  'postcss-css-loader-parser',
  (options) => (css, result) => {
    const imports = {};
    let exports = {};
    const importItems = [];
    const urlItems = [];

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

    if (options.import) {
      css.walkAtRules(/^import$/i, (atrule) => {
        // Convert only top-level @import
        if (atrule.parent.type !== 'root') {
          return;
        }

        if (atrule.nodes) {
          result.warn(
            "It looks like you didn't end your @import statement correctly. " +
              'Child nodes are attached to it.',
            { node: atrule }
          );
          return;
        }

        const values = Tokenizer.parseValues(atrule.params);
        let [url] = values.nodes[0].nodes;

        if (url && url.type === 'url') {
          ({ url } = url);
        } else if (url && url.type === 'string') {
          url = url.value;
        } else {
          result.warn(`Unable to find uri in '${atrule.toString()}'`, {
            node: atrule,
          });

          return;
        }

        if (!url.replace(/\s/g, '').length) {
          result.warn(`Unable to find uri in '${atrule.toString()}'`, {
            node: atrule,
          });

          return;
        }

        values.nodes[0].nodes.shift();

        const mediaQuery = Tokenizer.stringifyValues(values);

        if (loaderUtils.isUrlRequest(url)) {
          url = loaderUtils.urlToRequest(url);
        }

        importItems.push({
          url,
          mediaQuery,
        });
        atrule.remove();
      });
    }

    const icss = icssUtils.extractICSS(css);
    exports = icss.icssExports;
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
        case 'url':
          if (
            options.url &&
            item.url.replace(/\s/g, '').length &&
            !/^#/.test(item.url) &&
            loaderUtils.isUrlRequest(item.url)
          ) {
            // Strip quotes, they will be re-added if the module needs them
            /* eslint-disable no-param-reassign */
            item.stringType = '';
            delete item.innerSpacingBefore;
            delete item.innerSpacingAfter;
            const { url } = item;
            item.url = `___CSS_LOADER_URL___${urlItems.length}___`;
            /* eslint-enable no-param-reassign */
            urlItems.push({
              url,
            });
          }
          break;
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
