import loader from '../src';
import CJSLoader from '../src/cjs';

describe('CJS', () => {
  // Todo enable after refactor using import

  it('should export loader', () => {
    expect(CJSLoader).toEqual(loader);
  });
});
