const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/emailServices');

router.get('/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const flights = await Flight.find({
      from,
      to,
      departureTime: { $gte: new Date(date) }
    }).populate('airplane');
    res.json(flights);
  } catch (error) {
    res.status(500).json({ message: 'Error searching flights' });
  }
});

router.post('/book', auth, async (req, res) => {
  try {
    const { flightId, seatClass } = req.body;
    const flight = await Flight.findById(flightId).populate('airplane');
    const ticketNumber = `LEJET-${Date.now().toString().slice(-6).toUpperCase()}`;
    const booking = new Booking({
      user: req.user.userId,
      flight: flightId,
      seatClass,
      ticketNumber,
    });
    await booking.save();

    // Send confirmation email
    const emailHtml = `
      <h1>Booking Confirmation</h1>
      <p>Dear Passenger,</p>
      <p>Your flight has been successfully booked. Here are the details:</p>
      <ul>
        <li>Ticket Number: ${ticketNumber}</li>
        <li>Flight: ${flight.airplane.name}</li>
        <li>From: ${flight.from}</li>
        <li>To: ${flight.to}</li>
        <li>Departure: ${new Date(flight.departureTime).toLocaleString()}</li>
        <li>Seat Class: ${seatClass}</li>
      </ul>
      <p>Thank you for choosing LEJET Airline!</p>
    `;
    await sendEmail(req.user.email, 'Booking Confirmation - LEJET Airline', emailHtml);

    res.status(201).json({ message: 'Flight booked successfully', ticketNumber });
  } catch (error) {
    console.error('Error booking flight:', error);
    res.status(500).json({ message: 'Error booking flight' });
  }
});

router.get('/bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId }).populate('flight');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

router.put('/bookings/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { seatClass } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      { seatClass },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking' });
  }
});

router.delete('/bookings/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

module.exports = router;

