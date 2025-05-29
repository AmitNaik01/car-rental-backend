const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using your SMTP credentials
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another provider
  auth: {
    user: process.env.EMAIL_USER, // e.g., your Gmail address
    pass: process.env.EMAIL_PASS  // app password if 2FA is enabled
  }
});

// 👉 Actual sendResetCode function
const sendResetCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Password Reset Code',
    text: `Your password reset code is: ${code}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Reset code email sent:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
};



module.exports = {
  sendResetCode
};
