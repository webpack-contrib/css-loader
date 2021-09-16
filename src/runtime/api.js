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

      const needSupports = typeof item[4] !== "undefined";
      const needMedia = typeof item[2] !== "undefined";
      const needLayer = typeof item[5] !== "undefined";

      if (needSupports) {
        content += `@supports (${item[4]}) {`;
      }

      if (needMedia) {
        content += `@media ${item[2]} {`;
      }

      if (needLayer) {
        content += `@layer${item[5].length > 0 ? ` ${item[5]}` : ""} {`;
      }

      content += cssWithMappingToString(item);

      if (needLayer) {
        content += "}";
      }

      if (needMedia) {
        content += "}";
      }

      if (needSupports) {
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
      for (let i = 0; i < this.length; i++) {
        const id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (let i = 0; i < modules.length; i++) {
      const item = [].concat(modules[i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }

      if (typeof media !== "undefined") {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = `@media ${item[2]} {${item[1]}}`;
          item[2] = media;
        }
      }

      if (typeof supports !== "undefined") {
        if (!item[4]) {
          item[4] = `${supports}`;
        } else {
          item[1] = `@supports (${item[4]}) {${item[1]}}`;
          item[4] = supports;
        }
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

      list.push(item);
    }
  };

  return list;
};
