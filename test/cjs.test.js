import loader from '../src';
import CJSLoader from '../src/cjs';

describe('CJS', () => {
  it('should export loader', () => {
    expect(CJSLoader).toEqual(loader);
  });
});
