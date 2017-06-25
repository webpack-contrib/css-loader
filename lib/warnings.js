// cache process id
var cachedProcessId = 0;

/**
 * Shows one warning per process if NODE_ENV is production and minimize is not enabled
 * @method minimizeInProduction
 * @param {Boolean} minimize
 * @param {Object} processObject
 */
function minimizeInProduction(minimize, processObject) {
  if (processObject.env.NODE_ENV === "production" && !minimize && processObject.pid !== cachedProcessId) {
    // update process id
    cachedProcessId = processObject.pid;

    // show warning
    minimizeInProduction._console.warn("[css-loader] Building for production? We suggest enabling minimize (https://github.com/webpack-contrib/css-loader#minimize).\n");
  }
}

// allow console object mock up during test
minimizeInProduction._console = console;

module.exports = {
  minimizeInProduction: minimizeInProduction
};
