const PLUGIN_NAME = 'Hash length suggest';

export default class HashLenSuggest {
  constructor({ instance, selectedHashLen }) {
    this.instance = instance;
    this.selectedHashLen = selectedHashLen;
    this.logger = null;
  }

  apply(compiler) {
    compiler.plugin('done', this.run);

    this.logger = compiler.getInfrastructureLogger(PLUGIN_NAME);
  }

  run() {
    let data = this.instance.getStat();
    const matchLen = {};
    const base = {};

    Object.values(data).forEach(({ name }) => {
      for (let len = 1; len <= name.length; len += 1) {
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

    data = null;

    const { logger, selectedHashLen } = this;

    logger.log('Suggest Minify Plugin');
    logger.log('Matched length (len: number):', matchLen);

    if (matchLen[selectedHashLen]) {
      logger.log(
        `🚫 You can't use selected hash length (${selectedHashLen}). Increase the hash length.`
      );
      process.exit(1);
    } else {
      logger.log(`Selected hash length (${selectedHashLen}) is OK.`);

      if (!matchLen[selectedHashLen - 1]) {
        logger.log(
          `🎉 You can decrease the hash length (${selectedHashLen} -> ${
            selectedHashLen - 1
          }).`
        );
      }
    }
  }
}
