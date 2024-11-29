const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airplane: { type: mongoose.Schema.Types.ObjectId, ref: 'Airplane', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  economyPrice: { type: Number, required: true },
  firstClassPrice: { type: Number, required: true },
});

module.exports = mongoose.model('Flight', flightSchema);

