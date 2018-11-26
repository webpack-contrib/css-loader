/* eslint-env mocha */

require('should');
const escape = require('../lib/runtime/escape');

describe('runtime escape', () => {
  it('should escape url', () => {
    escape(true).should.be.eql(true);
    escape('image.png').should.be.eql('image.png');
    escape('"image.png"').should.be.eql('image.png');
    escape("'image.png'").should.be.eql('image.png');
    escape('image other.png').should.be.eql('"image other.png"');
    escape('"image other.png"').should.be.eql('"image other.png"');
    escape("'image other.png'").should.be.eql('"image other.png"');
    escape('image"other.png').should.be.eql('"image\\"other.png"');
    escape('image\nother.png').should.be.eql('"image\\nother.png"');
  });
});
