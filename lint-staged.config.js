module.exports = {
  "*": ["prettier --write --ignore-unknown", "cspell"],
  "*.js": ["eslint --cache --fix"],
};
