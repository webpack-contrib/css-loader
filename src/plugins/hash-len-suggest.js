/*
at webpack settings:
const cssHashLen = 8
...
{
    loader: 'css-loader',
    options: {
        modules: {
            localIdentName: `[hash:base64:${cssHashLen}]`,
            getLocalIdent: MyOneLetterCss.getLocalIdent
        }
    }
}
...
plugins: [
        ...plugins,
        new HashLenSuggest({
            instance: MyOneLetterCss,
            selectedHashLen: cssHashLen
        })
    ]
*/

class HashLenSuggest {
  constructor({ instance, selectedHashLen }) {
    this.instance = instance;
    this.selectedHashLen = selectedHashLen;
  }

  apply(compiler) {
    compiler.plugin('done', this.run);
  }

  collectHashLen (data) {
    const matchLen = {};
    const base = {};

    Object.values(data).forEach(({ name }) => {
      for(let len = 1; len <= name.length; len += 1) {
        base[len] = base[len] || {};
        const hash = name.substr(0, len);

        if (base[len][hash]) {
          matchLen[len] = matchLen[len] || 0;
          matchLen[len] += 1;
        } else {
          base[len][hash] = 1;
        }
      }
    });

    return matchLen;
  }

  run() {
    const { instance, selectedHashLen } = this;
    const matchLen = this.collectHashLen(instance.getStat());

    console.log();
    console.log('Suggest Minify Plugin');
    console.log('Matched length (len: number):', matchLen);

    if (matchLen[selectedHashLen]) {
      console.log(
        `🚫 You can't use selected hash length (${selectedHashLen}). Increase the hash length.`
      );
      console.log();
      process.exit(1);
    } else {
      console.log(`Selected hash length (${selectedHashLen}) is OK.`);

      if (!matchLen[selectedHashLen - 1]) {
        console.log(`🎉 You can decrease the hash length (${selectedHashLen} -> ${selectedHashLen - 1}).`);
      }

      console.log();
    }
  };
}

module.exports = HashLenSuggest;
