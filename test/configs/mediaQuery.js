import fixture from '../fixtures/media.css';

test('mediaQuery', () => {
  expect(fixture).toEqual('[[0, .class { a: b c d; }\n, ""]]');
  expect(fixture.toString()).toEqual(`@media screen and (max-width: 2400px) { .a { width: 100%; } }
@media screen and (max-width: 1600px) { .a { width: 75%; } }
@media screen and (max-width: 800px) { .a { width: 50%; } }
@media screen and (max-width: 400px) { .a { width: 20%; } }

@media screen and (max-width: 2400px) { .b { width: 100%; } }
@media screen and (max-width: 1600px) { .b { width: 75%; } }
@media screen and (max-width: 800px) { .b { width: 50%; } }
@media screen and (max-width: 400px) { .b { width: 20%; } }`);
});
