/*eslint-env mocha*/

var should = require("should");
require("should-spies");

var warnings = require("../lib/warnings");


describe("warnings", function() {
  var warningSpy;
  var mockedLoader;

  beforeEach(function() {
    mockedLoader = {
      emitWarning: function() {
        return undefined;
      }
    }

    warningSpy = should.spy.on(mockedLoader, 'emitWarning');
  });

  afterEach(function() {
    warningSpy = null;
  });

  it("minimize warning is displayed on production when minimized is false", function() {
    var mockedProcess = {
      pid: 1,
      env: {
        NODE_ENV: "production"
      }
    };

    warnings.minimizeInProduction(false, mockedProcess, mockedLoader);

    warningSpy.should.be.called();
  });

  it("minimize warning is not displayed on production when minimized is true", function() {
    var mockedProcess = {
      pid: 1,
      env: {
        NODE_ENV: "production"
      }
    };

    warnings.minimizeInProduction(true, mockedProcess, mockedLoader);

    warningSpy.should.not.be.called();
  });

  it("minimize warning is not displayed on production when minimized is an object", function() {
    var mockedProcess = {
      pid: 1,
      env: {
        NODE_ENV: "production"
      }
    };

    warnings.minimizeInProduction({}, mockedProcess, mockedLoader);

    warningSpy.should.not.be.called();
  });

});
