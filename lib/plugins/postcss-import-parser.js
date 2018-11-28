const postcss = require('postcss');
const loaderUtils = require('loader-utils');
const Tokenizer = require('css-selector-tokenizer');

const pluginName = 'postcss-import-parser';

module.exports = postcss.plugin(
  pluginName,
  (options) =>
    function process(css, result) {
      const importItems = [];

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

        url = url.trim();

        if (loaderUtils.isUrlRequest(url)) {
          url = loaderUtils.urlToRequest(url);
        }

        importItems.push({
          url,
          mediaQuery,
        });

        atrule.remove();
      });

      // eslint-disable-next-line no-param-reassign
      options.importItems = importItems;
    }
);
