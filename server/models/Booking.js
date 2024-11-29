const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flight: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  seatClass: { type: String, enum: ['economy', 'firstClass'], required: true },
  bookingDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  ticketNumber: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Booking', bookingSchema);

