const User = require('../models/usermodel');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const sendEmail = require('../utils/email');

const { promisify } = require('util');

const crypto = require('crypto');
const { appendFile } = require('fs');

console.log("sing Token", process.env.JWT_SECRET);
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN
});


const createSentToken = (user, statusCode, res) => {
    console.log("hello welocme in createToken")
    const token = signToken(user._id);
    console.log(token);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};




exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    createSentToken(newUser, 201, res);

    next();
});



exports.login = catchAsync(async (req, res, next) => {

    const { email, password } = req.body;

    // check the weather email and password exist or not
    console.log("hello bhiadlfjdfdjfdf;ds;fjdfjdlfjdlfjldjfdjf");
    if (!email || !password) return next(new appError('Please provide email or password', 400));

    //check if user exist and password are correct
    const user = await User.findOne({ email }).select('+password').select(`active:{$ne:false}`);

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new appError('Please Check Email or Password', 401));
    }

    createSentToken(user, 200, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 100 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};


exports.protect = catchAsync(async (req, res, next) => {

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }


    if (!token) return next(new appError('Your are not logged in! Please log in to get access', 401));

    console.log(token);
    // 2) Verfication token 
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    console.log(decode)

    //3) Check if user still exist or not 
    const currentUser = await User.findById(decode.id);

    if (!currentUser) next(new appError('the user belonging to this token is not existing', 401))

    // 4)
    console.log(currentUser.changedPasswordAfter(decode.iat))
    if (currentUser.changedPasswordAfter(decode.iat)) {
        return next(
            new appError('User recently changed password! Please log in again.', 401)
        );
    }
    console.log("hello")
    //GRANT ACCESSS TO PROTECRED ROUTE HERE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();

});

exports.isLoggedIn = async (req, res, next) => {
    console.log("welcome in is loggin")
    console.log(req.cookies);

    if (req.cookies.jwt) {
        try {
            // 1) verify token
            console.log("hellldfjldfldjlfjdlfjldlfjdlfjldjfldjfdllfdlflk")
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            console.log("Namste ji")
            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return next(
                new appError('You do not have permission to perform this action', 403)
            );
        }

        next();
    };
};


exports.forgotPassword = catchAsync(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new appError('user with given email id couldnt find', 404));

    // 2) generate random reset token here 
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) send it to user email acount
    console.log(user);


    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;
    console.log(" reset url", resetURL);
    const message = `forget your password ?submit a patch request with your new Password and 
    password confirm to :${resetURL} .\n if you didn't forget your password ,please ignore this email`;

    console.log(message);

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token is (valid for 10 min)',
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'token sent to email'
        })
    } catch (err) {
        user.PasswordResetToken = undefined;
        user.PasswordResetExpire = undefined;
        await user.save({ validateBeforeSave: false });
        next(new appError('There was an error to sending email please try again', 500));
    }

});

exports.resetpassword = catchAsync(async (req, res, next) => {
    //1) get user based on token


    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    console.log("hashedtoken", hashedToken, "origin token:", " 3a2e903486624bae227ba467a63047cf85c6a5bfe9bc50937f6f65edc72de5f5");

    const user = await User.findOne({
        PasswordResetToken: hashedToken,
        PasswordResetExpires: { $gt: Date.now() }
    });
    console.log('date right now', new Date())
    console.log("hello users", user)
    //2) if token has not expired then there is user set the password for that

    if (!user) return next(new appError('Token is invalid or expired', 400));


    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save();

    createSentToken(user, 200, res);

});


exports.updatePassword = catchAsync(async (req, res, next) => {

    //1) get collection from user
    console.log("my name is bhanu prakash sen")
    const user = await User.findById(req.user.id).select('+password');

    //2) check current posted password is correct or not
    console.log("update my password dise", req.body.passwordCurrent);
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new appError('Your current password is wrong', 401));
    }


    // update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    createSentToken(user, 200, res);

});


