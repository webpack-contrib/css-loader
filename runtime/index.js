export function create(items) {
  var array = [];
  items.forEach(function(elements) {
    elements.forEach(function(item) {
      array.push(item);
    });
  });
  array.toString = function() {
    return this.map(function(item) {
      if(item[2]) {
        return '@media ' + item[2] + '{' + item[1] + '}';
      }
      return item[1]
    }).join('\n');
  }
}

export function moduleWithSourceMap(id, source, sourceMap) {
  return [[id, source, '', sourceMap]];
}

export function moduleWithoutSourceMap(id, source) {
  return moduleWithSourceMap(id, source, null);
}

export function importStylesheet(data, mediaQuery) {
  if(typeof data === 'string')
    return moduleWithoutSourceMap(null, data);
  return data.map(function(item) {
    return [item[0], item[1], joinMediaQuery(item[2], mediaQuery), item[3]];
  })
}

function joinMediaQuery(itemA, itemB) {
  if(itemA && itemB) return '(' + itemA + ') and (' + itemB + ')';
  return itemA || itemB || '';
}
