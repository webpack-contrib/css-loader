export function throwUnexpectedToken(match, index, length, state) {
  throw new Error(`Unexpected token '${match}' at ${index} in ${state}`);
}

export function metablockEndMatch(match, index, length) {
  this.currentBlock.end = index + length - 1;
  this.currentImport = undefined;
  return 'topLevel';
}

export const IDENTIFIER = "[a-zA-Z_][a-zA-Z0-9_]*";
export const CSS_IDENTIFIER = "-*[a-zA-Z_][a-zA-Z0-9_\\-]*";

