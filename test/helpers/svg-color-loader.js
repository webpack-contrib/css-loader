const querystring = require("querystring");

module.exports = function loader() {
  const query = querystring.parse(this.resourceQuery.slice(1));

  if (typeof query.color === "undefined" || query.color !== "#BAAFDB?") {
    throw new Error(`Error, 'color' is '${query.color}'`);
  }

  return `export default "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";`;
};
