/**
 * @author denisx <github.com@denisx.com>
 */

const { interpolateName } = require('loader-utils');

// Parse hash rule
function getRule (externalRule) {
  // default rule
  let iRule = {
    type: 'hash',
    rule: 'base64',
    hashLen: 8,
    val: ''
  };

  iRule.val = `[${iRule.type}:${iRule.rule}:${iRule.hashLen}]`;

  const matchHashRule =
    externalRule.replace(/_/g, '').match(/^(?:\[local])*\[([a-z\d]+):([a-z\d]+):(\d+)]$/) || [];

  if (matchHashRule.length >= 4) {
    const [_, type, rule, hashLen] = matchHashRule;

    iRule = {
      type,
      rule,
      hashLen,
      val: `[${type}:${rule}:${hashLen}]`
    };
  }

  return iRule;
}

class OneLetterCss {
  constructor() {
    // Save char symbol start positions
    this.a = 'a'.charCodeAt(0);
    this.A = 'A'.charCodeAt(0);
    this.zero = '0'.charCodeAt(0);
    // file hashes cache
    this.files = {};
    // encoding [a-zA-Z\d_-]
    this.encoderSize = 64;
    this.symbolsArea = {
      // a-z
      az: 26,
      // A-Z
      AZ: 52,
      // _
      under: 53,
      // 0-9 | \d
      digit: 63,
      // -
      dash: 64,
    };
    // prevent loop hell
    this.maxLoop = 5;
  }

  getSingleSymbol(n) {
    const {
      a,
      A,
      zero,
      encoderSize,
      symbolsArea: { az, AZ, under, digit },
    } = this;

    if (!n) {
      console.error(`!n, n=${n}`);
      return '';
    }

    if (n > encoderSize) {
      console.error(`n > ${encoderSize}, n=${n}`);
      return '';
    }

    // work with 1 <= n <= 64
    if (n <= az) {
      return String.fromCharCode(n - 1 + a);
    }

    if (n <= AZ) {
      return String.fromCharCode(n - 1 - az + A);
    }

    if (n <= under) {
      return '_';
    }

    if (n <= digit) {
      return String.fromCharCode(n - 1 - under + zero);
    }

    return '-';
  }

  getNamePrefix(num) {
    const { maxLoop, encoderSize } = this;

    if (!num) {
      return '';
    }

    let loopCount = 0;
    let n = num;
    let res = '';

    while (n && loopCount < maxLoop) {
      let tail = n % encoderSize;
      const origTail = tail;

      // If n === encoderSize
      if (tail === 0) {
        tail = encoderSize;
      }

      res = this.getSingleSymbol(tail) + res;

      if (Math.floor((n - 1) / encoderSize)) {
        n = (n - origTail) / encoderSize;

        if (origTail === 0) {
          n -= 1;
        }
      } else {
        n = 0;
      }

      loopCount += 1;
    }

    return res;
  }

  getLocalIdent(context, localIdentName, localName) {
    const { resourcePath } = context;
    const { files } = this;

    // Check file data at cache by absolute path
    let fileShort = files[resourcePath];

    // no file data, lets generate and save
    if (!fileShort) {
      // If make file position encoding, use base64 with '_'
      // between rule position and file position
      // to avoid collapse hash combination. a_ab vs aa_b

      // Make encoding with filepath content hash

      const localIdentRule = getRule(localIdentName);

      const fileShortName = interpolateName(context, localIdentRule.val, {
        content: resourcePath,
      });

      fileShort = { name: fileShortName, lastUsed: 0, ruleNames: {} };
      files[resourcePath] = fileShort;
    }

    // Get generative rule name from this file
    let newRuleName = fileShort.ruleNames[localName];

    // If no rule - renerate new, and save
    if (!newRuleName) {
      // Count +1
      fileShort.lastUsed += 1;

      // Generate new rule name
      newRuleName = this.getNamePrefix(fileShort.lastUsed) + fileShort.name;

      // Save
      fileShort.ruleNames[localName] = newRuleName;
    }

    // If has "local" at webpack settings
    const hasLocal = /\[local]/.test(localIdentName);

    // If has develop settings - add prefix
    const res = hasLocal ? `${localName}__${newRuleName}` : newRuleName;

    // Add prefix '_' for css-names, started with '-', digit '\d' or '_'
    return /^[\d_-]/.test(res) ? `_${res}` : res;
  }

  getStat () {
    return this.files;
  };
}

module.exports = OneLetterCss;
