import formatCodeFrame from 'babel-code-frame';

export default class SyntaxError extends Error {
  constructor(err) {
    super(err);

    this.name = 'Syntax Error';
    this.message = err.reason ? err.reason : err.message;

    if (err.line && err.column) {
      this.message += ` (${err.line}:${err.column})`;

      if (err.source) {
        this.message += `\n\n${formatCodeFrame(
          err.source,
          err.line,
          err.column
        )}\n`;
      }
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
