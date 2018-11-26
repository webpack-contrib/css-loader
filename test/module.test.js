const path = require('path');
const fs = require('fs');

const test = require('./helpers').testSingleItem;

const testCasesPath = path.join(__dirname, 'moduleTestCases');
const testCases = fs.readdirSync(testCasesPath);

describe('module', () => {
  testCases.forEach((name) => {
    const source = fs.readFileSync(
      path.join(testCasesPath, name, 'source.css'),
      'utf-8'
    );
    const expected = fs.readFileSync(
      path.join(testCasesPath, name, 'expected.css'),
      'utf-8'
    );

    test(name, source, expected, '?modules&sourceMap&localIdentName=_[local]_');
  });
});
