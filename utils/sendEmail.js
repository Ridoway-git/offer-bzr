const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Define email options
    const mailOptions = {
        from: `${process.env.FROM_NAME || 'Offer Bazar'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // Send email
    console.log(`Attempting to send email to ${options.email}...`);
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error in sendMail:', error);
        throw error; // Re-throw to be handled by the caller
    }
};

module.exports = sendEmail;
