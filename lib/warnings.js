// cache process id
var cachedProcessId = 0;

/**
 * Shows one warning per process if NODE_ENV is production and minimize is not enabled
 * @method minimizeInProduction
 * @param {Boolean} minimize minimize value form query
 * @param {Object} processObject current process object
 * @param {Object} loader current loader context
 * @returns {undefined}
 */
function minimizeInProduction(minimize, processObject, loader) {
  if (processObject.env.NODE_ENV === "production" && !minimize && processObject.pid !== cachedProcessId) {
    // update process id
    cachedProcessId = processObject.pid;

    // show warning
    loader.emitWarning("\n\nCSS Loader\n\nBuilding for production?\nWe suggest enabling minimize (https://github.com/webpack-contrib/css-loader#minimize).\n");
  }
}

module.exports = {
  minimizeInProduction: minimizeInProduction
};
