const db = require('../config/db');
const Booking = require('../models/userBookingModel');

function calculateHours(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60));
}

const previewBooking = async (req, res) => {
  try {
    const { car_id, pickup_date, pickup_time, return_date, return_time, with_driver, coupon_code } = req.body;
    const pickup_datetime = `${pickup_date} ${pickup_time}`;
    const return_datetime = `${return_date} ${return_time}`;

    const [[car]] = await db.execute('SELECT * FROM cars WHERE id = ?', [car_id]);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const total_hours = calculateHours(pickup_datetime, return_datetime);
    const base_cost = total_hours * car.price_per_hour;
    const driver_fee = with_driver ? total_hours * 4345 : 0;
    const discount = coupon_code === 'DISCOUNT800' ? 800 : 0;
    const tax = Math.round(0.05 * (base_cost + driver_fee - discount));
    const total_amount = base_cost + driver_fee - discount + tax;

    res.json({
      car_name: car.name,
      car_number: car.car_number,
      total_hours,
      rate_per_hour: car.price_per_hour,
      base: base_cost,
      driver_fee,
      discount,
      tax,
      total_payable: total_amount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Preview failed' });
  }
};

const bookCar = async (req, res) => {
  try {
    const { car_id, pickup_date, pickup_time, return_date, return_time, with_driver, coupon_code } = req.body;
    const pickup_datetime = `${pickup_date} ${pickup_time}`;
    const return_datetime = `${return_date} ${return_time}`;

    const [[car]] = await db.execute('SELECT * FROM cars WHERE id = ?', [car_id]);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const total_hours = calculateHours(pickup_datetime, return_datetime);
    const base_cost = total_hours * car.price_per_hour;
    const driver_fee = with_driver ? total_hours * 4345 : 0;
    const discount = coupon_code === 'DISCOUNT800' ? 800 : 0;
    const tax = Math.round(0.05 * (base_cost + driver_fee - discount));
    const total_amount = base_cost + driver_fee - discount + tax;

    const booking_id = await Booking.create({
      user_id: req.user.id,
      car_id,
      pickup_datetime,
      return_datetime,
      with_driver,
      coupon_code,
      total_hours,
      base_cost,
      driver_fee,
      tax,
      discount,
      total_amount
    });

    res.json({
      booking_id,
      car_number: car.car_number,
      total_payable: total_amount,
      message: 'Booking created. Proceed to payment.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Booking failed' });
  }
};

// ✅ Export both functions in a single object
module.exports = {
  previewBooking,
  bookCar
};
