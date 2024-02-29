const path = require('path');
const express = require('express');

const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./counters/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const overviewRouter = require('./routes/viewRoutes');



const morgan = require('morgan');

app.use(cookieParser());

app.use(helmet({ contentSecurityPolicy: false }));

// Middle ware stack

app.set('view engine', 'pug');//It sets the view engine for rendering dynamic HTML templates to Pug (formerly known as Jade).

app.set('views', path.join(__dirname, 'views'));

app.use(helmet());
console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV === 'development') {
    console.log(`Welcome in ${process.env.NODE_ENV}`);
    app.use(logger('dev'));
}

// Limit request ffrom same api 

const limiter = rateLimit({
    max: 3,
    windowsMs: 60 * 60 * 1000,
    message: 'Too many request from this ip please try again in hour'
})

app.use('/api', limiter);

// Body parser ,reading data from  bodyi into req body 
app.use(express.json({ limit: '10kb' })); // middle ware
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution this is used to use duplicate query in http request 
app.use(
    hpp({
        whitelist: [
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
);

// saving static files;
// app.use(express.static(`${__dirname}/ public / overview.html`));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log('reqested header is here', req.headers);
    req.requestTime = new Date().toISOString();
    next();
});


// Noew as req to res cycle will end here so other code will not excute so middleware will not print anyting here

// but req send as patch or delete or get then we will get message welcome at middleware
//Routes


// app.get('/', (req, res) => {
//     res.status(200).render('base')
// }
// )



// app.get('/tour', (req, res) => {
//     res.status(200).render('tour', {
//         title: 'The Forest Hiker Tour'
//     });
// });

app.use('/', overviewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


app.all('*', (req, res, next) => {
    next(new AppError(`can not find ${req.originalUrl} on this server`, 404));
})



app.use(globalErrorHandler);


module.exports = app;


