export default class SyntaxError extends Error {
  constructor(error) {
    super(error);

    const { reason, line, column } = error;

    this.name = 'SyntaxError';
    this.message = reason;

    if (line && column) {
      this.message += ` (${line}:${column})`;
    }

    const code = error.showSourceCode();

    if (code) {
      this.message += `\n\n${code}\n`;
    }

    // We don't need stack https://github.com/postcss/postcss/blob/ebaa53640657fb028803d624395ea76a8df11cbe/docs/guidelines/runner.md#31-dont-show-js-stack-for-csssyntaxerror
    this.stack = false;
  }
}
