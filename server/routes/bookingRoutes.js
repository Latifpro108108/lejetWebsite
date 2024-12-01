const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const auth = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/emailServices');

// Create new booking
router.post('/', auth, async (req, res) => {
    try {
        const { flightId, seatClass, passengers, totalAmount } = req.body;
        
        // Verify flight exists and has enough seats
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: 'Flight not found' });
        }

        if (flight.availableSeats[seatClass] < passengers) {
            return res.status(400).json({ message: 'Not enough seats available' });
        }

        const booking = new Booking({
            user: req.user.id,
            flight: flightId,
            seatClass,
            passengers,
            totalAmount,
            ticketNumber: `LJ${Date.now().toString().slice(-6)}`,
            status: 'pending'
        });

        await booking.save();

        // Populate the saved booking
        const populatedBooking = await Booking.findById(booking._id)
            .populate('user', 'email name')
            .populate({
                path: 'flight',
                populate: {
                    path: 'airplane'
                }
            });

        // Send booking confirmation email
        try {
            await sendBookingConfirmation(populatedBooking);
        } catch (emailError) {
            console.error('Error sending booking confirmation:', emailError);
        }

        res.status(201).json({
            message: 'Booking created successfully',
            booking: populatedBooking
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ 
            message: 'Error creating booking',
            error: error.message 
        });
    }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('user', 'email name')
            .populate({
                path: 'flight',
                populate: {
                    path: 'airplane'
                }
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify ownership
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Error fetching booking details' });
    }
});

// Confirm payment
router.post('/confirm-payment', auth, async (req, res) => {
    try {
        const { bookingId, paymentMethod, paymentDetails } = req.body;

        const booking = await Booking.findById(bookingId)
            .populate('user', 'email name')
            .populate({
                path: 'flight',
                populate: {
                    path: 'airplane'
                }
            });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update booking status
        booking.status = 'confirmed';
        booking.paymentMethod = paymentMethod;
        booking.paymentDetails = paymentDetails;
        booking.paymentDate = new Date();

        await booking.save();

        // Update flight seats
        const flight = await Flight.findById(booking.flight._id);
        flight.availableSeats[booking.seatClass] -= booking.passengers;
        await flight.save();

        res.json({
            message: 'Payment confirmed successfully',
            booking: booking
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ message: 'Error confirming payment' });
    }
});

// Get user's bookings
router.get('/user/bookings', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('user', 'email name')
            .populate({
                path: 'flight',
                populate: {
                    path: 'airplane'
                }
            })
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Error fetching bookings' });
    }
});

module.exports = router;