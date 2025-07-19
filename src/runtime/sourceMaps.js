// Polyfill for btoa in Node.js
/* global btoa */
/**
 *
 */
function getBtoa() {
  if (typeof btoa === "function") return btoa;
  return (str) => Buffer.from(str, "binary").toString("base64");
}

module.exports = (item) => {
  const [, content, , cssMapping] = item;

  if (!cssMapping) {
    return content;
  }

  const btoaFn = getBtoa();
  const base64 = btoaFn(
    unescape(encodeURIComponent(JSON.stringify(cssMapping))),
  );
  const data = `sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}`;
  const sourceMapping = `/*# ${data} */`;

  return [content, sourceMapping].join("\n");
};
