const MIN_BABEL_VERSION = 7;

module.exports = (api) => {
  api.assertVersion(MIN_BABEL_VERSION);
  api.cache(true);

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            node: "12.13.0",
          },
        },
      ],
    ],
    overrides: [
      {
        test: "./src/runtime",
        presets: [
          [
            "@babel/preset-env",
            {
              targets: {
                node: "0.12",
              },
            },
          ],
        ],
      },
    ],
  };
};
