import fixture from '../fixtures/index.css';
/* eslint-disable */
test('Index', () => {
  expect(fixture[0]).toEqual([0, ".a { width: 100%; }", ""]);
  expect(fixture.toString()).toEqual('.a { width: 100%; }');
});
