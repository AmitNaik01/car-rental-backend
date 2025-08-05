const db = require('../config/db');
const crypto = require('crypto');
const Booking = require('../models/userBookingModel');
const sendNotification = require('../utils/sendNotification');

// Razorpay webhook/verification
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      booking_details
    } = req.body;

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // ✅ Create booking now
    const booking = await Booking.create({
      user_id: req.user.id,
      car_id: booking_details.car_id,
      pickup_datetime: booking_details.pickup_datetime,
      return_datetime: booking_details.return_datetime,
      with_driver: booking_details.with_driver,
      coupon_code: booking_details.coupon_code || 'None',
      total_hours: booking_details.total_hours,
      base_cost: booking_details.base_cost,
      driver_fee: booking_details.driver_fee,
      tax: booking_details.tax,
      discount: booking_details.discount,
      total_amount: booking_details.total_amount,
      pickup_location: booking_details.pickup_location,
      return_location: booking_details.return_location
    });

    // ✅ Save transaction
    await db.execute(
      `INSERT INTO transactions (user_id, booking_id, amount, payment_method, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        booking.id,
        booking_details.total_amount,
        'razorpay',
        'paid'
      ]
    );
    await sendNotification(
  req.user.id,
  "Payment Confirmed",
  "Your booking payment was successfully received.",
  "payment"
);


    res.json({ success: true, message: "Payment verified and booking confirmed", booking_id: booking.id , car_id: booking_details.car_id });

  } catch (error) {
    console.error("❌ Payment Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error during payment verification" });
  }
};

module.exports = { verifyRazorpayPayment };
