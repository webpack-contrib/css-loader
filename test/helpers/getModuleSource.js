export default (id, stats) => {
  const { modules } = stats.toJson({ source: true });
  const module = modules.find((m) => m.id === id);
  let { source } = module;

  // Todo remove after drop webpack@4 support
  source = source.replace(/\?\?.*!/, '??[ident]!');

  return source;
};
