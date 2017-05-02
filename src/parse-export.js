import { IDENTIFIER, metablockEndMatch } from './parse-common';

function exportStartMatch(match, index) {
  const block = {
    start: index
  };
  this.metablocks.push(block);
  this.currentBlock = block;
  return 'export0';
}

function exportIdentiferMatch(match, index) {
  const exportItem = {
    start: index,
    name: match,
    value: []
  };
  this.exports.push(exportItem);
  this.currentItem = exportItem;
  return 'export2';
}

function exportValueMatch(match) {
  this.currentItem.value.push(match);
}

export default {
  exportRuleStart: {
    ':export': exportStartMatch,
  },

  export0: [
    'comment',
    'whitespace',
    {
      '\\{': 'export1'
    },
    'nothingElse'
  ],
  export1: [
    'comment',
    'whitespace',
    {
      [IDENTIFIER]: exportIdentiferMatch,
      '\\}\\s*': metablockEndMatch
    },
    'nothingElse'
  ],
  export2: [
    'comment',
    'whitespace',
    {
      ':': 'export3',
    },
    'nothingElse'
  ],
  export3: [
    'comment',
    'whitespace',
    {
      '\\}\\s*': metablockEndMatch,
      ';': 'export1',
      '[^\\};\\s]+': exportValueMatch,
    },
    'nothingElse'
  ],
}
