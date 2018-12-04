import loader from '../src';
import CJSLoader from '../src/cjs';

describe('CJS', () => {
  it('should exported loader', () => {
    expect(CJSLoader).toEqual(loader);
  });
});
