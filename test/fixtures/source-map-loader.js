module.exports = function loader(source) {
  const cb = this.async();

  cb(null, source, this.query.sourceMap);
};
