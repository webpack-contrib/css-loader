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
    out: ['a2zADNwsK'],
  },
  {
    in: [
      {
        resourcePath: './file1.css',
      },
      '[hash:base64:8]',
      'theme-blue',
    ],
    out: ['b2zADNwsK'],
  },
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[hash:base64:8]',
      'text-white',
    ],
    out: ['a2jlx459O'],
  },
  {
    in: [
      {
        resourcePath: './file2.css',
      },
      '[hash:base64:8]',
      'text-blue',
    ],
    out: ['b2jlx459O'],
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
    out: ['text-blue__b2jlx459O'],
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
