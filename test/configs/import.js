import fixture from '../fixtures/import.css';

test('Import', () => {
  expect(fixture).toEqual([[2, '.a { width: 100%; }', ''], [1, '.i { color: green; }', '']]);
  expect(fixture.toString()).toEqual('.a { width: 100%; }\n.i { color: green; }');
});
