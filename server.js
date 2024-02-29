
const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('UNCAUGHT EXCEPTION ERR SHUTTING DOWN....');
    process.exit();
})





console.log('environement variables', process.env.JWT_SECRET);
const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});


process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    // console.log(err);
    console.log('UNHANDLER REJECTION SHUTTING DOWN....')
    server.close(() => {
        process.exit(1);
    })
})

// console.log(x);    // when we put it in app.js inside the middle ware then we will get
// then this error will be send to error handler for request and there will not be unccaught exception errorlike here
//
//
// commands to set environment variable $env:X = "25"; nodemon server.j

// hello welocme

