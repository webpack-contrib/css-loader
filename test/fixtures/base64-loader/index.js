module.exports = function loader(content) {
    return Buffer.from(this.query.slice(1), 'base64').toString('ascii');
};