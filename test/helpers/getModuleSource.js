export default (id, stats) => {
  const { modules } = stats.toJson({ source: true });
  const module = modules.find((m) => m.id === id);

  return module.source;
};
