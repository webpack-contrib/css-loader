import { CSS_IDENTIFIER, throwUnexpectedToken } from './parse-common';
import Parser from 'fastparse';
import atImportRules from './parse-at-import';
import exportRules from './parse-export';
import importRules from './parse-import';

function innerLevelStartMatch() {
  this.level += 1;
  return 'innerLevel';
}

function innerLevelEndMatch() {
  this.level -= 1;
  return this.level === 0 ? 'topLevel' : 'innerLevel';
}

function identifierMatch(match, index) {
  let identifier = this.identifiers.get(match);
  if (!identifier) {
    identifier = {
      name: match,
      locations: [],
    };
    this.identifiers.set(match, identifier);
  }
  identifier.locations.push(index);
}

const parser = new Parser(Object.assign({
  // definitions
	comment: {
		'/\\*[\\s\\S]*?\\*/': true,
	},
	whitespace: {
		'\\s+': true,
	},
	string: {
		'"([^\\\\"]|\\\\.)*"': true,
		'\'([^\\\\\']|\\\\.)*\'': true,
	},
  nothingElse: {
    '\\s+': throwUnexpectedToken,
    '\\S+': throwUnexpectedToken,
  },


  innerLevelStart: {
    '\\{': innerLevelStartMatch,
  },
  innerLevelEnd: {
    '\\}': innerLevelEndMatch,
  },
  identifier: {
    [CSS_IDENTIFIER]: identifierMatch,

    // ignore numbers, colors
    ['([0-9]|#)' + CSS_IDENTIFIER]: true,
  },

  // states
  topLevel: [
    'comment',
    'exportRuleStart',
    'importRuleStart',
    'atImportStart',
    'identifier',
    'innerLevelStart'
  ],
  innerLevel: [
    'comment',
    'identifier',
    'innerLevelStart',
    'innerLevelEnd'
  ],

}, importRules, atImportRules, exportRules));

export default function parse(source) {
  const context = parser.parse('topLevel', source, {
    metablocks: [],
    atImports: [],
    imports: [],
    exports: [],
    identifiers: new Map(),
    level: 0,
    currentBlock: null,
    currentItem: null,
    currentImport: null,
  });
  return {
    metablocks: context.metablocks,
    atImports: context.atImports,
    imports: context.imports,
    exports: context.exports,
    identifiers: context.identifiers,
  }
}
