const OneLetterCss = require('../src/plugins/one-letter-css');

/* webpack set */
const workSets = [
  {
    in: [
      {
        resourcePath: './file1.css',
      },
      '[hash:base64:8]',
      'theme-white',
    ],
    out: 'a2zADNwsK',
  },
  {
    in: [
      {
        resourcePath: './file1.css',
      },
      '[hash:base64:8]',
      'theme-blue',
    ],
    out: 'b2zADNwsK',
  },
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[hash:base64:8]',
      'text-white',
    ],
    out: 'a2jlx459O',
  },
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[hash:base64:8]',
      'text-blue',
    ],
    out: 'b2jlx459O',
  },
  // for develop case
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[local]__[hash:base64:8]',
      'text-blue',
    ],
    out: 'text-blue__b2jlx459O',
  },
];

/* encoding test set */
const encodingSets = [
  // [in, out]
  // can't be empty, not use as prefix
  [0, ''],
  // start prefix from 1
  [1, 'a'],
  [2, 'b'],
  [25, 'y'],
  [26, 'z'],
  [27, 'A'],
  [28, 'B'],
  [51, 'Y'],
  [52, 'Z'],
  [53, '_'],
  [54, '0'],
  [55, '1'],
  [62, '8'],
  [63, '9'],
  [64, '-'],
  [65, 'aa'],
  [66, 'ab'],
  [116, 'aZ'],
  [117, 'a_'],
  [118, 'a0'],
  [127, 'a9'],
  [128, 'a-'],
  [129, 'ba'],
  [130, 'bb'],
  [190, 'b8'],
  [191, 'b9'],
  [192, 'b-'],
  [193, 'ca'],
  [194, 'cb'],
  [4158, '-8'],
  [4159, '-9'],
  // last 2-symbols part, '--', 64*65 (64*64 2-symbols + 64 1-letter)
  [4160, '--'],
  // start 3-symbols part
  [4161, 'aaa'],
  [4162, 'aab'],
];

const MyOneLetterCss = new OneLetterCss();

describe('testing work cases', () => {
  workSets.forEach((set) => {
    it(`should check classname full generate`, () => {
      expect(MyOneLetterCss.getLocalIdent(...set.in)).toEqual(set.out);
    });
  });

  encodingSets.forEach(([valIn, valOut]) => {
    it(`should check classname prefix generate`, () => {
      expect(MyOneLetterCss.getNamePrefix(valIn)).toEqual(valOut);
    });
  });
});

it('should check prefix when [d_-] first letter at result', () => {
  const hashRule = '[hash:base64:1]';
  const filePath = {
    resourcePath: './myFilePath.css'
  };
  let result = '';

  // check [\d_-] rule
  for (let i = 1; i <= 53; i += 1) {
    const className = `a${i}`;

    result = MyOneLetterCss.getLocalIdent(filePath, hashRule, className);
  }

  expect(result).toEqual('__1gLgDKv5');
});
