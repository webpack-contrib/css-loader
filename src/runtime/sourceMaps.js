module.exports = (item) => {
  const content = item[1];
  const cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (typeof btoa === "function") {
    const base64 = btoa(
      unescape(encodeURIComponent(JSON.stringify(cssMapping)))
    );
    const data = `sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}`;
    const sourceMapping = `/*# ${data} */`;

    const sourceURLs = cssMapping.sources.map(
      (source) => `/*# sourceURL=${cssMapping.sourceRoot || ""}${source} */`
    );

    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};
