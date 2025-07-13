import readAsset from "./readAsset";

export default function readAssets(compiler, stats) {
  const assets = {};

  for (const asset of Object.keys(stats.compilation.assets)) {
    assets[asset] = readAsset(asset, compiler, stats);
  }

  return assets;
}
