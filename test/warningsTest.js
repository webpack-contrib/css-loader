/*eslint-env mocha*/

var should = require("should");
require("should-spies");

var warnings = require("../lib/warnings");


describe("warnings", function() {
  var originalConsole = console;
  var warningSpy;
  var mockedConsole;

  beforeEach(function() {
    mockedConsole = {
      warn: function() {}
    }

    warnings.minimizeInProduction._console = mockedConsole;

    warningSpy = should.spy.on(mockedConsole, 'warn');
  });

  afterEach(function() {
    warnings.minimizeInProduction._console = originalConsole;
  });

  it("minimize warning is displayed on production when minimized is false", function() {
    var mockedProcess = {
      pid: 1,
      env: {
        NODE_ENV: "production"
      }
    };

    warnings.minimizeInProduction(false, mockedProcess);

    warningSpy.should.be.called();
  });

  it("minimize warning is not displayed on production when minimized is true", function() {
    var mockedProcess = {
      pid: 1,
      env: {
        NODE_ENV: "production"
      }
    };

    warnings.minimizeInProduction(true, mockedProcess);

    warningSpy.should.not.be.called();
  });

  it("minimize warning is not displayed on production when minimized is an object", function() {
    var mockedProcess = {
      pid: 1,
      env: {
        NODE_ENV: "production"
      }
    };

    warnings.minimizeInProduction({}, mockedProcess);

    warningSpy.should.not.be.called();
  });

});
