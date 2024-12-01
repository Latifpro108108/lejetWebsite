const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airplane: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airplane',
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  departureTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        if (!this.isRecurring) {
          return value > new Date();
        }
        return true;
      },
      message: 'Departure time must be in the future'
    }
  },
  arrivalTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.departureTime;
      },
      message: 'Arrival time must be after departure time'
    }
  },
  economyPrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  firstClassPrice: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  availableSeats: {
    economy: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative']
    },
    firstClass: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  recurringEndDate: {
    type: Date
  }
}, {
  timestamps: true
});

flightSchema.index({ airplane: 1, departureTime: 1 });
flightSchema.index({ from: 1, to: 1, departureTime: 1 });
flightSchema.index({ status: 1 });
flightSchema.index({ departureTime: 1, from: 1, to: 1, status: 1 });

module.exports = mongoose.model('Flight', flightSchema);