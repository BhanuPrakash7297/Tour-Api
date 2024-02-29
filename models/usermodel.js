
const url = require('eslint-plugin-node/lib/rules/prefer-global/url');
const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs');

const crypto = require('crypto');

const userSchema = new mongoose.Schema({


    name: {
        type: String,
        required: [true, 'Please tell your name!'],

    },
    email: {
        type: String,
        required: [true, 'please write your email '],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email id here'],
    },

    photo: {
        type: String,
    }
    ,
    password: {
        type: String,
        required: [true, 'please provide your password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [false, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not same'
        }
    },
    passwordChangedAt: Date,
    PasswordResetToken: String,
    PasswordResetExpires: Date
    ,
    active: {
        type: Boolean,
        default: true,
        select: false,

    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    }
});


userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});


userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;// some time token isssu is lit
    next();
});


userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});



userSchema.methods.correctPassword = async function (candidatePassword, UserPassword) {
    return await bcrypt.compare(candidatePassword, UserPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    console.log(this.passwordChangedAt);
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        console.log(JWTTimestamp, changedTimestamp)
        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};



userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.PasswordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log(this.PasswordResetToken, this.PasswordResetExpires);

    return resetToken;
}



const User = mongoose.model('User', userSchema);

module.exports = User;

