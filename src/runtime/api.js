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

      if (item[3]) {
        content += `@${item[3]} {`;
      }

      if (item[2]) {
        content += `@media ${item[2]} {`;
      }

      if (item[4]) {
        content += `@${item[4]} {`;
      }

      content += cssWithMappingToString(item);

      if (item[4]) {
        content += "}";
      }

      if (item[2]) {
        content += "}";
      }

      if (item[3]) {
        content += "}";
      }

      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, mediaQueryList, dedupe, layer, supports) {
    if (typeof modules === "string") {
      modules = [[null, modules, ""]];
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

      if (mediaQueryList) {
        if (!item[2]) {
          item[2] = mediaQueryList;
        } else {
          item[2] = `${mediaQueryList} and ${item[2]}`;
        }
      }

      if (layer) {
        if (!item[3]) {
          item[3] = layer;
        } else {
          item[3] = `${layer} and ${item[3]}`;
        }
      }

      if (supports) {
        if (!item[4]) {
          item[4] = supports;
        } else {
          item[4] = `${supports} and ${item[4]}`;
        }
      }

      list.push(item);
    }
  };

  return list;
};
