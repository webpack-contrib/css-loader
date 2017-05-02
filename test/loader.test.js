/* global describe it expect */

import fs from 'fs';
import loader from '../src/';
import path from 'path';

describe('loader', () => {
  const fixtures = path.resolve(__dirname, 'loader-fixtures');
  const tests = fs.readdirSync(fixtures).filter((name) => /\.css$/.test(name));
  tests.forEach((filename) => {
    it(`should process ${filename}`, () => {
      const filepath = path.resolve(fixtures, filename);
      const content = fs.readFileSync(filepath, 'utf-8').replace(/\r\n?/g, '\n');
      const result = loader.call({}, content);
      expect(result).toMatchSnapshot();
    });
  });
});
