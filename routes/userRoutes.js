const express = require('express');

const router = express.Router();
const authController = require('../counters/authController')

const { getAllUsers, creatUser, getUser, updateUser, deleteUser, updateMe, DeleteMe, getMe } = require('../counters/userCounter');

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/forgotpassword').post(authController.forgotPassword);
router.route('/resetpassword/:token').patch(authController.resetpassword);

router.use(authController.protect);

router.route('/me').get(getMe, getUser);
router.route('/updatemypassword').patch(authController.updatePassword);

router.route('/updateme').patch(updateMe);
router.route('/deleteme').patch(DeleteMe);


router.use(authController.restrictTo('admin'));


router.
    route('/').
    get(getAllUsers).
    post(creatUser);


router.
    route('/:id').
    get(getUser).
    patch(updateUser).
    delete(deleteUser);


module.exports = router;



