module.exports = function loader(content) {
    console.log(Buffer.from(this.query.slice(1), 'base64').toString('ascii'))
    return Buffer.from(this.query.slice(1), 'base64').toString('ascii');
};
