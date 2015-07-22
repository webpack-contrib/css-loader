/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var crypto = require('crypto');
var path = require('path');

var loaderUtils = require("loader-utils");

var DIR_REGEX = /dir(.*)dir/;
var SOURCE_HASH_REGEX = /\[(sourceHash.*)\]/;

module.exports = function getLocalIdent(inputSource, loaderContext, localIdentName, localName, options) {
	var request = loaderContext.options && typeof loaderContext.options.context === "string" ?
		loaderUtils.stringifyRequest({ context: loaderContext.options.context }, loaderUtils.getRemainingRequest(loaderContext)) :
		loaderContext.request;
	options.content = localName + " " + request;
	options.context = loaderContext.options && typeof loaderContext.options.context === "string" ? loaderContext.options.context : loaderContext.context;
	localIdentName = localIdentName.replace(/\[local\]/gi, localName);

	var sourceHashMatch = localIdentName.match(SOURCE_HASH_REGEX);
	if (sourceHashMatch && sourceHashMatch[1]) {
		var hashLen = sourceHashMatch[1].split(':')[1] || 32;
		var sourceHash = crypto.createHash("md5").update(localName + inputSource).digest("hex");
		localIdentName = localIdentName.replace(SOURCE_HASH_REGEX, sourceHash.substr(0, hashLen));
	}

	var replaceWithDir = false;
	if (localIdentName.indexOf("[dir]") !== -1) {
		localIdentName = localIdentName.replace("[dir]", "dir[path]dir");
		replaceWithDir = true;
	}

	var hash = loaderUtils.interpolateName(loaderContext, localIdentName, options);

	if (replaceWithDir) {
		var dirName = path.basename(hash.match(DIR_REGEX)[1]);
		hash = hash.replace(DIR_REGEX, dirName);
	}

	return hash.replace(/[^a-zA-Z0-9\-_]/g, "-").replace(/^([^a-zA-Z_])/, "_$1");
};
