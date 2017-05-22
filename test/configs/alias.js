import fixture from '../fixtures/alias.css';

test('Alias', () => {
  // expect(fixture).toEqual('[[0, ".a { background-image: url() }", ""]]');
  expect(fixture.toString()).toEqual('.a { background-image: url() }');
});
