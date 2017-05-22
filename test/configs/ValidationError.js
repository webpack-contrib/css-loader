import fixture from '../fixtures/index.css';

test('ValidationError', () => {
  expect(() => fixture).toThrowError(/Module build failed:/);
});
