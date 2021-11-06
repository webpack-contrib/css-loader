export default function loader(content, map) {
  const callback = this.async();

  return callback(null, content, map, "non-ast-meta");
}
