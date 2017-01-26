/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

function loadersToRequest(loaders) {
	return loaders.map(function(loader) {
		var request;
		if (typeof loader == "string") {
			request = require.resolve(loader);
		} else {
			request = require.resolve(loader.loader);
			if (loader.query) {
				request = request + "?" + JSON.stringify(loader.query);
			}
		}
		return request;
	}).join("!");
}

module.exports = function getImportPrefix(loaderContext, query) {
	if (query.importLoaders === false)
		return "";
	var loadersRequest = "!" + loaderContext.loaders[loaderContext.loaderIndex].request;
	if (query.importLoaders) {
		if (query.importLoaders.afterCssLoader) {
			loadersRequest = "!" + loadersToRequest(query.importLoaders.afterCssLoader) + loadersRequest;
		}
		if (query.importLoaders.beforeCssLoader) {
			loadersRequest = loadersRequest + "!" + loadersToRequest(query.importLoaders.beforeCssLoader);
		}
	}
	return "-" + loadersRequest + "!";
};

