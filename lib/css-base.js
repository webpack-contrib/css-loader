/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
//
function CssObject(css) {
	Object.defineProperty(this, "$css", {
		enumerable: false,
		writable: true
	});
	Object.assign(this, css);
}

// return the list of modules as css string
CssObject.prototype.toString = function toString() {
	return this.$css.imports.reduce(function(str, item) {
		if(item[1]) {
			return str + "@media " + item[1] + "{" + item[0].content + "}";
		}
		return str + item[0].content;
	}, "") + this.$css.content;
};

module.exports = function(css, $css) {
	css.$css = $css;
	return new CssObject(css);
};
