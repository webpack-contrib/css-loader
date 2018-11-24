/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function getImportPrefix(loaderContext, query) {
  if (query.importLoaders === false) {
    return '';
  }

  const importLoaders = parseInt(query.importLoaders, 10) || 0;
  const loadersRequest = loaderContext.loaders
    .slice(
      loaderContext.loaderIndex,
      loaderContext.loaderIndex + 1 + importLoaders
    )
    .map((x) => x.request)
    .join('!');
  return `-!${loadersRequest}!`;
};
