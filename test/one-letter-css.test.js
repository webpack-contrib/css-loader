const OneLetterCss = require('../src/plugins/one-letter-css');
const HashLenSuggest = require('../src/plugins/hash-len-suggest');

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
  // check shot hashLen
  {
    in: [
      {
        resourcePath: './file3.css'
      },
      '[hash:base64:4]',
      'text-orig'
    ],
    out: 'a1zla'
  },
  // check wrong hashRule
  {
    in: [
      {
        resourcePath: './file4.css'
      },
      '[hash:base64]',
      'text-wrong'
    ],
    out: 'a2iH0UPjV'
  }
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

const statSample = {
  './file1.css': {
    lastUsed: 2,
    name: '2zADNwsK',
    ruleNames: {
      'theme-blue': 'b2zADNwsK',
      'theme-white': 'a2zADNwsK'
    }
  },
  './file2.css': {
    lastUsed: 2,
    name: '2jlx459O',
    ruleNames: {
      'text-blue': 'b2jlx459O',
      'text-white': 'a2jlx459O'
    }
  },
  './file3.css': {
    lastUsed: 1,
    name: '1zla',
    ruleNames: {
      'text-orig': 'a1zla'
    }
  },
  './file4.css': {
    lastUsed: 1,
    name: '2iH0UPjV',
    ruleNames: {
      'text-wrong': 'a2iH0UPjV'
    }
  }
};

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

  it('should check getStat()', () => {
    const result = MyOneLetterCss.getStat();

    expect(result).toEqual(statSample);
  });
});

it('should check prefix when [d-] first letter at result', () => {
  const hashRule = '[hash:base64:1]';
  const filePath = {
    resourcePath: './myFilePath.css'
  };
  let result = '';

  // перебираем, пока не дойдём до символов, требующих экранирования [\d_-]
  for (let i = 1; i <= 53; i += 1) {
    const className = `a${i}`;

    result = MyOneLetterCss.getLocalIdent(filePath, hashRule, className);
  }

  expect(result).toEqual('__1');

  // find collisions (first million check - clear :)
  // const hashes = {};
  //
  // for (let i = 1; i <= 1000000; i += 1) {
  //     const className = `a${i}`;
  //
  //     result = MyShortCssClasses.getLocalIdentWithFileHash(filePath, hashRule, className);
  //
  //     hashes[result] = hashes[result] || { i: [], count: 0 };
  //     hashes[result].count += 1;
  //     hashes[result].i.push(i);
  // }
  //
  // const collisions = [];
  //
  // Object.entries(hashes).forEach(([hash, { i, count }]) => {
  //     if (count > 1) {
  //         collisions.push({ hash, count, i });
  //     }
  // });
  //
  // expect(collisions).toEqual([]);
});

const hasLenSets = [
  // too less
  {
    hashLen: 1,
    processExit: 1,
    consoleLog: [
      [],
      ["Suggest Minify Plugin"],
      ["Matched length (len: number):", {"1": 3}],
      ["🚫 You can't use selected hash length (1). Increase the hash length."],
      [],
    ]
  },
  // exactly match
  {
    hashLen: 2,
    processExit: 0,
    consoleLog: [
      [],
      ['Suggest Minify Plugin'],
      ["Matched length (len: number):", {"1": 3}],
      ["Selected hash length (2) is OK."],
      []
    ]
  },
  // over match
  {
    hashLen: 8,
    processExit: 0,
    consoleLog: [
      [],
      ['Suggest Minify Plugin'],
      ["Matched length (len: number):", {"1": 3}],
      ["Selected hash length (8) is OK."],
      ["🎉 You can decrease the hash length (8 -> 7)."],
      []
    ]
  }
];

describe('testing HashLenSuggest', () => {
  hasLenSets.forEach(set => {
      it('should test run()', () => {
        const mockConsoleLog = jest.spyOn(console, 'log');
        const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

        const myHashLenSuggest = new HashLenSuggest({
          instance: MyOneLetterCss,
          selectedHashLen: set.hashLen
        });

        myHashLenSuggest.run();

        expect(console.log.mock.calls).toEqual(set.consoleLog);
        expect(mockProcessExit).toHaveBeenCalledTimes(set.processExit);

        mockConsoleLog.mockRestore();
        mockProcessExit.mockRestore();
    })
  })
});
