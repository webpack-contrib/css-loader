/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const loaderUtils = require('loader-utils');

const processCss = require('./processCss');
const {
  getImportPrefix,
  placeholderImportItemReplacer,
  compileExports,
} = require('./utils');

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

      let exportJs = compileExports(
        result,
        placeholderImportItemReplacer(this, result, importUrlPrefix, true),
        options.camelCase
      );
      if (exportJs) {
        exportJs = `module.exports = ${exportJs};`;
      }

      return callback(null, exportJs);
    }
  );
};
