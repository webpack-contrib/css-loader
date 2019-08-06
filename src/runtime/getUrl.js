module.exports = (url, needQuotes) => {
  // eslint-disable-next-line no-underscore-dangle, no-param-reassign
  url = url.__esModule ? url.default : url;

  if (typeof url !== 'string') {
    return url;
  }

  // If url is already wrapped in quotes, remove them
  if (/^['"].*['"]$/.test(url)) {
    // eslint-disable-next-line no-param-reassign
    url = url.slice(1, -1);
  }

  // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls
  if (/["'() \t\n]/.test(url) || needQuotes) {
    return `"${url.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }

  return url;
};
