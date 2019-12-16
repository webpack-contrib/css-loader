import { execute, readAsset } from './index';

export default (asset, compiler, stats) => {
  let executed = execute(readAsset(asset, compiler, stats));

  if (Array.isArray(executed)) {
    executed = executed.map((module) => {
      // Todo remove after drop webpack@4
      // eslint-disable-next-line no-param-reassign
      module[0] = module[0].replace(/\?.*!/g, '?[ident]!');

      return module;
    });
  }

  return executed;
};
