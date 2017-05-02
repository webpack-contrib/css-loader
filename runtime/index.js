export function a(array) {
  array.toString = function() {
    // T O D O
    return this;
  }
}

export function b(id, source, sourceMap) {
  return [id, source, "", sourceMap];
}

export function c(id, source) {
  return b(id, source, null);
}

export function d(data, mediaQuery) {
  return data.map(function(item) {
    return [item[0], item[1], joinMediaQuery(item[2], mediaQuery), item[3]];
  })
}

function joinMediaQuery(itemA, itemB) {
  if(itemA && itemB) return "(" + itemA + ") and (" + itemB + ")";
  return itemA || itemB || "";
}
