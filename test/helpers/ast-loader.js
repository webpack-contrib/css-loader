import postcss from "postcss";
import postcssPresetEnv from "postcss-preset-env";
import postcssPkg from "postcss/package.json";
import semver from "semver";

const incomingVersion = semver.inc(postcssPkg.version, "minor");

export default function astLoader(content) {
  const callback = this.async();

  const { spy = jest.fn() } = this.query;

  postcss([postcssPresetEnv({ stage: 0 })])
    .process(content, {
      // eslint-disable-next-line no-undefined
      from: undefined,
    })
    .then(({ css, map, root, messages }) => {
      const ast = {
        type: "postcss",
        version: incomingVersion,
      };

      Object.defineProperty(ast, "root", {
        get: spy.mockReturnValue(root),
      });

      callback(null, css, map, { ast, messages });
    });
}
