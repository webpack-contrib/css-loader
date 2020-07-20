import postcss from 'postcss';
import { extractICSS, replaceValueSymbols, replaceSymbols } from 'icss-utils';

import { normalizeUrl, resolveRequests, requestify } from '../utils';

export default postcss.plugin(
  'postcss-icss-parser',
  (options) => async (css, result) => {
    const importReplacements = Object.create(null);
    const { icssImports, icssExports } = extractICSS(css);
    const imports = new Map();
    const tasks = [];

    // eslint-disable-next-line guard-for-in
    for (const url in icssImports) {
      const tokens = icssImports[url];

      if (Object.keys(tokens).length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const request = requestify(normalizeUrl(url, true), options.rootContext);
      const doResolve = async () => {
        const { resolver, context } = options;
        const resolvedUrl = await resolveRequests(resolver, context, [
          ...new Set([url, request]),
        ]);

        return { url: resolvedUrl, tokens };
      };

      tasks.push(doResolve());
    }

    const results = await Promise.all(tasks);

    for (let index = 0; index <= results.length - 1; index++) {
      const { url, tokens } = results[index];

      const importKey = url;
      let importName = imports.get(importKey);

      if (!importName) {
        importName = `___CSS_LOADER_ICSS_IMPORT_${imports.size}___`;
        imports.set(importKey, importName);

        result.messages.push(
          {
            type: 'import',
            value: {
              importName,
              url: options.urlHandler(url),
              icss: true,
              order: 0,
              index,
            },
          },
          {
            type: 'api-import',
            value: {
              type: 'internal',
              importName,
              dedupe: true,
              order: 0,
              index,
            },
          }
        );
      }

      for (const [replacementIndex, token] of Object.keys(tokens).entries()) {
        const replacementName = `___CSS_LOADER_ICSS_IMPORT_${index}_REPLACEMENT_${replacementIndex}___`;
        const localName = tokens[token];

        importReplacements[token] = replacementName;

        result.messages.push({
          type: 'icss-replacement',
          value: { replacementName, importName, localName },
        });
      }
    }

    if (Object.keys(importReplacements).length > 0) {
      replaceSymbols(css, importReplacements);
    }

    for (const name of Object.keys(icssExports)) {
      const value = replaceValueSymbols(icssExports[name], importReplacements);

      result.messages.push({ type: 'export', value: { name, value } });
    }
  }
);
