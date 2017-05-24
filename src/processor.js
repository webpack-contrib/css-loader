/* eslint-disable comma-dangle, multiline-ternary, no-param-reassign, */
import postcss from 'postcss';
import importer from './importer';
/**
 * @import/url() Parser && Minifier
 *
 * @method processor
 *
 * @param  {String} css     Source
 * @param  {Object} map     Source Map
 * @param  {Object} options Options
 *
 * @return {Promise}        Result
 */
export default function processor (css, map, options) {// eslint-disable-line
  options.url = options.url || true;
  options.import = options.import || true;

  options = { url: options.url, import: options.import };

  const plugins = [ importer(options) ];// eslint-disable-line

  return postcss(plugins).process(css, {
    // we need a prefix to avoid path rewriting of PostCSS
    from: `/css-loader!${options.from}`,
    to: options.to,
    map: options.sourceMap ? {
      prev: map,
      inline: false,
      annotation: false,
      sourcesContent: true
    } : null
  }).then((result) => {
    return {
      css: result.css,
      map: result.map && result.map.toJSON(),
      imports: options.imports,
      importsRegExpG: /___CSS_LOADER_IMPORT___([0-9]+)___/g,
      importsRegExp: /___CSS_LOADER_IMPORT___([0-9]+)___/,
      urls: options.urls,
      urlsRegExpG: /___CSS_LOADER_URL___([0-9]+)___/g,
      urlsRegExp: /___CSS_LOADER_URL___([0-9]+)___/
    };
  });
}
