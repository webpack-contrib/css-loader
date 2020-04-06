module.exports = {
  '*.js': ['prettier --write', 'eslint --fix'],
  '*.{json,md,yml,css,ts}': ['prettier --write'],
};
