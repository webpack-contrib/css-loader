/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = (cssWithMappingToString) => {
  const list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map((item) => {
      let content = "";

      const needLayer = typeof item[5] !== "undefined";

      if (item[4]) {
        content += `@supports (${item[4]}) {`;
      }

      if (item[2]) {
        content += `@media ${item[2]} {`;
      }

      if (needLayer) {
        content += `@layer${item[5].length > 0 ? ` ${item[5]}` : ""} {`;
      }

      content += cssWithMappingToString(item);

      if (needLayer) {
        content += "}";
      }

      if (item[2]) {
        content += "}";
      }

      if (item[4]) {
        content += "}";
      }

      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }

    const alreadyImportedModules = {};

    if (dedupe) {
      for (let k = 0; k < this.length; k++) {
        const id = this[k][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (let k = 0; k < modules.length; k++) {
      const item = [].concat(modules[k]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }

      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = `@layer${item[5].length > 0 ? ` ${item[5]}` : ""} {${
            item[1]
          }}`;
          item[5] = layer;
        }
      }

      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = `@media ${item[2]} {${item[1]}}`;
          item[2] = media;
        }
      }

      if (supports) {
        if (!item[4]) {
          item[4] = `${supports}`;
        } else {
          item[1] = `@supports (${item[4]}) {${item[1]}}`;
          item[4] = supports;
        }
      }

      list.push(item);
    }
  };

  return list;
};
