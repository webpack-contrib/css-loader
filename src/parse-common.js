export function throwUnexpectedToken(match, index) {
  throw new Error(`Unexpected token '${match}' at ${index}`);
}

export function metablockEndMatch(match, index, length) {
  const offset = length - 1;
  this.currentBlock.end = index + offset;
  this.currentImport = null;
  return 'topLevel';
}

export const IDENTIFIER = '[a-zA-Z_][a-zA-Z0-9_]*';
export const CSS_IDENTIFIER = '-*[a-zA-Z_][a-zA-Z0-9_\\-]*';
