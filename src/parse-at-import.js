import loaderUtils from 'loader-utils';

function atImportStartMatch(match, index) {
  const item = {
    start: index,
    end: null,
    url: null,
    mediaQuery: []
  };
  this.atImports.push(item);
  this.currentItem = item;
  return 'atImport0';
}

function atImportStringMatch(match) {
  this.currentItem.url = loaderUtils.parseString(match);
  return 'atImport4';
}

function atImportUrlMatch(match) {
  this.currentItem.url = loaderUtils.parseString(match);
  return 'atImport3';
}

function atImportMediaMatch(match) {
  this.currentItem.mediaQuery.push(match);
}

function atImportEndMatch(match, index, length) {
  this.currentItem.end = index + length;
  return 'topLevel';
}

export default {
  atImportStart: {
    '@import': atImportStartMatch,
  },

  atImport0: [
    'comment',
    'whitespace',
    {
      'url': 'atImport1',
      '"([^\\\\"]|\\\\.)*"': atImportStringMatch,
      '\'([^\\\\\']|\\\\.)*\'': atImportStringMatch,
    },
    'nothingElse'
  ],
  atImport1: [
    'comment',
    'whitespace',
    {
      '\\(': 'atImport2',
    },
    'nothingElse'
  ],
  atImport2: [
    'comment',
    'whitespace',
    {
      '"([^\\\\"]|\\\\.)*"': atImportUrlMatch,
      '\'([^\\\\\']|\\\\.)*\'': atImportUrlMatch,
    },
    'nothingElse'
  ],
  atImport3: [
    'comment',
    'whitespace',
    {
      '\\)': 'atImport4',
    },
    'nothingElse'
  ],
  atImport4: [
    'comment',
    'whitespace',
    {
      '[^;\\s]+': atImportMediaMatch,
      ';\\s*': atImportEndMatch,
    },
    'nothingElse'
  ],

}
