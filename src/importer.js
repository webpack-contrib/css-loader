/* eslint-disable import/order, import/first, no-param-reassign,
   arrow-body-style, prefer-destructuring, space-before-function-paren */
import { isUrlRequest, urlToRequest } from 'loader-utils';

import postcss from 'postcss';

import parser from 'postcss-value-parser';
import tokenizer from 'css-selector-tokenizer';

export default postcss.plugin('importer', (options) => {
  return (css) => {
    const urls = [];
    const imports = [];

    const $imports = {};

    function replaceImports(str) {
      if (options.import) {
        const nodes = parser(str);

        nodes.walk((node) => {
          if (node.type !== 'word') return;

          const value = node.value;
          const index = $imports[`$${value}`];

          if (typeof index === 'number') {
            node.value = `___CSS_LOADER_IMPORT___${index}___`;
          }
        });

        return nodes.toString();
      }

      return str;
    }

    if (options.import) {
      css.walkAtRules(/import/i, (rule) => {
        const values = tokenizer.parseValues(rule.params);

        let url = values.nodes[0].nodes[0];

        if (url.type === 'url') {
          url = url.url;
        } else if (url.type === 'string') {
          url = url.value;
        } else {
          throw rule.error(`Unexpected format ${rule.params}`);
        }

        if (!url.replace(/\s/g, '').length) return;

        values.nodes[0].nodes.shift();

        const mediaQuery = tokenizer.stringifyValues(values);

        // options.root
        if (isUrlRequest(url)) {
          url = urlToRequest(url);
        }

        imports.push({ url, mediaQuery });

        rule.remove();
      });
    }

    function processNode (node) {
      switch (node.type) {// eslint-disable-line
        case 'value':
          node.nodes.forEach(processNode);

          break;
        case 'nested-item':
          node.nodes.forEach(processNode);

          break;
        case 'item': // eslint-disable-line
          const index = $imports[`$${node.name}`];

          if (typeof index === 'number') {
            node.name = `___CSS_LOADER_IMPORT___${index}___`;
          }

          break;
        case 'url':
          if (
            options.url &&
            !/^#/.test(node.url) &&
            node.url.replace(/\s/g, '').length &&
            // options.root
            isUrlRequest(node.url)
          ) {
            // Don't remove quotes around url when contain space
            if (node.url.indexOf(' ') === -1) node.stringType = '';

            delete node.innerSpacingBefore;
            delete node.innerSpacingAfter;

            const url = node.url;

            node.url = `___CSS_LOADER_URL___${urls.length}___`;

            urls.push({ url });
          }

          break;
      }
    }

    css.walkDecls((decl) => {
      const values = tokenizer.parseValues(decl.value);

      values.nodes.forEach((value) => {
        value.nodes.forEach(processNode);
      });

      decl.value = tokenizer.stringifyValues(values);
    });

    css.walkAtRules((atrule) => {
      if (typeof atrule.params === 'string') {
        atrule.params = replaceImports(atrule.params);
      }
    });

    options.urls = urls;
    options.imports = imports;
  };
});
