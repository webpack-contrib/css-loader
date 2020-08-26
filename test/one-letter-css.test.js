import { HashLenSuggest, OneLetterCss } from '../src/plugins';

const rootPath = process.cwd();

/* Набор для webpack использования */
const workSets = [
  {
    in: [
      {
        resourcePath: `${rootPath}/file1.css`,
      },
      '[hash:base64:8]',
      'theme-white',
    ],
    out: ['a2qCweEE5'],
  },
  {
    in: [
      {
        resourcePath: `${rootPath}/file1.css`,
      },
      '[hash:base64:8]',
      'theme-blue',
    ],
    out: ['b2qCweEE5'],
  },
  {
    in: [
      {
        resourcePath: `${rootPath}/file2.css`,
      },
      '[hash:base64:8]',
      'text-white',
    ],
    out: ['a1IcJDB21'],
  },
  {
    in: [
      {
        resourcePath: `${rootPath}/file2.css`,
      },
      '[hash:base64:8]',
      'text-blue',
    ],
    out: ['b1IcJDB21'],
  },
  // для разработки, develop mode
  {
    in: [
      {
        resourcePath: `${rootPath}/file2.css`,
      },
      '[local]__[hash:base64:8]',
      'text-blue',
    ],
    out: ['text-blue__b1IcJDB21'],
  },
  // check shot hashLen
  {
    in: [
      {
        resourcePath: `${rootPath}/file3.css`,
      },
      '[hash:base64:4]',
      'text-orig',
    ],
    out: ['a39NC'],
  },
  // check wrong hashRule
  {
    in: [
      {
        resourcePath: `${rootPath}/file4.css`,
      },
      '[hash:base64]',
      'text-wrong',
    ],
    out: ['a34TWGba1'],
  },
];

/* Набор для пограничных случаев */
const encodingSets = [
  // [in, out]
  // при нуле нет результата, пустой префикс. его не используем, чтобы не было коллизии
  // между 1ым значением ('' + '0aabb' = '_0aabb') и 53им ('_' + '0aabb' = '_0aabb')
  [0, ''],
  // это префикс для хеша, первое значение берем с 1
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

describe('Testing work case', () => {
  workSets.forEach((set) => {
    it(`should check classname full generate`, () => {
      expect(MyOneLetterCss.getLocalIdentWithFileHash(...set.in)).toEqual(
        ...set.out
      );
    });
  });
});

describe('Testing encoding method', () => {
  encodingSets.forEach(([valIn, valOut]) => {
    it(`should check classname prefix generate`, () => {
      expect(MyOneLetterCss.getNamePrefix(valIn)).toEqual(valOut);
    });
  });
});

describe('Testing encoding func', () => {
  it('should check empty call', () => {
    const result = MyOneLetterCss.getSingleSymbol();

    expect(result).toEqual('');
  });

  it('should check over encoding call', () => {
    const result = MyOneLetterCss.getSingleSymbol(65);

    expect(result).toEqual('');
  });
});

const statSample = {
  '/file1.css': {
    lastUsed: 2,
    name: '2qCweEE5',
    ruleNames: {
      'theme-blue': 'b2qCweEE5',
      'theme-white': 'a2qCweEE5',
    },
  },
  '/file2.css': {
    lastUsed: 2,
    name: '1IcJDB21',
    ruleNames: {
      'text-blue': 'b1IcJDB21',
      'text-white': 'a1IcJDB21',
    },
  },
  '/file3.css': {
    lastUsed: 1,
    name: '39NC',
    ruleNames: {
      'text-orig': 'a39NC',
    },
  },
  '/file4.css': {
    lastUsed: 1,
    name: '34TWGba1',
    ruleNames: {
      'text-wrong': 'a34TWGba1',
    },
  },
};

it('should check getStat()', () => {
  const result = MyOneLetterCss.getStat();

  expect(result).toEqual(statSample);
});

it('should check prefix when [d-] first letter at result', () => {
  const hashRule = '[hash:base64:1]';
  const filePath = {
    resourcePath: `${rootPath}/myFilePath.css`,
  };
  let result = '';

  // перебираем, пока не дойдём до символов, требующих экранирования [\d_-]
  for (let i = 1; i <= 53; i += 1) {
    const className = `a${i}`;

    result = MyOneLetterCss.getLocalIdentWithFileHash(
      filePath,
      hashRule,
      className
    );
  }

  expect(result).toEqual('__2');

  // при изменении алгоритма прогнать тест на коллизии
  // ищем коллизии (в первом миллионе - чисто :)
  // const hashes = {};
  //
  // for (let i = 1; i <= 1000000; i += 1) {
  //     const className = `a${i}`;
  //
  //     result = MyOneLetterCss.getLocalIdentWithFileHash(filePath, hashRule, className);
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

/* eslint-disable class-methods-use-this */
class MockOneLetterCss {
  getStat() {
    return statSample;
  }
}

const errorFunc = console.error;
const logFunc = console.log;

afterEach(() => {
  console.error = errorFunc;
  console.log = logFunc;
});

const HashLenSuggestSets = [
  {
    cssHashLen: 1,
    log: [
      [],
      ['Suggest Minify Plugin'],
      [
        'Matched length (len: number):',
        {
          1: 1,
        },
      ],
      ["🚫 You can't use selected hash length (1). Increase the hash length."],
      [],
    ],
    error: [],
    exit: 1,
  },
  {
    cssHashLen: 2,
    log: [
      [],
      ['Suggest Minify Plugin'],
      [
        'Matched length (len: number):',
        {
          1: 1,
        },
      ],
      ['Selected hash length (2) is OK.'],
      [],
    ],
    error: [],
    exit: 0,
  },
  {
    cssHashLen: 3,
    log: [
      [],
      ['Suggest Minify Plugin'],
      [
        'Matched length (len: number):',
        {
          1: 1,
        },
      ],
      ['Selected hash length (3) is OK.'],
      ['🎉 You can decrease the hash length (3 -> 2).'],
      [],
    ],
    error: [],
    exit: 0,
  },
];

describe('Testing hash len suggest', () => {
  HashLenSuggestSets.forEach(({ cssHashLen, log, error, exit }) => {
    it('should check empty call', () => {
      console.log = jest.fn();
      console.error = jest.fn();

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const myMockOneLetterCss = new MockOneLetterCss();

      /* eslint-disable no-new */
      const myHashLenSuggest = new HashLenSuggest({
        instance: myMockOneLetterCss,
        selectedHashLen: cssHashLen,
      });

      myHashLenSuggest.run();

      expect(console.log.mock.calls).toEqual(log);
      expect(console.error.mock.calls).toEqual(error);
      expect(mockExit).toHaveBeenCalledTimes(exit);

      mockExit.mockRestore();
    });
  });
});
