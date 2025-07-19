import Module from "node:module";
import path from "node:path";

const parentModule = module;

/**
 * @param data
 */
function replaceAbsolutePath(data) {
  if (Array.isArray(data)) {
    return data.map((_) => replaceAbsolutePath(_));
  }

  return typeof data === "string"
    ? data.replaceAll(/file:\/\/\/(\D:\/)?/gi, "replaced_file_protocol_/")
    : data;
}

export default (code, type) => {
  const resource = "test.js";
  const module = new Module(resource, parentModule);

  module.paths = Module._nodeModulePaths(
    path.resolve(__dirname, "../fixtures"),
  );
  module.filename = resource;

  let newCode = code;

  newCode = `
global.btoa = (string) => { return Buffer.from(string).toString('base64') };
${newCode}
`;

  if (type === "css-style-sheet") {
    newCode = `   
global.CSSStyleSheet = class CSSStyleSheet { replaceSync(text) { this.text = text; } };
global.document = { adoptedStyleSheets: [] };
${newCode}
`;
  }

  module._compile(
    `let __export__;${newCode};\nmodule.exports = __export__;`,
    resource,
  );

  return replaceAbsolutePath(module.exports);
};
