/**
 * @author denisx <github.com@denisx.com>
 */

const loaderUtils = require('loader-utils');

export default class OneLetterCss {
  constructor() {
    // Save char symbol start positions
    this.a = 'a'.charCodeAt(0);
    this.A = 'A'.charCodeAt(0);
    // file hashes cache
    this.files = {};
    /** encoding [a-zA-Z] */
    this.symbols = 52;
    /** a half of encoding */
    this.half = 26;
    /** prevent loop-hell */
    this.maxLoop = 10;
  }

  /** encoding by rule count at file, 0 - a, 1 - b, 51 - Z, 52 - ba, etc */
  getName(lastUsed) {
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
      const fileShortName = loaderUtils.interpolateName(
        context,
        '[hash:base64:8]',
        {
          content: resourcePath,
        }
      );

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
