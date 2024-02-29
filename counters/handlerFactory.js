const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');


exports.deleteOne = model => catchAsync(async (req, res, next) => {

    const doc = await model.findByIdAndDelete(req.params.id);

    if (!doc) return next(new AppError('document with this id doesnot exist', 404));

    res.status(204).json({
        status: "success",
        data: null
    })
});



exports.updateOne = model => catchAsync(async (req, res, next) => {


    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError('No document  is found with that id', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            doc
        }
    })
});


exports.createOne = (model) => catchAsync(async (req, res, next) => {

    const doc = await model.create(req.body);

    if (!doc) {
        return next(new AppError('No tour is found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: doc
        }
    })
});

exports.getOne = (model, popOptions, popOption2) => catchAsync(async (req, res, next) => {

    let query = model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions).populate(popOption2);
    const doc = await query;



    if (!doc) {
        return next(new AppError('No tour is found with that ID', 404));
    }

    //Tour.findOne({_id:req.params.id}); // this can be used but above methiond code is from mongoose
    res.status(200).json({
        status: 'success',
        requestAt: req.requestTime,
        data: {
            doc
        }
    })


});


exports.getAll = (model) => catchAsync(async (req, res, next) => {
    let filter = {};

    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new ApiFeatures(model.find(), req.query).
        filter()
        .sort()
        .limit()
        .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            doc
        }
    });

});

