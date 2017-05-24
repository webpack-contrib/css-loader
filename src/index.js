/* eslint-disable */
import { getOptions, isUrlRequest, stringifyRequest } from 'loader-utils';
import validateOptions from 'schema-utils';

import resolver from './resolver';
import processor from './processor';

import SyntaxError from './Error';

/**
 * CSS Loader
 *
 * > Loads CSS as Modules for webpack
 *
 * @author Tobias Koppers (@sokra)
 *
 * @version 1.0.0
 * @license MIT
 *
 * @requires 'loader-utils'
 * @requires 'schema-utils'
 *
 * @requires './resolver'
 * @requires './processor'
 *
 * @method loader
 *
 * @param  {String} src  Source
 * @param  {Object} map  Sourcemap
 * @param  {Object} meta Metadata
 *
 * @return {cb} cb       Callback
 */
export default function loader (src, map, meta) {
  const cb = this.async();

  const file = this.resourcePath;
  const options = Object.assign({}, getOptions(this));

  validateOptions('./src/options.json', options, 'CSS Loader');

  if (options.sourceMap) {
    if (map && typeof map !== 'string') {
      map = JSON.stringify(map);
    }
  } else {
    map = null;
  }

  // root: options.root
  const processOptions = {
    from: file,
    to: file,
    url: options.url,
    import: options.import,
    sourceMap: options.sourceMap
  };

  Promise.resolve()
    .then(() => {
      if (meta && meta.ast) return processor(ast, map, processOptions);
      return processor(src, map, processOptions);
    })
    .then((result) => {
      let css = JSON.stringify(result.css);

      const imported = {};

      const imports = result.imports
        .filter((i) => {
          if (!i.mediaQuery) {
            if (imported[i.url]) return false;

            imported[i.url] = true;
          }

          return true;
        })
        .map((i) => {
          if(!isUrlRequest(i.url, root)) {
            return `exports.push([module.id, ${JSON.stringify(`@import url(${i.url});`)}, ${JSON.stringify(`${i.mediaQuery}`)}]);`;
          }
        })
        .join('\n');

      function importMatcher (item) {
        const match = result.importsRegExp.exec(item);
        const idx = +match[1];

        const url = result.imports[idx].url;

        return `require('${stringifyRequest(this, url)}).locals' [${JSON.stringify(url.export)}]`;
      }

      css = css.replace(result.importsRegExpG, importMatcher.bind(this));

      if (options.url !== false) {
        css = css.replace(result.urlsRegExpG, (item) => {
          const match = result.urlsRegExp.exec(item);

          let idx = +match[1];

          const urlItem = result.urls[idx];
          const url = resolver(options.alias)(urlItem.url);

          idx = url.indexOf('?#');

          if (idx < 0) idx = url.indexOf('#');

          if (idx > 0) {
            // in cases like url('webfont.eot?#iefix')
            const $url = url.substr(0, idx);

            return `\" + require(${stringifyRequest(this, $url)}) + \"` + url.substr(idx);
          }

          return `\" + require(${stringifyRequest(this, url)}) + \"`;
        });
      }

      let modules;

      if (options.sourceMap && result.map) {
        map = result.map;

        if (map.sources) {
          map.sourceRoot = '';
          map.sources = map.sources
            .map((source) => source.split('!').pop());
        }

        map.file = map.file.split('!').pop();
        map = JSON.stringify(map);

        modules = `exports.push([module.id, ${css}, '', ${map}]);`;
      } else {
        modules = `exports.push([module.id, ${css}, '']);`;
      }

      let locals;

      if (meta && meta.locals) {
        locals = `exports.locals = ${meta.locals};`;
      } else {
        locals = `exports.locals = {};`;
      }

      // Embed Runtime (./base.js)
      const runtime = `exports = module.exports = require(${stringifyRequest(this, require.resolve('./base.js'))})(${options.sourceMap});\n`

      return cb(null,`${runtime}${imports}\n\n${modules}\n\n${locals}\n\n`);
    })
    .catch((err) => {
      err.name === 'CssSyntaxError' ? cb(new SyntaxError(err)) : cb(err);
    });
}