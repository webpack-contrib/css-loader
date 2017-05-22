/* eslint-disable no-param-reassign, arrow-parens, */
/**
 * Resolver
 *
 * @method resolver
 *
 * @param  {Object} alias Aliases
 *
 * @return {Function} url Url
 */
export default function resolver (alias) {// eslint-disable-line
  if (typeof alias !== 'object' || Array.isArray(alias)) {
    return (url) => url;
  }

  alias = Object.keys(alias).map((name) => {
    let isModule = false;
    let obj = alias[name];

    if (/\$$/.test(name)) {
      isModule = true;

      name = name.substr(0, name.length - 1);
    }

    if (typeof obj === 'string') obj = { alias: obj };

    obj = Object.assign({ isModule, name }, obj);

    return obj;
  });

  return (url) => {
    alias.forEach((obj) => {
      const { name } = obj.name;

      if (url === name || (!obj.isModule && url.startsWith(`${name}/`))) {
        url = obj.alias + url.substr(name.length);
      }

      return url;
    });

    return url;
  };
}
