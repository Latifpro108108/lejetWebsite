const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

// Search flights
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, passengers, seatClass } = req.query;
    
    // Convert the search date to start and end of the day in UTC
    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log('Search date range:', {
      searchDate,
      endDate
    });

    const flights = await Flight.find({
      from,
      to,
      departureTime: {
        $gte: searchDate,
        $lte: endDate
      },
      status: 'scheduled',
      [`availableSeats.${seatClass}`]: { $gte: parseInt(passengers) }
    }).populate('airplane');

    console.log(`Found ${flights.length} flights for date ${date}`);

    res.json({ flights });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ message: 'Error searching flights' });
  }
});

module.exports = router;