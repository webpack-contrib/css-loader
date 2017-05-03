import { CSS_IDENTIFIER, IDENTIFIER, metablockEndMatch } from './parse-common';

function exportStartMatch(match, index) {
  const block = {
    start: index,
  };
  this.metablocks.push(block);
  this.currentBlock = block;
  return 'export0';
}

function exportIdentiferMatch(match, index) {
  const exportItem = {
    start: index,
    name: match,
    value: [],
  };
  this.exports.push(exportItem);
  this.currentItem = exportItem;
  return 'export2';
}

function exportValueMatch(match) {
  this.currentItem.value.push(match);
}

function exportWhitespaceMatch() {
  if (this.currentItem.value.length > 0 && this.currentItem.value[this.currentItem.value.length - 1] === ' ') {
    return;
  }
  this.currentItem.value.push(' ');
}

export default {
  exportRuleStart: {
    ':export': exportStartMatch,
  },

  export0: [
    'comment',
    'whitespace',
    {
      '\\{': 'export1',
    },
    'nothingElse',
  ],
  export1: [
    'comment',
    'whitespace',
    {
      [IDENTIFIER]: exportIdentiferMatch,
      '\\}\\s*': metablockEndMatch,
    },
    'nothingElse',
  ],
  export2: [
    'comment',
    'whitespace',
    {
      ':\\s*': 'export3',
    },
    'nothingElse',
  ],
  export3: [
    'comment',
    {
      '\\}\\s*': metablockEndMatch,
      ';': 'export1',
      '\\s+': exportWhitespaceMatch,
      '[^\\};\\-_a-zA-Z0-9\\s]+': exportValueMatch,
      [CSS_IDENTIFIER]: exportValueMatch,
      '[\\-_a-zA-Z0-9]+': exportValueMatch,
    },
    'nothingElse',
  ],
};
