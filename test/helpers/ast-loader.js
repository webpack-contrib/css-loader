import postcss from 'postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssPkg from 'postcss/package.json';
import semverInc from 'semver/functions/inc';

const incomingVersion = semverInc(postcssPkg.version, 'minor');

export default function astLoader(content) {
  const callback = this.async();

  const { spy = jest.fn() } = this.query;

  postcss([postcssPresetEnv({ stage: 0 })])
    .process(content)
    .then(({ css, map, root, messages }) => {
      const ast = {
        type: 'postcss',
        version: incomingVersion,
      };

      Object.defineProperty(ast, 'root', {
        get: spy.mockReturnValue(root),
      });

      callback(null, css, map, { ast, messages });
    });
}
