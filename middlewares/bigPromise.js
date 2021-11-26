// try catch and async - await // use promise everyware

module.exports = (func) => (req, res, next) =>
    Promise.resolve(func(res, res, next)).catch(next);
