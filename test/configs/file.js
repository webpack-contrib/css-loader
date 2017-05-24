import fixture from '../fixtures/file.css';

test('File', () => {
  expect(fixture.toString()).toEqual('.a { background: url(require(./assets/file.png);}');
});

