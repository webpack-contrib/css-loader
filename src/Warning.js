export default class Warning extends Error {
  constructor(warning) {
    super(warning);

    this.name = 'Warning';
    this.message = warning.toString();

    // We don't need stack https://github.com/postcss/postcss/blob/ebaa53640657fb028803d624395ea76a8df11cbe/docs/guidelines/runner.md#31-dont-show-js-stack-for-csssyntaxerror
    this.stack = false;
  }
}
