/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const loaderUtils = require('loader-utils');

const processCss = require('./processCss');
const { getImportPrefix, compileExports } = require('./utils');

module.exports = function loader(content) {
  const callback = this.async();
  const options = loaderUtils.getOptions(this) || {};

  processCss(
    content,
    null,
    {
      loaderContext: this,
      loaderOptions: options,
    },
    (err, result) => {
      if (err) {
        return callback(err);
      }

      // for importing CSS
      const importUrlPrefix = getImportPrefix(this, options);

      function importItemMatcher(item) {
        const match = result.importItemRegExp.exec(item);
        const idx = +match[1];
        const importItem = result.importItems[idx];
        const importUrl = importUrlPrefix + importItem.url;
        return (
          `" + require(${loaderUtils.stringifyRequest(this, importUrl)})` +
          `[${JSON.stringify(importItem.export)}] + "`
        );
      }

      let exportJs = compileExports(
        result,
        importItemMatcher.bind(this),
        options.camelCase
      );
      if (exportJs) {
        exportJs = `module.exports = ${exportJs};`;
      }

      return callback(null, exportJs);
    }
  );
};
