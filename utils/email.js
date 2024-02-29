const nodemailer = require('nodemailer');

const catchAsync = require('./catchAsync');
const sendEmail = catchAsync(async (options) => {
    //   1) create a transporter which is server itself not node 

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_POST,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    })

    //2)Define the email options

    const mailOptions = {
        from: 'Bhanu prakash sen <bhanu@hello.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,

        // html document here 

    }


    //3) actually sent the email

    await transporter.sendMail(mailOptions)

}
);
module.exports = sendEmail;