import stripAnsi from 'strip-ansi';

function removeCWD(str) {
  const isWin = process.platform === 'win32';
  let cwd = process.cwd();

  if (isWin) {
    // eslint-disable-next-line no-param-reassign
    str = str.replace(/\\/g, '/');
    // eslint-disable-next-line no-param-reassign
    cwd = cwd.replace(/\\/g, '/');
  }

  return stripAnsi(str)
    .replace(/\(from .*?\)/, '(from `replaced original path`)')
    .replace(new RegExp(cwd, 'g'), '');
}

export default (errors) => {
  return errors.map((error) =>
    removeCWD(error.toString().split('\n').slice(0, 12).join('\n'))
  );
};
