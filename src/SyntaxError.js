import formatCodeFrame from 'babel-code-frame';

export default class SyntaxError extends Error {
  constructor(error) {
    super(error);

    const { reason, message, line, column, source } = error;

    this.name = 'SyntaxError';
    this.message = reason || message;

    if (line && column) {
      this.message += ` (${line}:${column})`;

      if (source) {
        this.message += `\n\n${formatCodeFrame(source, line, column)}\n`;
      }
    }

    Error.captureStackTrace(this, this.constructor);
  }
}
