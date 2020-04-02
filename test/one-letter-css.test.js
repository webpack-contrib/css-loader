const OneLetterCss = require('../src/plugins/one-letter-css');

/* webpack set */
// const workSets = [
//   {
//     in: [
//       {
//         resourcePath: './file1.css',
//       },
//       '[hash:base64:8]',
//       'theme-white',
//     ],
//     out: 'a2zADNwsK',
//   },
//   {
//     in: [
//       {
//         resourcePath: './file1.css',
//       },
//       '[hash:base64:8]',
//       'theme-blue',
//     ],
//     out: 'b2zADNwsK',
//   },
//   {
//     in: [
//       {
//         resourcePath: './file2.css',
//       },
//       '[hash:base64:8]',
//       'text-white',
//     ],
//     out: 'a2jlx459O',
//   },
//   {
//     in: [
//       {
//         resourcePath: './file2.css',
//       },
//       '[hash:base64:8]',
//       'text-blue',
//     ],
//     out: 'b2jlx459O',
//   },
//   // for develop case
//   {
//     in: [
//       {
//         resourcePath: './file2.css',
//       },
//       '[local]__[hash:base64:8]',
//       'text-blue',
//     ],
//     out: 'text-blue__b2jlx459O',
//   },
// ];

/* encoding test set */
const encodingSets = [
  {
    in: 0,
    out: '',
  },
  {
    in: 1,
    out: 'a',
  },
  {
    in: 2,
    out: 'b',
  },
  {
    in: 25,
    out: 'y',
  },
  {
    in: 26,
    out: 'z',
  },
  {
    in: 27,
    out: 'A',
  },
  {
    in: 28,
    out: 'B',
  },
  {
    in: 51,
    out: 'Y',
  },
  {
    in: 52,
    out: 'Z',
  },
  {
    in: 53,
    out: '_',
  },
  {
    in: 54,
    out: '_0',
  },
  {
    in: 55,
    out: '_1',
  },
  {
    in: 62,
    out: '_8',
  },
  {
    in: 63,
    out: '_9',
  },
  {
    in: 64,
    out: '_-',
  },
  {
    in: 65,
    out: 'aa',
  },
  {
    in: 66,
    out: 'ab',
  },
  {
    in: 67,
    out: 'ac',
  },
  {
    in: 4095,
    out: '_-9',
  },
  {
    in: 4096,
    out: '_--',
  },
  {
    in: 4097,
    out: 'aaa',
  },
];

const MyOneLetterCss = new OneLetterCss();

// describe('testing work case', () => {
//   workSets.forEach((set) => {
//     it(`should check name generate`, () => {
//       expect(MyOneLetterCss.getLocalIdent(...set.in)).toEqual(...set.out);
//     });
//   });
// });

let ok = 0;

encodingSets.forEach((set) => {
  if (MyOneLetterCss.getName(set.in) === set.out) {
    ok += 1;
  } else {
    console.log('---');
    console.log('  send', set.in);
    console.log('expect', set.out);
    console.log('   get', MyOneLetterCss.getName(set.in));
    // throw new Error()
  }
});

console.log('ok=', ok);
