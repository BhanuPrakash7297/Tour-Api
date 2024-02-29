
const { findById } = require('../models/usermodel');
const AppError = require('../utils/appError');
const User = require('../models/usermodel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
    //1)
    if (req.body.password || req.passwordConfirm) {
        return next(new AppError('This is not place to update password', 400));
    }

    //2) Update user document here 
    // here we are going to use findByIdAndUpdage method as we does not want to update
    // some required fields here 

    const filterBody = filterObj(req.body, 'name', 'email');
    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    })
});


exports.DeleteMe = catchAsync(async (req, res, next) => {

    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    })
})


exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}
    ;

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.creatUser = factory.createOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

