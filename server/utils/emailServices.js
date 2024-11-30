const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: 465,
    secure: true,
    secureConnection: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: true
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
        throw error;
    }
};

const sendTicketEmail = async (booking) => {
    const subject = `LEJET Airlines - E-Ticket Confirmation (${booking.ticketNumber})`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">LEJET Airlines E-Ticket</h1>
            <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
                <h2>Booking Details</h2>
                <p><strong>Ticket Number:</strong> ${booking.ticketNumber}</p>
                <p><strong>Flight:</strong> ${booking.flight.from} to ${booking.flight.to}</p>
                <p><strong>Date:</strong> ${new Date(booking.flight.departureTime).toLocaleString()}</p>
                <p><strong>Class:</strong> ${booking.seatClass}</p>
                <p><strong>Passengers:</strong> ${booking.passengers}</p>
                <p><strong>Total Amount:</strong> GH₵${booking.totalAmount}</p>
            </div>
        </div>
    `;
    
    await sendEmail(booking.user.email, subject, html);
};

module.exports = {
    sendEmail,
    sendTicketEmail
};