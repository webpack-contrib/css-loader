export default class Warning extends Error {
  constructor(warning) {
    super(warning);

    this.name = 'Warning';
    this.message = warning.toString();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
