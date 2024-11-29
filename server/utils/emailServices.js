const nodemailer = require('nodemailer');
// require("dotenv").config()

const transporter = nodemailer.createTransport({
    service:"Gmail",
    port:465,
    secure:true,
    // logger:true,
    // debug:true,  
    secureConnection:false,
    auth:{
        user:process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls:{
        rejectUnauthorized:true
    },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
