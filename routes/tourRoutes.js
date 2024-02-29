
const express = require('express');
const { getTours, getUpdate, getDelete, creatTour, getAllTours, aliasTopTours, getTourStates, getMonthlyTours, getToursWithin, getDistances } = require('../counters/tourCounter');
const authController = require('../counters/authController');
const router = express.Router();

const reviewRouter = require('../routes/reviewRoutes');

// router.param('id', checkId); we can use this middlware to check id here


router.use('/:tourId/review', reviewRouter);

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(getDistances);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours)
router.route('/tour-state').get(getTourStates);

router.route('/monthly-tour/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide'), getMonthlyTours);

router.
    route('/').get(getAllTours).post(authController.protect, authController.restrictTo('admin', 'lead-guide'), creatTour);


router.
    route('/:id').
    get(getTours).
    patch(getUpdate).
    delete(authController.protect, authController.restrictTo('user'), getDelete);

// router.route('/:tourId/review').post(authController.protect, authController.restrictTo('user'), reviewCounter.createReview);



module.exports = router;

