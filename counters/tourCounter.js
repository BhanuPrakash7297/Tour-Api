const fs = require('fs');
const Tour = require('../models/tourModel');

const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
    next();
}



exports.getAllTours = factory.getAll(Tour);




exports.creatTour = factory.createOne(Tour);

exports.getUpdate = factory.updateOne(Tour);

exports.getTours = factory.getOne(Tour, {
    path: 'reviews'
}, {
    path: 'guides',
    select: '-__v -passwordChangedAt'
}
);// here we can add also select in with path

exports.getDelete = factory.deleteOne(Tour);


exports.getTourStates = catchAsync(async (req, res) => {


    const stats = await Tour.aggregate([{
        $match: { price: { $gt: 100 } }
    },

    {
        $group: {
            _id: { $toUpper: '$difficulty' },
            numTours: { $sum: 1 },
            avgRating: { $avg: '$ratingAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
        }
    },

    {
        $sort: { avgPrice: 1 }
    }


    ]);


    res.status(200).json({
        status: "success",
        data: {
            stats
        }
    })


})




exports.getMonthlyTours = catchAsync(async (req, res) => {

    const year = req.params.year;
    const monthTours = await Tour.aggregate([
        {
            // $unwind: '$startDates'
            $unwind:
            {
                path: "$startDates",
                includeArrayIndex: "arrayIndex"
            }
        }
        , {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-1-1`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },

        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $sum: 1 },
                arrayIndex: { $first: "$arrayIndex" },
                tours: { $push: '$name' }
            }
        }
        , {
            $addFields: {
                month: '$_id'
            }
        }

    ])

    res.status(200).json({
        status: "success",
        data: {
            monthTours
        }
    })

});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(
            new AppError('Please provide latitutr and longitude in the formate lat,lng.', 400)
        )
    }

    const tours = await Tour.find({
        'startLocation': { $geoWithin: { $centerSphere: [[lng, lat], radius] } }// if there is only one array fild within startlocation than 
        //there so no need to mention coordingates array othere we have to use below syntax here
        // also in index 
        // 'startLocation.coordinates': { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })
        ;

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    })


});


exports.getDistances = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng) {
        next(
            new AppError('Please provide latitutr and longitude in the formate lat,lng.', 400)
        )
    }

    const distances = await Tour.aggregate([{
        $geoNear: {
            near: {
                type: 'Point',
                coordinates: [lng * 1, lat * 1]
            },
            distanceField: 'distance',
            distanceMultiplier: multiplier
        }
    }
        , {
        $project: {
            distance: 1,
            name: 1
        }
    }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            distances
        }
    })

});