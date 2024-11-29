export const formatTicketNumber = (ticketNumber) => {
    return ticketNumber.replace(/(\w{5})-(\d{6})-(\w{3})/, '$1-$2-$3');
};

export const getTicketStatus = (booking) => {
    const now = new Date();
    const flightDate = new Date(booking.flight.departureTime);
    
    if (booking.status === 'cancelled') return 'Cancelled';
    if (now > flightDate) return 'Completed';
    return 'Active';
};

export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS'
    }).format(price);
};

export const calculateTotalPrice = (flight, seatClass, passengers) => {
    const basePrice = seatClass === 'firstClass' 
        ? flight.firstClassPrice 
        : flight.economyPrice;
    return basePrice * passengers;
};

export const getAvailabilityStatus = (seatsLeft) => {
    if (seatsLeft === 0) return { text: 'Sold Out', color: 'text-red-600' };
    if (seatsLeft <= 5) return { text: 'Almost Full', color: 'text-orange-600' };
    if (seatsLeft <= 10) return { text: 'Filling Up', color: 'text-yellow-600' };
    return { text: 'Available', color: 'text-green-600' };
};