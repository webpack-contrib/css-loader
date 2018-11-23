/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const path = require('path');

const loaderUtils = require('loader-utils');

module.exports = function getLocalIdent(
  loaderContext,
  localIdentName,
  localName,
  options
) {
  if (!options.context) {
    if (loaderContext.rootContext) {
      // eslint-disable-next-line no-param-reassign
      options.context = loaderContext.rootContext;
    } else if (
      loaderContext.options &&
      typeof loaderContext.options.context === 'string'
    ) {
      // eslint-disable-next-line no-param-reassign
      options.context = loaderContext.options.context;
    } else {
      // eslint-disable-next-line no-param-reassign
      options.context = loaderContext.context;
    }
  }
  const request = path.relative(options.context, loaderContext.resourcePath);
  // eslint-disable-next-line no-param-reassign
  options.content = `${options.hashPrefix + request}+${localName}`;
  // eslint-disable-next-line no-param-reassign
  localIdentName = localIdentName.replace(/\[local\]/gi, localName);
  const hash = loaderUtils.interpolateName(
    loaderContext,
    localIdentName,
    options
  );
  return hash
    .replace(new RegExp('[^a-zA-Z0-9\\-_\u00A0-\uFFFF]', 'g'), '-')
    .replace(/^((-?[0-9])|--)/, '_$1');
};
