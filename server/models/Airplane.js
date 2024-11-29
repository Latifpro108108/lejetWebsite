const mongoose = require('mongoose');

const airplaneSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  capacity: { 
    type: Number, 
    required: true 
  },
  currentLocation: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'maintenance', 'retired'], 
    default: 'active' 
  }
});

module.exports = mongoose.model('Airplane', airplaneSchema);