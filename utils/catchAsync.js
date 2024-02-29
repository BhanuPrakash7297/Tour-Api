
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,

    });
};

module.exports = fn => (req, res, next) => fn(req, res, next).catch(next);




