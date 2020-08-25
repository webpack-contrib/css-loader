import OneLetterCss from '../src/plugins/one-letter-css';

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
    out: ['alWFTMQJI'],
  },
  {
    in: [
      {
        resourcePath: './file1.css',
      },
      '[hash:base64:8]',
      'theme-blue',
    ],
    out: ['blWFTMQJI'],
  },
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[hash:base64:8]',
      'text-white',
    ],
    out: ['a1Fsi85PQ'],
  },
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[hash:base64:8]',
      'text-blue',
    ],
    out: ['b1Fsi85PQ'],
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
    out: ['text-blue__b1Fsi85PQ'],
  },
];

/* encoding test set */
const encodingSets = [
  {
    in: [0],
    out: ['a'],
  },
  {
    in: [1],
    out: ['b'],
  },
  {
    in: [51],
    out: ['Z'],
  },
  {
    in: [52],
    out: ['ba'],
  },
  {
    in: [53],
    out: ['bb'],
  },
];

const MyOneLetterCss = new OneLetterCss();

describe('testing work case', () => {
  workSets.forEach((set) => {
    it(`should check name generate`, () => {
      expect(MyOneLetterCss.getLocalIdent(...set.in)).toEqual(...set.out);
    });
  });
});

describe('testing encoding method', () => {
  encodingSets.forEach((set) => {
    it(`should check name generate`, () => {
      expect(MyOneLetterCss.getName(...set.in)).toEqual(...set.out);
    });
  });
});
