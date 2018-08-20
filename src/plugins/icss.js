import postcss from 'postcss';

const pluginName = 'postcss-css-loader-icss';
const importPattern = /^:import\(("[^"]*"|'[^']*'|[^"']+)(?:\s(.+))?\)$/;

const getDeclsObject = (rule) => {
  const object = {};

  rule.walkDecls((decl) => {
    object[decl.raws.before.trim() + decl.prop] = decl.value;
  });

  return object;
};

const extractICSS = (css) => {
  const imports = {};
  const exports = {};

  css.each((node) => {
    if (node.type !== 'rule') {
      return;
    }

    if (node.selector.slice(0, 7) === ':import') {
      const matches = importPattern.exec(node.selector);

      if (matches) {
        const path = matches[1].replace(/'|"/g, '');
        const media = matches[2] ? matches[2] : '';

        imports[path] = Object.assign(
          imports[path] || {},
          getDeclsObject(node),
          media ? { '{media}': media } : {}
        );

        node.remove();
      }
    }

    if (node.selector === ':export') {
      Object.assign(exports, getDeclsObject(node));

      node.remove();
    }
  });

  return { imports, exports };
};

export default postcss.plugin(pluginName, () => (css, result) => {
  const { imports, exports } = extractICSS(css);

  if (Object.keys(imports).length > 0) {
    result.messages.push({
      type: 'import',
      plugin: pluginName,
      tokens: imports,
    });
  }

  if (Object.keys(exports).length > 0) {
    result.messages.push({
      type: 'export',
      plugin: pluginName,
      tokens: exports,
    });
  }
});
