module.exports = function (loaderContext, query) {
	var givenExternals = query.externals || (loaderContext.externals || {});
	var externals = {};

	if (Array.isArray(givenExternals)) {
		givenExternals.forEach(function (external) {
			if (typeof external === 'object') {
				externals = Object.assign({}, externals, external);
			}
		});
	} else {
		externals = givenExternals;
	}

	if (typeof externals === 'string') {
		externals = JSON.parse(externals);
	}

	return externals;
}
