module.exports = function(url) {
    // If url is already wrapped in quotes, remove them
    if ((url[0] === '"' || url[0] === '\'') && url[0] === url[url.length - 1]) {
        url = url.slice(1, -1);
    }
    // Should url be wrapped?
    // See https://drafts.csswg.org/css-values-3/#urls
    if (/["'() \t\n]/.test(url)) {
        return '"' + url.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
    }

    return url
}
