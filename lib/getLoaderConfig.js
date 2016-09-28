var loaderUtils = require("loader-utils");

module.exports = function getLoaderConfig(loaderContext) {
    return loaderUtils.getLoaderConfig(loaderContext, 'cssLoader') || {};
};
