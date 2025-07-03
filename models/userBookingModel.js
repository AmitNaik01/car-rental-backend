// models/userBookingModel.js
const db = require('../config/db');

exports.create = async ({
  user_id,
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
}) => {
  const [result] = await db.execute(
    `INSERT INTO bookings (
      user_id,
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
      payment_status,
      pickup_location,
      return_location
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      user_id,
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
    ]
  );

  return { id: result.insertId };
};
