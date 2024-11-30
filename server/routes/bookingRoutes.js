const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    try {
      const { flightId, seatClass, passengers, totalAmount } = req.body;
      
      const booking = new Booking({
        user: req.user.id,
        flight: flightId,
        seatClass,
        passengers,
        totalAmount,
        ticketNumber: `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`,
        status: 'pending'
      });
  
      const savedBooking = await booking.save();
  
      res.status(201).json({
        message: 'Booking created successfully',
        booking: {
          id: savedBooking._id,
          ticketNumber: savedBooking.ticketNumber,
          totalAmount: savedBooking.totalAmount
        }
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      res.status(500).json({ 
        message: 'Error creating booking',
        error: error.message 
      });
    }
  });

// Confirm payment and update booking status
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('flight')
      .populate('user', 'email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update flight seats
    const flight = await Flight.findById(booking.flight);
    flight.availableSeats[booking.seatClass] -= booking.passengers;
    await flight.save();

    // Update booking status
    booking.paymentStatus = 'completed';
    booking.paymentMethod = paymentMethod;
    booking.paymentDate = new Date();
    await booking.save();

    // Send confirmation email
    try {
      await sendTicketEmail(booking);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the transaction if email fails
    }

    res.json({
      message: 'Payment confirmed',
      ticketNumber: booking.ticketNumber
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// Email ticket
router.post('/:id/email', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'email')
      .populate('flight');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await sendTicketEmail(booking);
    res.json({ message: 'Ticket sent successfully' });
  } catch (error) {
    console.error('Error sending ticket:', error);
    res.status(500).json({ message: 'Error sending ticket' });
  }
});

// Get user's bookings
router.get('/user/bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('flight')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('flight');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if flight is within 24 hours
    const flightTime = new Date(booking.flight.departureTime);
    const now = new Date();
    const hoursDifference = (flightTime - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({ 
        message: 'Cannot cancel booking within 24 hours of flight' 
      });
    }

    // Return seats to flight
    const flight = await Flight.findById(booking.flight._id);
    flight.availableSeats[booking.seatClass] += booking.passengers;
    await flight.save();

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Error cancelling booking' });
  }
});

module.exports = router;