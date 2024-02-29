const express = require('express');

const router = express.Router({ mergeParams: true });// for mergin params from req router

const authController = require('../counters/authController');
const reviewCounter = require('../counters/reviewController');

router.use(authController.protect);
router.route('/').get(reviewCounter.getAllReviews).post(authController.restrictTo('user'), reviewCounter.setReviewId, reviewCounter.createReview);

router.route('/:id').get(reviewCounter.getReview).patch(authController.restrictTo('admin', 'user'), reviewCounter.updateReview).delete(authController.restrictTo('admin', 'user'), reviewCounter.deleteReview);

module.exports = router;


