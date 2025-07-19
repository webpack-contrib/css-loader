import postcss from "postcss";
import postcssPkg from "postcss/package.json";
import postcssPresetEnv from "postcss-preset-env";
import semver from "semver";

const incomingVersion = semver.inc(postcssPkg.version, "minor");

/**
 * @param content
 */
export default function astLoader(content) {
  const callback = this.async();

  // eslint-disable-next-line no-undef
  const { spy = jest.fn() } = this.query;

  postcss([postcssPresetEnv({ stage: 0 })])
    .process(content, {
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
