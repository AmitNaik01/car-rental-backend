const db = require('../config/db');
const Booking = require('../models/userBookingModel');

function calculateHours(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60));
}

const previewBooking = async (req, res) => {
  try {
    const { car_id, pickup_date, pickup_time, return_date, return_time, with_driver } = req.body;
    const pickup_datetime = `${pickup_date} ${pickup_time}`;
    const return_datetime = `${return_date} ${return_time}`;

    const [[car]] = await db.execute('SELECT * FROM cars WHERE id = ?', [car_id]);
    const [[car_pricing]] = await db.execute('SELECT * FROM car_pricing WHERE car_id = ?', [car_id]);
    if (!car) return res.status(404).json({ error: 'Car not found' });
    const price_per_hour = car_pricing.price_per_day / 24;

    const total_hours = calculateHours(pickup_datetime, return_datetime);
    const base_cost = total_hours * price_per_hour;
    const driver_fee = with_driver ? total_hours * 4345 : 0;
    // const discount = coupon_code === 'DISCOUNT800' ? 800 : 0;
    const tax = Math.round(0.05 * (base_cost + driver_fee ));
    const total_amount = base_cost + driver_fee  + tax;

    res.json({
      car_name: car.name,
      car_image: car.front_image,
      registration_number: car.registration_number,
      total_hours,
      rate_per_hour: price_per_hour,
      base: base_cost,
      driver_fee,
      // discount,
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
    const { car_id, pickup_date, pickup_time, return_date, return_time, with_driver, discount } = req.body;
    const pickup_datetime = `${pickup_date} ${pickup_time}`;
    const return_datetime = `${return_date} ${return_time}`;

    const [[car]] = await db.execute('SELECT * FROM cars WHERE id = ?', [car_id]);
    const [[car_pricing]] = await db.execute('SELECT * FROM car_pricing WHERE car_id = ?', [car_id]);
if (!car_pricing) return res.status(404).json({ error: 'Car pricing not found' });

    if (!car) return res.status(404).json({ error: 'Car not found' });
    const price_per_hour = car_pricing.price_per_day / 24;

    const total_hours = calculateHours(pickup_datetime, return_datetime);
    const base_cost = total_hours * price_per_hour;
    const driver_fee = with_driver ? total_hours * 4345 : 0;
    
    const tax = Math.round(0.05 * (base_cost + driver_fee - discount));
    const total_amount = base_cost + driver_fee - discount + tax;
    const coupon_code = 'Demo';
    const pickup_location = "Pickup";
    const return_location = "Return";


    const booking  = await Booking.create({
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
      total_amount,
      pickup_location,
      return_location
    });

     res.json({
      booking_id:booking.id,
      user_id: req.user.id,
      car_id,

      pickup_datetime,
      return_datetime,
      with_driver,
      // coupon_code,
      total_hours,
      base_cost,
      driver_fee,
      discount,
      tax,
      total_amount,
      registration_number: car.registration_number,
      message: 'Successfull'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Booking failed' });
  }
};

const getAllCarsWithDetails = async (req, res) => {
  try {
    const [cars] = await db.execute("SELECT * FROM cars");
    if (!cars.length) return res.json({ success: true, data: [] });

    const [images] = await db.execute("SELECT * FROM car_images");
    const [pricing] = await db.execute("SELECT * FROM car_pricing");
    const [availability] = await db.execute(
      `SELECT car_id, 
              DATE_FORMAT(available_from, '%Y-%m-%d') AS available_from, 
              DATE_FORMAT(available_to, '%Y-%m-%d') AS available_to, 
              available_days 
       FROM car_availability`
    );
    const [documents] = await db.execute("SELECT * FROM car_documents");
    const [features] = await db.execute("SELECT * FROM car_features");
    const [specifications] = await db.execute("SELECT * FROM car_specifications");

    const result = cars.map(car => {
      return {
        car: {
          ...car,
          images: images.find(i => i.car_id === car.id) || {},
          pricing: pricing.find(p => p.car_id === car.id) || {},
          availability: availability.find(a => a.car_id === car.id) || {},
          documents: documents.find(d => d.car_id === car.id) || {},
          features: features.find(f => f.car_id === car.id) || {},
          specifications: specifications.find(s => s.car_id === car.id) || {}
        }
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error fetching all car details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getCarDetails = async (req, res) => {
  const { car_id } = req.params;

  try {
    // 1. Basic Car Info
    const [car] = await db.execute("SELECT * FROM cars WHERE id = ?", [car_id]);
    if (car.length === 0) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // 2. Related Tables
    const [images] = await db.execute(
      "SELECT * FROM car_images WHERE car_id = ?",
      [car_id]
    );

    const [pricing] = await db.execute(
      "SELECT * FROM car_pricing WHERE car_id = ?",
      [car_id]
    );

    const [availability] = await db.execute(
      `SELECT 
        car_id,
        DATE_FORMAT(available_from, '%Y-%m-%d') AS available_from,
        DATE_FORMAT(available_to, '%Y-%m-%d') AS available_to,
        available_days
       FROM car_availability 
       WHERE car_id = ?`,
      [car_id]
    );

    const [documents] = await db.execute(
      "SELECT * FROM car_documents WHERE car_id = ?",
      [car_id]
    );

    const [features] = await db.execute(
      "SELECT * FROM car_features WHERE car_id = ?",
      [car_id]
    );

    const [specifications] = await db.execute(
      "SELECT * FROM car_specifications WHERE car_id = ?",
      [car_id]
    );

    // 3. Build Response
    res.json({
      success: true,
      data: {
        car: {
          id: car[0].id,
          make: car[0].make,
          model: car[0].model,
          color: car[0].color,
          status: car[0].status,
          about: car[0].about,
          registration_number: car[0].registration_number,
          vin: car[0].vin,
          images: {
            front_image: images[0]?.front_image || "",
            rear_image: images[0]?.rear_image || "",
            side_image: images[0]?.side_image || "",
            interior_front_image: images[0]?.interior_front_image || "",
            interior_back_image: images[0]?.interior_back_image || ""
          },
          pricing: {
            price_per_day: pricing[0]?.price_per_day || "0.00",
            security_deposit: pricing[0]?.security_deposit || "0.00"
          },
          features: features[0] || {}, // ⬅️ converted to plain object
          specifications: specifications[0] || {}, // ⬅️ converted to plain object
          availability: {
            available_from: availability[0]?.available_from || "",
            available_to: availability[0]?.available_to || "",
            available_days: availability[0]?.available_days || ""
          },
          location: {
            address: car[0]?.address || "1234 Main St, City",
            map_url: `https://maps.google.com/?q=${encodeURIComponent(car[0]?.address || "1234 Main St, City")}`
          },
          rating: {
            stars: car[0]?.rating || 4.9,
            reviews: car[0]?.reviews || 531
          }
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getUserBookingsWithCars = async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Get bookings by user_id
    const [bookings] = await db.execute(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY pickup_datetime DESC',
      [userId]
    );

    // Step 2: For each booking, fetch car and image manually
    const detailedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [[car]] = await db.execute(
          'SELECT id, registration_number, make, model, color FROM cars WHERE id = ?',
          [booking.car_id]
        );

        const [[image]] = await db.execute(
          'SELECT front_image FROM car_images WHERE car_id = ?',
          [booking.car_id]
        );

        return {
          booking_id: booking.id,
          pickup_datetime: booking.pickup_datetime,
          return_datetime: booking.return_datetime,
          with_driver: booking.with_driver,
          total_hours: booking.total_hours,
          base_cost: booking.base_cost,
          driver_fee: booking.driver_fee,
          tax: booking.tax,
          status:booking.status,
          discount: booking.discount,
          total_amount: booking.total_amount,
          payment_status: booking.payment_status,
          car: car || {},
          car_image: image?.front_image || null
        };
      })
    );

    res.json({ success: true, bookings: detailedBookings });
  } catch (error) {
    console.error('❌ Error fetching user bookings (no joins):', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const [results] = await db.execute(`
      SELECT 
        b.id AS booking_id,
        b.pickup_datetime,
        b.return_datetime,
        b.pickup_location,
        b.return_location,
        b.with_driver,
        b.total_hours,
        b.base_cost,
        b.driver_fee,
        b.tax,
        b.discount,
        b.total_amount,
        b.payment_status,
        c.id AS car_id,
        c.registration_number,
        c.make,
        c.model,
        c.color,
        ci.front_image,
        cs.transmission,
        cs.fuel_type
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      LEFT JOIN car_images ci ON c.id = ci.car_id
      LEFT JOIN car_specifications cs ON c.id = cs.car_id
      WHERE b.user_id = ? AND b.id = ?
    `, [userId, bookingId]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking: results[0] });
  } catch (error) {
    console.error("❌ Error fetching booking by ID:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const modifyBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    // Get new values from request body
    const {
      pickup_date,
      pickup_time,
      return_date,
      return_time,
      with_driver,
      discount,
      pickup_location,
      return_location
    } = req.body;

    const pickup_datetime = `${pickup_date} ${pickup_time}`;
    const return_datetime = `${return_date} ${return_time}`;

    // Fetch booking
    const [[booking]] = await db.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Fetch car pricing
    const [[car_pricing]] = await db.execute('SELECT * FROM car_pricing WHERE car_id = ?', [booking.car_id]);
    if (!car_pricing) return res.status(404).json({ error: 'Car pricing not found' });

    const price_per_hour = car_pricing.price_per_day / 24;
    const total_hours = calculateHours(pickup_datetime, return_datetime);
    const base_cost = total_hours * price_per_hour;
    const driver_fee = with_driver ? total_hours * 4345 : 0;
    const tax = Math.round(0.05 * (base_cost + driver_fee - discount));
    const total_amount = base_cost + driver_fee - discount + tax;
    const coupon_code = 'Demo';

    // Update booking
    await db.execute(
      `UPDATE bookings SET
        pickup_datetime = ?,
        return_datetime = ?,
        with_driver = ?,
        coupon_code = ?,
        total_hours = ?,
        base_cost = ?,
        driver_fee = ?,
        tax = ?,
        discount = ?,
        total_amount = ?,
        pickup_location = ?,
        return_location = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        pickup_datetime,
        return_datetime,
        with_driver,
        coupon_code,
        total_hours,
        base_cost,
        driver_fee,
        tax,
        discount,
        total_amount,
        pickup_location,
        return_location,
        bookingId
      ]
    );

    res.json({
      success: true,
      message: 'Booking modified successfully',
      booking_id: bookingId,
      pickup_datetime,
      return_datetime,
      with_driver,
      total_hours,
      base_cost,
      driver_fee,
      discount,
      tax,
      total_amount,
      pickup_location,
      return_location
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to modify booking' });
  }
};


// Helper
function calculateHours(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.abs(endDate - startDate) / (1000 * 60 * 60);
}


const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Check if booking exists and belongs to user
    const [[booking]] = await db.execute(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'canceled') {
      return res.status(400).json({ success: false, message: 'Booking already canceled' });
    }

    // Update status
    await db.execute(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      ['canceled', bookingId, userId]
    );

    res.json({ success: true, message: 'Booking canceled successfully', booking_id: bookingId });
  } catch (error) {
    console.error('❌ Error canceling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
};



module.exports = {
  getAllCarsWithDetails,
  getCarDetails,
  previewBooking,
  bookCar,
  getUserBookingsWithCars,
  getBookingById,
  modifyBooking,
  cancelBooking
};