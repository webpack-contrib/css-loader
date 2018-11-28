const postcss = require('postcss');
const Tokenizer = require('css-selector-tokenizer');
const loaderUtils = require('loader-utils');

const pluginName = 'postcss-url-parser';

module.exports = postcss.plugin(
  pluginName,
  (options) =>
    function process(css) {
      const urlItems = [];

      function processNode(item) {
        switch (item.type) {
          case 'value':
            item.nodes.forEach(processNode);
            break;
          case 'nested-item':
            item.nodes.forEach(processNode);
            break;
          case 'url':
            if (
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

      // eslint-disable-next-line no-param-reassign
      options.urlItems = urlItems;
    }
);
