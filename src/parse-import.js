import { CSS_IDENTIFIER, IDENTIFIER, metablockEndMatch, throwUnexpectedToken } from './parse-common';
import loaderUtils from 'loader-utils';

function importStartMatch(match, index) {
  const block = {
    start: index,
    end: null
  };
  this.metablocks.push(block);
  this.currentBlock = block;
  return 'import0';
}

function importFromMatch(match, index) {
  if(this.currentImport) throwUnexpectedToken(match, index);
  const from = loaderUtils.parseString(match);
  this.currentImport = from;
}

function importFromRawMatch(match, index) {
  if(this.currentImport) throwUnexpectedToken(match, index);
  this.currentImport = match.trim();
}

function importAliasMatch(match) {
  const importItem = {
    alias: match,
    importName: null,
    from: this.currentImport,
  };
  this.imports.push(importItem);
  this.currentItem = importItem;
  return 'import4';
}

function importNameMatch(match) {
  this.currentItem.importName = match;
  return 'import6';
}

export default {
  importRuleStart: {
    ':import': importStartMatch,
  },

  import0: [
    'comment',
    'whitespace',
    {
      '\\(': 'import1',
    },
    'nothingElse'
  ],
  import1: [
    'comment',
    'whitespace',
    {
      '"([^\\\\"]|\\\\.)*"': importFromMatch,
      '\'([^\\\\\']|\\\\.)*\'': importFromMatch,
      '[^\\)]+': importFromRawMatch,
      '\\)': 'import2',
    },
    'nothingElse'
  ],
  import2: [
    'comment',
    'whitespace',
    {
      '\\{': 'import3',
    },
    'nothingElse'
  ],
  import3: [
    'comment',
    'whitespace',
    {
      [CSS_IDENTIFIER]: importAliasMatch,
      '\\}\\s*': metablockEndMatch,
    },
    'nothingElse'
  ],
  import4: [
    'comment',
    'whitespace',
    {
      ':': 'import5',
    },
    'nothingElse'
  ],
  import5: [
    'comment',
    'whitespace',
    {
      [IDENTIFIER]: importNameMatch,
    },
    'nothingElse'
  ],
  import6: [
    'comment',
    'whitespace',
    {
      [CSS_IDENTIFIER]: importAliasMatch,
      ';': 'import3',
      '\\}\\s*': metablockEndMatch
    },
    'nothingElse'
  ],
}
