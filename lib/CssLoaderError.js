var formatCodeFrame = require("babel-code-frame");

function formatMessage(message, loc, source) {
  var formatted = message;
  if (loc) {
    formatted = formatted + " (" + loc.line + ":" + loc.column + ")";
  }
  if (loc && source) {
    formatted =
      formatted + "\n\n" + formatCodeFrame(source, loc.line, loc.column) + "\n";
  }
  return formatted;
}

function CssLoaderError(name, message, loc, source, error) {
  Error.call(this);
  Error.captureStackTrace(this, CssLoaderError);
  this.name = name;
  this.error = error;
  this.message = formatMessage(message, loc, source);
  this.hideStack = true;
}

CssLoaderError.prototype = Object.create(Error.prototype);
CssLoaderError.prototype.constructor = CssLoaderError;

module.exports = CssLoaderError;
