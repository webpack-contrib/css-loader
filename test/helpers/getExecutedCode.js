import { execute, readAsset } from "./index";

export default (asset, compiler, stats, type) => {
  let executed = execute(readAsset(asset, compiler, stats), type);

  if (Array.isArray(executed)) {
    executed = executed.map((module) => {
      if (module[0] && typeof module[0].replace === "function") {
        module[0] = module[0].replaceAll("!./=!", "!=!");

        module[0] = module[0].replaceAll(/\.\/(.+)!=!/g, "$1!=!");
      }

      return module;
    });
  }

  if (executed && typeof executed.text !== "undefined") {
    executed.text = executed.text.replaceAll(
      /file:\/\/\/[a-z]:\//gi,
      "file:///",
    );
  } else if (Array.isArray(executed)) {
    for (const item of executed) {
      if (typeof item.text !== "undefined") {
        item.text = item.text.replaceAll(/file:\/\/\/[a-z]:\//gi, "file:///");
      }
    }
  }

  return executed;
};
