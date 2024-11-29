const express = require('express');
const router = express.Router();
const Airplane = require('../models/Airplane');
const Flight = require('../models/Flight');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.post('/airplanes', auth, adminAuth, async (req, res) => {
  try {
    const { name, capacity, currentLocation } = req.body;
    const airplane = new Airplane({ name, capacity, currentLocation });
    await airplane.save();
    res.status(201).json(airplane);
  } catch (error) {
    res.status(500).json({ message: 'Error adding airplane' });
  }
});

router.get('/airplanes', auth, adminAuth, async (req, res) => {
  try {
    const airplanes = await Airplane.find();
    res.json(airplanes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching airplanes' });
  }
});

router.put('/airplanes/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, currentLocation } = req.body;
    const airplane = await Airplane.findByIdAndUpdate(
      id,
      { name, capacity, currentLocation },
      { new: true }
    );
    if (!airplane) {
      return res.status(404).json({ message: 'Airplane not found' });
    }
    res.json(airplane);
  } catch (error) {
    res.status(500).json({ message: 'Error updating airplane' });
  }
});

router.post('/flights', auth, adminAuth, async (req, res) => {
  try {
    const { airplaneId, from, to, departureTime, arrivalTime, economyPrice, firstClassPrice } = req.body;
    const flight = new Flight({
      airplane: airplaneId,
      from,
      to,
      departureTime,
      arrivalTime,
      economyPrice,
      firstClassPrice,
    });
    await flight.save();
    res.status(201).json(flight);
  } catch (error) {
    res.status(500).json({ message: 'Error adding flight' });
  }
});

router.get('/flights', auth, adminAuth, async (req, res) => {
  try {
    const flights = await Flight.find().populate('airplane');
    res.json(flights);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flights' });
  }
});

module.exports = router;

