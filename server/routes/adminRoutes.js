const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const Airplane = require('../models/Airplane');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all airplanes
router.get('/airplanes', auth, adminAuth, async (req, res) => {
  try {
    const airplanes = await Airplane.find().sort({ name: 1 });
    res.json(airplanes);
  } catch (error) {
    console.error('Error fetching airplanes:', error);
    res.status(500).json({ message: 'Error fetching airplanes' });
  }
});

// Add new airplane
router.post('/airplanes', auth, adminAuth, async (req, res) => {
  try {
    const { name, capacity, currentLocation } = req.body;
    
    const airplane = new Airplane({
      name,
      capacity: parseInt(capacity),
      currentLocation
    });

    await airplane.save();
    res.status(201).json(airplane);
  } catch (error) {
    console.error('Error adding airplane:', error);
    res.status(500).json({ message: 'Error adding airplane' });
  }
});

// Get all flights
router.get('/flights', auth, adminAuth, async (req, res) => {
  try {
    const flights = await Flight.find()
      .populate('airplane')
      .sort({ departureTime: 1 });
    res.json(flights);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ message: 'Error fetching flights' });
  }
});

// Add new flight
router.post('/flights', auth, adminAuth, async (req, res) => {
  try {
    const {
      airplaneId,
      from,
      to,
      departureDate,
      departureTime,
      arrivalTime,
      economyPrice,
      firstClassPrice,
      isRecurring,
      recurringDays,
      startDate,
      endDate
    } = req.body;

    const airplane = await Airplane.findById(airplaneId);
    if (!airplane) {
      return res.status(404).json({ message: 'Airplane not found' });
    }

    // Calculate available seats based on airplane capacity
    const totalSeats = airplane.capacity;
    const firstClassSeats = Math.floor(totalSeats * 0.2); // 20% for first class
    const economySeats = totalSeats - firstClassSeats;

    if (isRecurring) {
      // Handle recurring flights
      const startDateTime = new Date(`${startDate}T${departureTime}`);
      const endDateTime = new Date(`${endDate}T23:59:59`);
      const arrivalDateTime = new Date(`${startDate}T${arrivalTime}`);
      const flightDuration = arrivalDateTime - startDateTime;

      const flights = [];
      let currentDate = new Date(startDateTime);

      while (currentDate <= endDateTime) {
        const dayOfWeek = currentDate.toLocaleString('en-US', { weekday: 'long' });
        
        if (recurringDays.includes(dayOfWeek)) {
          const flight = new Flight({
            airplane: airplaneId,
            from,
            to,
            departureTime: new Date(currentDate),
            arrivalTime: new Date(currentDate.getTime() + flightDuration),
            economyPrice: parseFloat(economyPrice),
            firstClassPrice: parseFloat(firstClassPrice),
            availableSeats: {
              economy: economySeats,
              firstClass: firstClassSeats
            },
            isRecurring: true,
            recurringDays,
            recurringEndDate: endDateTime
          });

          flights.push(flight);
        }

        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(startDateTime.getHours(), startDateTime.getMinutes());
      }

      await Flight.insertMany(flights);
      res.status(201).json(flights);
    } else {
      // Handle single flight
      const departureDateTime = new Date(`${departureDate}T${departureTime}`);
      const arrivalDateTime = new Date(`${departureDate}T${arrivalTime}`);

      const flight = new Flight({
        airplane: airplaneId,
        from,
        to,
        departureTime: departureDateTime,
        arrivalTime: arrivalDateTime,
        economyPrice: parseFloat(economyPrice),
        firstClassPrice: parseFloat(firstClassPrice),
        availableSeats: {
          economy: economySeats,
          firstClass: firstClassSeats
        }
      });

      await flight.save();
      res.status(201).json(flight);
    }
  } catch (error) {
    console.error('Error adding flight:', error);
    res.status(500).json({ message: 'Error adding flight' });
  }
});

// Update flight status
router.patch('/flights/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const flight = await Flight.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('airplane');

    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json(flight);
  } catch (error) {
    console.error('Error updating flight status:', error);
    res.status(500).json({ message: 'Error updating flight status' });
  }
});

module.exports = router;