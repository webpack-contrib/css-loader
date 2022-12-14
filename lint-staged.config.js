module.exports = {
  "*": ["prettier --write --ignore-unknown", "cspell --no-must-find-files"],
  "*.js": ["eslint --cache --fix"],
};
