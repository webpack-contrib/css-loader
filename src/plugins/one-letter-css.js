const { interpolateName } = require('loader-utils');

/**
 * Change css-classes to 64-bit prefix (by class position at file) + hash postfix (by file path)
 */

// Parse encoding string, or get default values
const getRule = (externalRule) => {
  let iRule = {
    type: 'hash',
    rule: 'base64',
    hashLen: 8,
    val: '',
  };

  iRule.val = `[${iRule.type}:${iRule.rule}:${iRule.hashLen}]`;

  const matchHashRule =
    externalRule
      .replace(/_/g, '')
      .match(/^(?:\[local])*\[([a-z\d]+):([a-z\d]+):(\d+)]$/) || [];

  if (matchHashRule.length >= 4) {
    const [, type, rule, hashLen] = matchHashRule;

    iRule = {
      type,
      rule,
      hashLen,
      val: `[${type}:${rule}:${hashLen}]`,
    };
  }

  return iRule;
};

export default class OneLetterCssClasses {
  constructor() {
    // Save separators points from ascii-table
    this.a = 'a'.charCodeAt(0);
    this.A = 'A'.charCodeAt(0);
    this.zero = '0'.charCodeAt(0);
    this.files = {};
    // [a-zA-Z\d_-]
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
      // dash: 64
    };
    // prevent loop hell
    this.maxLoop = 5;
    this.rootPathLen = process.cwd().length;
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
      // console.error(`!n, n=${n}`);
      return '';
    }

    if (n > encoderSize) {
      // console.error(`n > ${encoderSize}, n=${n}`);
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

  /** Encode classname by position at file, 0 - a, 1 - b, etc */
  getNamePrefix(num) {
    const { maxLoop, encoderSize } = this;

    if (!num) {
      return '';
    }

    let loopCount = 0;
    let n = num;
    let res = '';

    // Divide at loop for 64
    // For example, from 1 to 64 - 1 step, from 65 to 4096 (64*64) - 2 steps, etc
    while (n && loopCount < maxLoop) {
      // Remainder of division, for 1-64 encode
      let tail = n % encoderSize;
      const origTail = tail;

      // Check limits, n === encoderSize. 64 % 64 = 0, but encoding for 64
      if (tail === 0) {
        tail = encoderSize;
      }

      // Concat encoding result
      res = this.getSingleSymbol(tail) + res;

      // Check for new loop
      if (Math.floor((n - 1) / encoderSize)) {
        // Find the number of bits for next encoding cycle
        n = (n - origTail) / encoderSize;

        // At limit value (64), go to a new circle,
        // -1 to avoid (we have already encoded this)
        //
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

  /**
   * Make hash
   */
  getLocalIdentWithFileHash(context, localIdentName, localName) {
    const { resourcePath } = context;
    const { files, rootPathLen } = this;

    // To fix difference between stands, work with file path from project root
    const resPath = resourcePath.substr(rootPathLen);

    // Filename at list, take his name
    let fileShort = files[resPath];

    // Filename not at list, generate new name, save
    if (!fileShort) {
      // parse encoding rule
      const localIdentRule = getRule(localIdentName);

      const fileShortName = interpolateName(context, localIdentRule.val, {
        content: resPath,
      });

      fileShort = { name: fileShortName, lastUsed: 0, ruleNames: {} };
      files[resPath] = fileShort;
    }

    // Take rulename, if exists at current file
    let newRuleName = fileShort.ruleNames[localName];

    // If rulename not exist - generate new, and save
    if (!newRuleName) {
      // Increase rules count
      fileShort.lastUsed += 1;

      // Generate new rulename
      newRuleName = this.getNamePrefix(fileShort.lastUsed) + fileShort.name;

      // Save rulename
      fileShort.ruleNames[localName] = newRuleName;
    }

    // Check encoding settings for local development (save original rulenames)
    const hasLocal = /\[local]/.test(localIdentName);

    // If develop mode - add prefix
    const res = hasLocal ? `${localName}__${newRuleName}` : newRuleName;

    // Add prefix '_' for classes with '-' or digit '\d'
    // or '_' (for fix collision)
    return /^[\d_-]/.test(res) ? `_${res}` : res;
  }

  getStat() {
    const stat = { ...this.files };

    this.files = {};

    return stat;
  }
}
