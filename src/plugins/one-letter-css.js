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
    /** encoding [a-zA-Z] */
    this.symbols = 64;
    /** a half of encoding */
    // this.half = 26;
    this.symbolsAreaEnd = {
      az: 26,
      AZ: 52,
      _: 53,
      // 0-9
      d: 63,
      // -
      dash: 64,
    };
    /** prevent loop-hell */
    this.maxLoop = 10;
  }

  getNameOld(lastUsed) {
    const { a, A, symbols, maxLoop, half } = this;
    let name = '';
    let loop = 0;
    let main = lastUsed;
    let tail = 0;

    while (
      ((main > 0 && tail >= 0) ||
        // first step anyway needed
        loop === 0) &&
      loop < maxLoop
    ) {
      const newMain = Math.floor(main / symbols);

      tail = main % symbols;
      name = String.fromCharCode((tail >= half ? A - half : a) + tail) + name;
      main = newMain;
      loop += 1;
    }

    return name;
  }

  /**
   * 1st set [_a-zA-Z]
   * 2nd set [_a-zA-Z0-9-]
   *
   * */
  getName(lastUsed) {
    if (!lastUsed) {
      return '';
    }

    const { a, A, symbols, maxLoop, zero } = this;
    let name = '';
    let loop = 0;
    let main = lastUsed;
    let tail = 0;

    while (
      main > 0 &&
      // && tail >= 0
      // ||
      // first step anyway needed
      // loop === 0
      loop < maxLoop
    ) {
      const newMain = Math.floor(main / symbols);

      tail = main % symbols;

      // if (tail === -1) {
      //   newMain -= 1
      // }

      let tmpName;

      //       az: 26,
      //       AZ: 52,
      //       _: 53,
      //       d: 63,
      //       dash: 64
      if (tail === -1) {
        tmpName = '-';
      } else if (tail <= this.symbolsAreaEnd.az) {
        tmpName = String.fromCharCode(a + tail - 1);
      } else if (tail <= this.symbolsAreaEnd.AZ) {
        tmpName = String.fromCharCode(A - this.symbolsAreaEnd.az + tail - 1);
      } else if (tail <= this.symbolsAreaEnd._) {
        tmpName = '_';
      } else if (tail <= this.symbolsAreaEnd.d) {
        tmpName = String.fromCharCode(
          zero - this.symbolsAreaEnd.AZ - 1 + tail - 1
        );
      } else {
        throw new Error(
          `tail value > dash; ${tail} > ${this.symbolsAreaEnd.dash}`
        );
      }

      name = tmpName + name;

      main = newMain;
      loop += 1;
    }

    return (/^[\d-]/.test(name) ? '_' : '') + name;
  }

  getLocalIdent(context, localIdentName, localName) {
    const { resourcePath } = context;
    const { files } = this;

    // check file data at cache by absolute path
    let fileShort = files[resourcePath];

    // no file data, lets generate and save
    if (!fileShort) {
      // if we know file position, we must use base52 encoding with '_'
      // between rule position and file position
      // to avoid collapse hash combination. a_ab vs aa_b
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
      newRuleName = this.getName(fileShort.lastUsed) + fileShort.name;

      // Saved
      fileShort.ruleNames[localName] = newRuleName;
    }

    // If has "local" at webpack settings
    const hasLocal = /\[local]/.test(localIdentName);

    // If has - add prefix
    return hasLocal ? `${localName}__${newRuleName}` : newRuleName;
  }
}

module.exports = OneLetterCss;
