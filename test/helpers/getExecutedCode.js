import { execute, readAsset } from "./index";

export default (asset, compiler, stats, type) => {
  let executed = execute(readAsset(asset, compiler, stats), type);

  if (Array.isArray(executed)) {
    executed = executed.map((module) => {
      if (module[0] && typeof module[0].replace === "function") {
        // eslint-disable-next-line no-param-reassign
        module[0] = module[0].replace(/!\.\/=!/g, "!=!");
        // eslint-disable-next-line no-param-reassign
        module[0] = module[0].replace(/\.\/(.+)!=!/g, "$1!=!");
      }

      return module;
    });
  }

  if (executed && typeof executed.text !== "undefined") {
    executed.text = executed.text.replace(/file:\/\/\/[a-z]:\//gi, "file:///");
  } else if (Array.isArray(executed)) {
    executed.forEach((item) => {
      if (typeof item.text !== "undefined") {
        // eslint-disable-next-line no-param-reassign
        item.text = item.text.replace(/file:\/\/\/[a-z]:\//gi, "file:///");
      }
    });
  }

  return executed;
};
