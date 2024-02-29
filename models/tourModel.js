
const mongoose = require('mongoose');
const slugify = require('slugify');

const validator = require('validator');
const Review = require('./review');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must have less or equal then 40 characters'],
            minlength: [10, 'A tour name must have more or equal then 10 characters']
            // validate: [validator.isAlpha, 'Tour name must only contain characters']
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium, difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            set: val => Math.round(val * 10) / 10 // 4.666666, 46.6666, 47, 4.7
        },

        ratingsQuantity: {
            type: Number,
            default: 0
        },


        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this only points to current doc on NEW document creation
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) should be below regular price'
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have a summary']
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },

        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],

        // guides:Array // for embadded type of modeling in which we willput id in guide in during create object 
        // after that we will have corresponding user in guide array for that we used pre middleware for that
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },

    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// tourSchema.index({ price: 1 });




tourSchema.index({ price: 1, ratingsAverage: -1 });// for compound queries even if we don't have compound quewy then i will too work

// tourSchema.index({ 'startLocation.coordinates': '2dsphere' });
tourSchema.index({ 'startLocation': '2dsphere' });// if only coordingation array is present than no need to mention coordinate here

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
})


tourSchema.virtual('reviews', {
    ref: 'Review',// regerence whome document is poputlated here
    foreignField: 'tour',// the filed which is present in review which belongs to cucrrent document
    localField: '_id'//  the local perameter who stablizes a relation ship between tour and review
});


tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });  // this points to current document
    next();
})

// tourSchema.pre('/^find/', function (next) {
//     console.log("hellodfldsjlfjdlfjldslfjdkljfldj")
//     this.populate({
//         path: 'guides',
//         select: '-__v -passwordChangedAt'
//     })
//     next();
// });

tourSchema.pre('findById', function (next) {
    console.log("nad;jfdjfldjfkl;;;;;;;;;;;")
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    })
    next();
});

//EXMAPLE OF EMBEDING 
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });



// tourSchema.pre('save', function (next) {
//     console.log("hello this is second pre middleware")
//     next();
// })

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// })

// tourSchema.pre('find', function (next) {
// bow it will include find one too
// tourSchema.pre('find', function (next) {
//     this.find({ secretTour: { $ne: true } });
//     this.start = Date.now();
//     next();
// });

// tourSchema.post('find', function (doc, next) {
//     console.log(`Query took ${Date.now() - this.start} miliseconds`);
//     // console.log(doc);
//     next();
// });

// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
// })


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;