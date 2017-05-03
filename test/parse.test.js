import fs from 'fs';
import path from 'path';
import parse from '../src/parse';

describe('parse', () => {
  const fixtures = path.resolve(__dirname, 'parse-fixtures');
  const tests = fs.readdirSync(fixtures).filter(name => /\.css$/.test(name));
  tests.forEach((filename) => {
    it(`should parse ${filename}`, () => {
      const filepath = path.resolve(fixtures, filename);
      const content = fs.readFileSync(filepath, 'utf-8').replace(/\r\n?/g, '\n');
      const result = parse(content);
      expect(result).toMatchSnapshot();
    });
  });
});
