/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function ReplaceMany() {
	this.replacements = [];
}

module.exports = ReplaceMany;

ReplaceMany.prototype.replace = function(start, length, newString) {
	this.replacements.push([start, start + length, newString]);
	return this;
};

ReplaceMany.prototype.run = function(string) {
	this.replacements.sort(function(a, b) {
		return b[0] - a[0];
	});
	var result = [string];
	this.replacements.forEach(function(repl) {
		var str = result.pop();
		var done = str.substr(repl[1]);
		var leftover = str.substr(0, repl[0]);
		result.push(done, repl[2], leftover);
	});
	result.reverse();
	return result.join("");
};
