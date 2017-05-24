import fixture from '../fixtures/index.css';

test('Map', () => {
  expect(fixture.toString()).toContain('/*# sourceMappingURL=data:application/json;charset=utf-8;base64,');
});
