const appError = require('../utils/appError');

const handleCastErrorDB = err => {
    console.log('welcoem to dkjfldjlfdlfjl');
    const message = `Invalid ${err.path}:${err.value}`;
    return new appError(message, 400);
}

const handleFieldErrorDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new appError(message, 400);

}

const handleValidateErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid Input data :${errors.join('.')}`
    return new appError(message, 400);
}


const handleTokenErrorDB = err => new appError('Invalid Token', 401);

const handleExpiredTokenErrorDB = err => new appError('Your user login credential got expired try to create new user interface', 401);


const sendErrorDev = (err, req, res) => {
    // A) API
    console.log(req.originalUrl);
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // B) RENDERED WEBSITE
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    });
};


const sendErrorProd = (err, req, res) => {
    // A) API
    console.log("helooo dfdlfjldjfldjlfjl;;;;;;;;;;;;;;;")
    console.log(req.originalUrl.startsWith('/api'));
    if (req.originalUrl.startsWith('/api')) {
        // A) Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        // B) Programming or other unknown error: don't leak error details
        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }

    if (err.isOperational) {
        console.log(err);
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
}

module.exports = ((err, req, res, next) => {
    console.log("nameste", req.originalUrl);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {

        sendErrorDev(err, res);
    }

    else if (process.env.NODE_ENV.trim() === 'production') {

        console.log("welcome to production here")
        console.log("error");
        if (err.name === 'CastError')
            sendErrorProd(handleCastErrorDB(err), res);

        else if (err.code === 11000) sendErrorProd(handleFieldErrorDB(err), req, res);

        else if (err.name === 'ValidationError') sendErrorProd(handleValidateErrorDB(err), req, res);

        else if (err.name === 'JsonWebTokenError') sendErrorProd(handleTokenErrorDB(err), req, res);

        else if (err.name === 'TokenExpiredError') sendErrorProd(handleExpiredTokenErrorDB(err), req, res);

        else sendErrorProd(err, req, res);

    }
    next();
})

