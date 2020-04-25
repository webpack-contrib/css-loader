/**
 * @author denisx <github.com@denisx.com>
 */

const { interpolateName } = require('loader-utils');

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
      const fileShortName = interpolateName(context, '[hash:base64:8]', {
        content: resourcePath,
      });

      fileShort = { name: fileShortName, lastUsed: -1, ruleNames: {} };
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

    // Add prefix '_' for css-names, started with '-' or digit '\d'
    return /^[\d-]/.test(res) ? `_${res}` : res;
  }
}

module.exports = OneLetterCss;
