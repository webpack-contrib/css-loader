const path = require("path");
const fs = require("fs");

const CSS_LOADER_REPLACEMENT_REGEX =
  /(___CSS_LOADER_ICSS_IMPORT_\d+_REPLACEMENT_\d+___)/g;
const REPLACEMENT_REGEX = /___REPLACEMENT\[(.*?)]\[(.*?)]___/g;
const IDENTIFIER_REGEX = /\[(.*?)]\[(.*?)]/;
const replacementsMap = {};
const canonicalValuesMap = {};
const allExportsJson = {};

function generateIdentifier(resourcePath, localName) {
  return `[${resourcePath}][${localName}]`;
}

function addReplacements(resourcePath, imports, exportsJson, replacements) {
  const importReplacementsMap = {};

  // create a dict to quickly identify imports and get their absolute stand-in strings in the currently loaded file
  // e.g., { '___CSS_LOADER_ICSS_IMPORT_0_REPLACEMENT_0___': '___REPLACEMENT[/foo/bar/baz.css][main]___' }
  importReplacementsMap[resourcePath] = replacements.reduce(
    (acc, { replacementName, importName, localName }) => {
      const replacementImportUrl = imports.find(
        (importData) => importData.importName === importName,
      ).url;
      const relativePathRe = /.*!(.*)"/;
      const [, relativePath] = replacementImportUrl.match(relativePathRe);
      const importPath = path.resolve(path.dirname(resourcePath), relativePath);
      const identifier = generateIdentifier(importPath, localName);
      return { ...acc, [replacementName]: `___REPLACEMENT${identifier}___` };
    },
    {},
  );

  // iterate through the raw exports and add stand-in variables
  // ('___REPLACEMENT[<absolute_path>][<class_name>]___')
  // to be replaced in the plugin below
  for (const [localName, classNames] of Object.entries(exportsJson)) {
    const identifier = generateIdentifier(resourcePath, localName);

    if (CSS_LOADER_REPLACEMENT_REGEX.test(classNames)) {
      // if there are any replacements needed in the concatenated class names,
      // add them all to the replacements map to be replaced altogether later
      replacementsMap[identifier] = classNames.replaceAll(
        CSS_LOADER_REPLACEMENT_REGEX,
        (_, replacementName) =>
          importReplacementsMap[resourcePath][replacementName],
      );
    } else {
      // otherwise, no class names need replacements so we can add them to
      // canonical values map and all exports JSON verbatim
      canonicalValuesMap[identifier] = classNames;

      allExportsJson[resourcePath] = allExportsJson[resourcePath] || {};
      allExportsJson[resourcePath][localName] = classNames;
    }
  }
}

function replaceReplacements(classNames) {
  return classNames.replaceAll(
    REPLACEMENT_REGEX,
    (_, resourcePath, localName) => {
      const identifier = generateIdentifier(resourcePath, localName);

      if (identifier in canonicalValuesMap) {
        return canonicalValuesMap[identifier];
      }

      // Recurse through other stand-in that may be imports
      const canonicalValue = replaceReplacements(replacementsMap[identifier]);

      canonicalValuesMap[identifier] = canonicalValue;

      return canonicalValue;
    },
  );
}

function getJSON({ resourcePath, imports, exports, replacements }) {
  const exportsJson = exports.reduce((acc, { name, value }) => {
    return { ...acc, [name]: value };
  }, {});

  if (replacements.length > 0) {
    // replacements present --> add stand-in values for absolute paths and local names,
    // which will be resolved to their canonical values in the plugin below
    addReplacements(resourcePath, imports, exportsJson, replacements);
  } else {
    // no replacements present --> add to canonicalValuesMap verbatim
    // since all values here are canonical/don't need resolution
    for (const [key, value] of Object.entries(exportsJson)) {
      const id = `[${resourcePath}][${key}]`;

      canonicalValuesMap[id] = value;
    }

    allExportsJson[resourcePath] = exportsJson;
  }
}

class CssModulesJsonPlugin {
  constructor(options) {
    this.options = options;
  }

  // eslint-disable-next-line class-methods-use-this
  apply(compiler) {
    compiler.hooks.emit.tap("CssModulesJsonPlugin", () => {
      for (const [identifier, classNames] of Object.entries(replacementsMap)) {
        const adjustedClassNames = replaceReplacements(classNames);

        replacementsMap[identifier] = adjustedClassNames;

        const [, resourcePath, localName] = identifier.match(IDENTIFIER_REGEX);

        allExportsJson[resourcePath] = allExportsJson[resourcePath] || {};
        allExportsJson[resourcePath][localName] = adjustedClassNames;
      }

      fs.writeFileSync(
        this.options.filepath,
        JSON.stringify(
          // Make path to be relative to `context` (your project root)
          Object.fromEntries(
            Object.entries(allExportsJson).map((key) => {
              // eslint-disable-next-line no-param-reassign
              key[0] = path.relative(compiler.context, key[0]);

              return key;
            }),
          ),
          null,
          2,
        ),
        "utf8",
      );
    });
  }
}

module.exports = { getJSON, CssModulesJsonPlugin };
