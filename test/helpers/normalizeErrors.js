import stripAnsi from "strip-ansi";

export function removeCWD(str) {
  const isWin = process.platform === "win32";
  let cwd = process.cwd();

  if (isWin) {
    if (str.split("\n").length > 3) {
      // @import '\
      // \
      // \
      // ';

      return stripAnsi(str)
        .replace(/\(from .*?\)/, "(from `replaced original path`)")
        .replaceAll(new RegExp(cwd, "g"), "");
    }

    str = str.replaceAll("\\", "/");

    cwd = cwd.replaceAll("\\", "/");
  }

  return stripAnsi(str)
    .replace(/\(from .*?\)/, "(from `replaced original path`)")
    .replaceAll(new RegExp(cwd, "g"), "");
}

export default (errors, shortError, type) =>
  errors.map((error) => {
    let errorMessage = error.toString();

    if (shortError) {
      errorMessage = errorMessage.split("\n").slice(0, 2).join("\n");
    }

    if (type === "postcss") {
      errorMessage = errorMessage
        .split("\n")
        .map((str) => {
          if (/^\(/i.test(str)) {
            return removeCWD(str);
          }

          return str;
        })
        .join("\n");
    }

    return removeCWD(errorMessage.split("\n").slice(0, 12).join("\n"));
  });
