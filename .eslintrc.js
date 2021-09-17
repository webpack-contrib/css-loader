module.exports = {
  root: true,
  extends: ["@webpack-contrib/eslint-config-webpack", "prettier"],
  overrides: [
    {
      files: "src/runtime/**/*",
      env: {
        browser: true,
      },
      rules: {
        "prefer-destructuring": "off",
        "no-param-reassign": "off",
        "no-continue": "off",
        "no-underscore-dangle": "off",
        "no-undefined": "off",
      },
    },
  ],
};
