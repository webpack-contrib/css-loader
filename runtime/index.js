export function create(items) {
  var array = [];
  var map = Object.create ? Object.create(null) : {};
  items.forEach(function (elements) {
    elements.forEach(function (item) {
      var id = item[0];
      if (id !== null) {
        if (map[id]) return;
        map[id] = true;
      }
      array.push(item);
    });
  });
  array.toString = function toString() {
    return this.map(function (item) {
      if (item[2]) {
        return '@media ' + item[2] + '{' + item[1] + '}';
      }
      return item[1];
    }).join('\n');
  };
  return array;
}

export function moduleWithSourceMap(id, source, sourceMap) {
  return [[id, source, '', sourceMap]];
}

export function moduleWithoutSourceMap(id, source) {
  return moduleWithSourceMap(id, source, null);
}

export function importStylesheet(data, mediaQuery) {
  if (typeof data === 'string') {
    return moduleWithoutSourceMap(null, data);
  }
  if (!mediaQuery) {
    return data;
  }
  return data.map(function (item) {
    return [item[0], item[1], joinMediaQuery(item[2], mediaQuery), item[3]];
  });
}

function joinMediaQuery(itemA, itemB) {
  // not perfect, but work fine in 99%
  if (itemA && itemB) return '(' + itemA + ') and (' + itemB + ')';
  return itemA || itemB || '';
}
