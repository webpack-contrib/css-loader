import { execute, readAsset } from "./index";

export default (asset, compiler, stats) => {
  let executed = execute(readAsset(asset, compiler, stats));

  if (Array.isArray(executed)) {
    executed = executed.map((module) => {
      // eslint-disable-next-line no-param-reassign
      module[0] = module[0].replace(/!\.\/=!/g, "!=!");
      // eslint-disable-next-line no-param-reassign
      module[0] = module[0].replace(/\.\/(.+)!=!/g, "$1!=!");

      return module;
    });
  }

  return executed;
};
