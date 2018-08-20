import postcss from 'postcss';

const createICSSImports = (imports) =>
  Object.keys(imports).map((path) => {
    const aliases = imports[path];
    const declarations = Object.keys(aliases).map((key) =>
      postcss.decl({
        prop: key,
        value: aliases[key],
        raws: { before: '\n  ' },
      })
    );

    return postcss
      .rule({
        selector: `:import(${path})`,
        raws: { after: '\n' },
      })
      .append(declarations);
  });

export default { createICSSImports };
