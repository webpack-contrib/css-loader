var helpers = require('./helpers.js');
var cssLoader = require('../index.js');

describe('imported modules', function(){
    var source = "" +
        ':import("imported.css") {\n' +
            'importedClassB: classB;\n' +
        '}\n' +
        '\n' +
        '.classA > :ref(.importedClassB) {\n' +
            'color: red;\n' +
        '}\n';

    var imported = '' +
        '.classB {\n' +
            'color: orange;\n' +
        '}\n' +
        '\n' +
        ':export {\n' +
            'classB: classB;\n' +
        '}\n';

    var expected = '' +
        '.source_classA_ > .imported_classB_ {\n' +
            'color: red;\n' +
        '}\n';
    var modules = {};

    beforeEach(function(done){
        helpers.runLoader(cssLoader, imported, undefined, {
            query: "?module&sourceMap&localIdentName=[name]_[local]_",
            resourcePath: './imported.css',
        }, function(err, output) {
            if (err) {
                done(err);
                return;
            }

            modules = {
                'imported.css' : helpers.getEvaluated(output, modules),
            }
            done();
        });
    });

    it('outputs the names prefixed by `imported`', function(done){
        helpers.runLoader(cssLoader, source, undefined, {
            query: "?module&sourceMap&localIdentName=[name]_[local]_",
            resourcePath: './source.css',
        }, function(err, output) {
            if (err) {
                done(err);
                return;
            }
            var exports = helpers.getEvaluated(output, modules);
            Array.isArray(exports).should.be.eql(true);
            (exports.length).should.be.eql(2);
            (exports[0].length >= 3).should.be.eql(true);
            (exports[0][0]).should.be.eql(1);
            (exports[0][2]).should.be.eql("");
            (exports[1][1]).should.be.eql(expected);
            (exports.locals.classA).should.be.eql('source_classA_');
            done();
        });
    })
});
