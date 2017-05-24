import fixture from '../fixtures/error.css';

test('Syntax Error', () => {
  expect(fixture).toContain(/Syntax Error/);
});
