const db = require("../config/db"); // db is already the pool
const path = require("path");
const fs = require('fs');

exports.saveBasicInfo = async (req, res) => {
  const {
    car_id, make, model, year, color, registration_number, vin, about,
    features, specifications
  } = req.body;

  const adminId = req.user.id; // Assuming JWT middleware sets req.user

  try {
    let carIdToUse = car_id;

    if (car_id) {
      // Update car
      await db.execute(
        `UPDATE cars SET make = ?, model = ?, year = ?, color = ?, registration_number = ?, vin = ?, about = ?, updated_at = NOW() WHERE id = ?`,
        [make, model, year, color, registration_number, vin, about, car_id]
      );
    } else {
      // Insert car
      const [result] = await db.execute(
        `INSERT INTO cars (make, model, year, color, registration_number, vin, about, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [make, model, year, color, registration_number, vin, about, adminId]
      );
      carIdToUse = result.insertId;
    }

    // ✅ Save features
    if (features) {
      const [existingFeatures] = await db.execute(
        `SELECT car_id FROM car_features WHERE car_id = ?`, [carIdToUse]
      );

      const featureValues = [
        features.bluetooth || false,
        features.air_conditioning || false,
        features.power_windows || false,
        features.power_steering || false,
        features.keyless_entry || false,
        features.music_system || false,
        features.air_fresher || false,
        features.air_bags || false,
        features.climate_control || false,
        features.stability_control || false,
        features.sunroof || false,
        features.navigation_system || false
      ];

      if (existingFeatures.length > 0) {
        await db.execute(`
          UPDATE car_features SET
          bluetooth = ?, air_conditioning = ?, power_windows = ?, power_steering = ?, keyless_entry = ?,
          music_system = ?, air_fresher = ?, air_bags = ?, climate_control = ?, stability_control = ?,
          sunroof = ?, navigation_system = ?
          WHERE car_id = ?
        `, [...featureValues, carIdToUse]);
      } else {
        await db.execute(`
          INSERT INTO car_features (car_id, bluetooth, air_conditioning, power_windows, power_steering,
            keyless_entry, music_system, air_fresher, air_bags, climate_control, stability_control, sunroof, navigation_system)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [carIdToUse, ...featureValues]);
      }
    }

    // ✅ Save specifications
    if (specifications) {
      const [existingSpecs] = await db.execute(
        `SELECT car_id FROM car_specifications WHERE car_id = ?`, [carIdToUse]
      );

      const specValues = [
        specifications.max_power,
        specifications.fuel_type,
        specifications.fuel_efficiency,
        specifications.engine_displacement,
        specifications.horsepower,
        specifications.torque,
        specifications.max_speed,
        specifications.transmission,
        specifications.drivetrain,
        specifications.length,
        specifications.width,
        specifications.height,
        specifications.wheelbase,
        specifications.ground_clearance
      ];

      if (existingSpecs.length > 0) {
        await db.execute(`
          UPDATE car_specifications SET
          max_power = ?, fuel_type = ?, fuel_efficiency = ?, engine_displacement = ?, horsepower = ?, torque = ?, max_speed = ?,
          transmission = ?, drivetrain = ?, length = ?, width = ?, height = ?, wheelbase = ?, ground_clearance = ?
          WHERE car_id = ?
        `, [...specValues, carIdToUse]);
      } else {
        await db.execute(`
          INSERT INTO car_specifications (car_id, max_power, fuel_type, fuel_efficiency, engine_displacement,
            horsepower, torque, max_speed, transmission, drivetrain, length, width, height, wheelbase, ground_clearance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [carIdToUse, ...specValues]);
      }
    }

    return res.json({
      success: true,
      message: car_id ? "Car updated" : "Car created",
      car_id: carIdToUse
    });
  } catch (error) {
    console.error("❌ Error in saveBasicInfo:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.uploadCarImages = async (req, res) => {
  const { car_id } = req.body;
  const files = req.files;

  try {
    if (!car_id) {
      return res
        .status(400)
        .json({ success: false, message: "car_id is required" });
    }

    // baseURL should match your domain
    const baseURL = `https://car-rental-backend-mtty.onrender.com/uploads/cars`;

    const imageFields = {
      front_image: files.front_image?.[0]?.filename ? `${baseURL}/${files.front_image[0].filename}` : null,
      rear_image: files.rear_image?.[0]?.filename ? `${baseURL}/${files.rear_image[0].filename}` : null,
      side_image: files.side_image?.[0]?.filename ? `${baseURL}/${files.side_image[0].filename}` : null,
      interior_front_image: files.interior_front_image?.[0]?.filename ? `${baseURL}/${files.interior_front_image[0].filename}` : null,
      interior_back_image: files.interior_back_image?.[0]?.filename ? `${baseURL}/${files.interior_back_image[0].filename}` : null,
    };

    // Check if row exists
    const [existingRows] = await db.execute(
      "SELECT car_id FROM car_images WHERE car_id = ?",
      [car_id]
    );

    if (existingRows.length > 0) {
      // Update existing row
      const updateFields = Object.entries(imageFields)
        .filter(([_, value]) => value !== null)
        .map(([key, _]) => `${key} = ?`)
        .join(", ");
      const updateValues = Object.values(imageFields).filter(
        (val) => val !== null
      );

      const sql = `UPDATE car_images SET ${updateFields} WHERE car_id = ?`;
      await db.execute(sql, [...updateValues, car_id]);
    } else {
      // Insert new row
      const sql = `
        INSERT INTO car_images (car_id, front_image, rear_image, side_image, interior_front_image, interior_back_image)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await db.execute(sql, [
        car_id,
        imageFields.front_image,
        imageFields.rear_image,
        imageFields.side_image,
        imageFields.interior_front_image,
        imageFields.interior_back_image,
      ]);
    }

    res.json({ 
      success: true, 
      message: "Images uploaded and saved successfully",
      data: {
        car_id,
        ...imageFields,
      },
    });
  } catch (error) {
    console.error("❌ Error uploading images.", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.saveCarPricing = async (req, res) => {
  const {
    car_id,
    price_per_day,
    security_deposit,
    discount_3_days,
    discount_7_days,
  } = req.body;

  try {
    // Check if pricing already exists for this car
    const [existing] = await db.execute(
      `SELECT car_id FROM car_pricing WHERE car_id = ?`,
      [car_id]
    );

    if (existing.length > 0) {
      // Update existing
      await db.execute(
        `UPDATE car_pricing
         SET price_per_day = ?, security_deposit = ?, discount_3_days = ?, discount_7_days = ?
         WHERE car_id = ?`,
        [
          price_per_day,
          security_deposit,
          discount_3_days,
          discount_7_days,
          car_id,
        ]
      );

      return res.json({ success: true, message: "Car pricing updated" });
    } else {
      // Insert new
      await db.execute(
        `INSERT INTO car_pricing (car_id, price_per_day, security_deposit, discount_3_days, discount_7_days)
         VALUES (?, ?, ?, ?, ?)`,
        [
          car_id,
          price_per_day,
          security_deposit,
          discount_3_days,
          discount_7_days,
        ]
      );

      return res.json({ success: true, message: "Car pricing saved" });
    }
  } catch (error) {
    console.error("❌ Error saving pricing:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.saveCarAvailability = async (req, res) => {
  const { car_id, available_from, available_to, available_days } = req.body;

  try {
    // Check if availability already exists
    const [existing] = await db.execute(
      "SELECT * FROM car_availability WHERE car_id = ?",
      [car_id]
    );

    if (existing.length > 0) {
      // Update
      await db.execute(
        `UPDATE car_availability 
         SET available_from = ?, available_to = ?, available_days = ?
         WHERE car_id = ?`,
        [available_from, available_to, available_days, car_id]
      );

      return res.json({ success: true, message: "Car availability updated" });
    } else {
      // Insert
      await db.execute(
        `INSERT INTO car_availability (car_id, available_from, available_to, available_days)
         VALUES (?, ?, ?, ?)`,
        [car_id, available_from, available_to, available_days]
      );

      return res.json({ success: true, message: "Car availability saved" });
    }
  } catch (error) {
    console.error("❌ Error saving availability:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.uploadDocuments = async (req, res) => {
  const { car_id } = req.body;
  const files = req.files;

  try {
    if (!car_id) {
      return res
        .status(400)
        .json({ success: false, message: "car_id is required" });
    }

    const docFields = {
      registration_certificate:
        files.registration_certificate?.[0]?.filename || null,
      insurance_certificate: files.insurance_certificate?.[0]?.filename || null,
      pollution_certificate: files.pollution_certificate?.[0]?.filename || null,
    };

    const updateFields = Object.entries(docFields).filter(
      ([_, value]) => value !== null
    );

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No documents uploaded" });
    }

    // Check if record already exists
    const [existing] = await db.execute(
      `SELECT * FROM car_documents WHERE car_id = ?`,
      [car_id]
    );

    if (existing.length > 0) {
      // UPDATE existing row
      const setClause = updateFields.map(([key]) => `${key} = ?`).join(", ");
      const values = updateFields.map(([_, value]) => value);
      await db.execute(
        `UPDATE car_documents SET ${setClause} WHERE car_id = ?`,
        [...values, car_id]
      );
    } else {
      // INSERT new row
      const columns = ["car_id", ...updateFields.map(([key]) => key)];
      const placeholders = columns.map(() => "?").join(", ");
      const values = [car_id, ...updateFields.map(([_, value]) => value)];
      await db.execute(
        `INSERT INTO car_documents (${columns.join(
          ", "
        )}) VALUES (${placeholders})`,
        values
      );
    }

    res.json({ success: true, message: "Documents uploaded successfully" });
  } catch (error) {
    console.error("❌ Error uploading documents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.markCarAsComplete = async (req, res) => {
  const { car_id } = req.body;
  const userId = req.user.id; // From verifyToken middleware

  if (!car_id) {
    return res.status(400).json({ success: false, message: 'car_id is required' });
  }

  try {
    // Optional: check if car exists and belongs to this user
    const [cars] = await db.execute(
      'SELECT * FROM cars WHERE id = ? AND created_by = ?',
      [car_id, userId]
    );

    if (cars.length === 0) {
      return res.status(404).json({ success: false, message: 'Car not found or not authorized' });
    }

    await db.execute(
      'UPDATE cars SET status = ?, updated_at = NOW() WHERE id = ? AND created_by = ?',
      ['Available', car_id, userId]
    );

    res.json({ success: true, message: 'Car marked as Available' });
  } catch (error) {
    console.error('❌ Error marking car as complete:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCarDetails = async (req, res) => {
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

exports.getAllCarsWithDetails = async (req, res) => {
  try {
    const adminId = req.user.id; // Logged-in admin's ID

    // 1. Get cars created by this admin
    const [cars] = await db.execute("SELECT * FROM cars WHERE created_by = ?", [adminId]);

    if (cars.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Get all related data
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

    // 3. Map data to each car
    const result = cars.map(car => {
      const carId = car.id;

      return {
        car: {
          ...car,
          images: images.find(item => item.car_id === carId) || {},
          pricing: pricing.find(item => item.car_id === carId) || {},
          availability: availability.find(item => item.car_id === carId) || {},
          documents: documents.find(item => item.car_id === carId) || {},
          features: features.find(item => item.car_id === carId) || {},
          specifications: specifications.find(item => item.car_id === carId) || {}
        }
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error fetching all car details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
/*
exports.getUserBookingsWithCars = async (req, res) => {
  try {
    // const userId = req.user.id;

    // 1. Get all bookings for this user
    const [bookings] = await db.execute(
      'SELECT * FROM bookings ORDER BY pickup_datetime DESC'
    );

    if (bookings.length === 0) {
      return res.json({ success: true, bookings: [] });
    }

    // 2. Get all related cars
    const [cars] = await db.execute("SELECT id, registration_number, make, model, color FROM cars");
    const [images] = await db.execute("SELECT car_id, front_image FROM car_images");
    const [users] = await db.execute("SELECT id, first_name, last_name FROM users");

    // 3. Map data to each booking
    const result = bookings.map(booking => {
      const car = cars.find(item => item.id === booking.car_id) || {};
      const image = images.find(item => item.car_id === booking.car_id);
      const user = users.find(u => u.id === booking.user_id);
      const user_name = user ? `${user.first_name} ${user.last_name}` : null;


      return {
        ...booking,
        car,
        user_name,
        car_image: image?.front_image || null,
      };
    });
    res.json({ success: true, bookings: result });
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

*/
exports.getUserBookingsWithCars = async (req, res) => {
  try {
    const adminId = req.user.id;

    // 1. Get bookings for cars created by this admin
    const [bookings] = await db.execute(
      `SELECT b.* FROM bookings b
       INNER JOIN cars c ON b.car_id = c.id
       WHERE c.created_by = ?
       ORDER BY b.pickup_datetime DESC`,
      [adminId]
    );

    if (bookings.length === 0) {
      return res.json({ success: true, bookings: [] });
    }

    // 2. Get only the cars created by this admin
    const [cars] = await db.execute(
      `SELECT id, registration_number, make, model, color FROM cars WHERE created_by = ?`,
      [adminId]
    );

    // 3. Get all car images
    const [images] = await db.execute("SELECT car_id, front_image FROM car_images");

    // 4. Get all users (who made the bookings)
    const [users] = await db.execute("SELECT id, first_name, last_name FROM users");

    // 5. Attach extra data to each booking
    const result = bookings.map(booking => {
      const car = cars.find(c => c.id === booking.car_id) || {};
      const image = images.find(img => img.car_id === booking.car_id);
      const user = users.find(u => u.id === booking.user_id);
      const user_name = user ? `${user.first_name} ${user.last_name}` : null;

      return {
        ...booking,
        car,
        user_name,
        car_image: image?.front_image || null,
      };
    });

    return res.json({ success: true, bookings: result });

  } catch (error) {
    console.error("❌ Error fetching admin's bookings:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const [results] = await db.execute(
      `SELECT 
        b.*, 
        c.registration_number, c.make, c.model, c.color,
        ci.front_image,
        cs.transmission,
        cs.fuel_type,
        cs.max_power,
        cs.fuel_efficiency,
        cs.torque,
        cs.horsepower
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      LEFT JOIN car_images ci ON c.id = ci.car_id
      LEFT JOIN car_specifications cs ON c.id = cs.car_id
      WHERE b.id = ?`,
      [bookingId]
    );

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking: results[0] });
  } catch (error) {
    console.error("❌ Error fetching booking by ID (admin):", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.modifyBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

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

    // Get booking
    const [[booking]] = await db.execute("SELECT * FROM bookings WHERE id = ?", [bookingId]);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Get car pricing
    const [[pricing]] = await db.execute("SELECT * FROM car_pricing WHERE car_id = ?", [booking.car_id]);
    if (!pricing) return res.status(404).json({ success: false, message: "Car pricing not found" });

    // Calculate costs
    const price_per_hour = pricing.price_per_day / 24;
    const total_hours = calculateHours(pickup_datetime, return_datetime);
    const base_cost = total_hours * price_per_hour;
    const driver_fee = with_driver ? total_hours * 4345 : 0;
    const tax = Math.round(0.05 * (base_cost + driver_fee - discount));
    const total_amount = base_cost + driver_fee - discount + tax;
    const coupon_code = "Demo";

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
      message: "Booking modified successfully",
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
    console.error("❌ Error modifying booking:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Check if booking exists and belongs to user
    const [[booking]] = await db.execute(
      "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
      [bookingId, userId]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "canceled") {
      return res.status(400).json({ success: false, message: "Booking already canceled" });
    }

    // Update status
    await db.execute(
      "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      ["canceled", bookingId, userId]
    );

    res.json({ success: true, message: "Booking canceled successfully", booking_id: bookingId });
  } catch (error) {
    console.error("❌ Error canceling booking:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper function
function calculateHours(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.abs(endDate - startDate) / (1000 * 60 * 60);
}

exports.addDriverDetails = async (req, res) => {
  try {
    const {
      full_name,
      dob,
      address,
      email,
      emergency_contact,
      joining_date,
      rate
    } = req.body;

    // Insert driver details
    const [result] = await db.execute(
      `INSERT INTO driver 
        (full_name, dob, address, email, emergency_contact, joining_date, rate, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [full_name, dob, address, email, emergency_contact, joining_date, rate]
    );

    // Get the inserted driver ID
    const driverId = result.insertId;

    res.json({
      success: true,
      message: "Driver details added successfully",
      driver_id: driverId
    });
  } catch (error) {
    console.error("❌ Error adding driver details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.uploadDriverDocuments = async (req, res) => {
  const { driver_id } = req.body;
  const files = req.files;

  try {
    if (!driver_id) {
      return res
        .status(400)
        .json({ success: false, message: "driver_id is required" });
    }

    const docFields = {
      license: files.license?.[0]?.filename || null,
      pan_card: files.pan_card?.[0]?.filename || null,
      profile_image: files.profile_image?.[0]?.filename || null,
      aadhaar: files.aadhaar?.[0]?.filename || null,
      bank_passbook: files.bank_passbook?.[0]?.filename || null,
    };

    const updateFields = Object.entries(docFields).filter(
      ([_, value]) => value !== null
    );

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No documents uploaded" });
    }

    // Check if record already exists
    const [existing] = await db.execute(
      `SELECT * FROM driver_documents WHERE driver_id = ?`,
      [driver_id]
    );

    if (existing.length > 0) {
      // UPDATE existing row
      const setClause = updateFields.map(([key]) => `${key} = ?`).join(", ");
      const values = updateFields.map(([_, value]) => value);
      await db.execute(
        `UPDATE driver_documents SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE driver_id = ?`,
        [...values, driver_id]
      );
    } else {
      // INSERT new row
      const columns = ["driver_id", ...updateFields.map(([key]) => key)];
      const placeholders = columns.map(() => "?").join(", ");
      const values = [driver_id, ...updateFields.map(([_, value]) => value)];
      await db.execute(
        `INSERT INTO driver_documents (${columns.join(", ")}) VALUES (${placeholders})`,
        values
      );
    }

    res.json({ success: true, message: "Driver documents uploaded successfully" });
  } catch (error) {
    console.error("❌ Error uploading driver documents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getDriverList = async (req, res) => {
  try {
    const [drivers] = await db.execute(
      `SELECT 
        d.id,
        d.full_name,
        d.emergency_contact,
        d.status,
        d.rate,
        d.car_id,
        c.registration_number
      FROM driver d
      LEFT JOIN cars c ON d.car_id = c.id
      ORDER BY d.full_name ASC`
    );

    const driverList = drivers.map(driver => ({
      id: driver.id,
      full_name: driver.full_name,
      phone_number: driver.emergency_contact,
      status: driver.status,
      rate: driver.rate,
      car_number: driver.registration_number || "Not Assigned"
    }));

    res.json({ success: true, drivers: driverList });
  } catch (error) {
    console.error("❌ Error fetching driver list:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getDriverById = async (req, res) => {
  try {
    const driverId = req.params.id;

    // Get driver and car details
const [driverRows] = await db.execute(
  `SELECT 
    d.*,
    c.id AS car_id,
    c.registration_number,
    c.make,
    c.model,
    c.color,
    c.status AS car_status,
    ci.front_image
  FROM driver d
  LEFT JOIN cars c ON d.car_id = c.id
  LEFT JOIN car_images ci ON c.id = ci.car_id
  WHERE d.id = ?`,
  [driverId]
);



    if (driverRows.length === 0) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    const driver = driverRows[0];

    // Get driver documents
    const [docRows] = await db.execute(
      `SELECT license, pan_card, profile_image, aadhaar, bank_passbook
       FROM driver_documents
       WHERE driver_id = ?`,
      [driverId]
    );

    const documents = docRows.length > 0 ? docRows[0] : {};

    const driverDetails = {
      id: driver.id,
      full_name: driver.full_name,
      dob: driver.dob,
      address: driver.address,
      email: driver.email,
      phone_number: driver.emergency_contact,
      joining_date: driver.joining_date,
      rate: driver.rate,
      created_at: driver.created_at,
      status: driver.status,
      trips: driver.trips,
      car_number: driver.registration_number || "Not Assigned",
      car_details: driver.registration_number
        ? {
          id: driver.car_id,
            registration_number: driver.registration_number,
            make: driver.make,
            model: driver.model,
            color: driver.color,
            status: driver.car_status,
            assigned_on: driver.car_assigned_on,
            front_image: driver.front_image
            
          }
        : null,
      documents: {
        license: documents.license || null,
        pan_card: documents.pan_card || null,
        profile_image: documents.profile_image || null,
        aadhaar: documents.aadhaar || null,
        bank_passbook: documents.bank_passbook || null
      }
    };

    res.json({ success: true, driver: driverDetails });
  } catch (error) {
    console.error("❌ Error fetching driver details by ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getAllAssignableCar = async (req, res) => {
  try {
    const adminId = req.user.id; // Logged-in admin's ID

    // 1. Get cars created by this admin
    const [cars] = await db.execute("SELECT * FROM cars WHERE created_by = ?", [adminId]);

    if (cars.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. For each car, you can fetch extra data if needed (example shown)
    const result = await Promise.all(cars.map(async (car) => {
      // Example: Fetch car features (uncomment and adjust if needed)
      // const [features] = await db.execute("SELECT * FROM car_features WHERE car_id = ?", [car.id]);

      return {
        ...car,
        // features, // Uncomment if you fetch
      };
    }));

    // 3. Send response
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error fetching all car details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.assignCarToDriver = async (req, res) => {
  try {
    const { driver_id, car_id } = req.body;

    // Check driver exists
    const [[driver]] = await db.execute("SELECT * FROM driver WHERE id = ?", [driver_id]);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Check car exists
    const [[car]] = await db.execute("SELECT * FROM cars WHERE id = ?", [car_id]);
    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Assign car and set assignment date
    await db.execute(
      "UPDATE driver SET car_id = ?, car_assigned_on = NOW() WHERE id = ?",
      [car_id, driver_id]
    );

    res.json({ success: true, message: "Car assigned to driver successfully" });
  } catch (error) {
    console.error("❌ Error assigning car:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.unassignCarFromDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;

    // 1. Check if driver exists
    const [[driver]] = await db.execute("SELECT * FROM driver WHERE id = ?", [driver_id]);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // 2. Check if a car is currently assigned
    if (!driver.car_id) {
      return res.status(400).json({ success: false, message: "No car is currently assigned to this driver" });
    }

    // 3. Unassign car (set car_id and car_assigned_on to NULL)
    await db.execute(
      "UPDATE driver SET car_id = NULL, car_assigned_on = NULL WHERE id = ?",
      [driver_id]
    );

    res.json({ success: true, message: "Car unassigned from driver successfully" });
  } catch (error) {
    console.error("❌ Error unassigning car:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getLoggedInUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await db.execute(
      `SELECT 
         id,
         first_name,
         last_name,
         email,
         phone,
         profile_image
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        phone: user.phone || null,
        email: user.email,
        profile_image: user.profile_image
          ? `/uploads/profiles/${user.profile_image}`
          : null
      }
    });
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, email } = req.body;
    let newProfileImage = null;

    // ✅ Check if email is already in use by another user
    const [existing] = await db.execute(
      `SELECT id FROM users WHERE email = ? AND id != ?`,
      [email, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already in use by another user."
      });
    }

    // ✅ Handle profile image if provided
    if (req.file && req.file.fieldname === 'profile_image') {
      newProfileImage = req.file.filename;

      // 🔍 Get current image from DB
      const [[user]] = await db.execute(
        'SELECT profile_image FROM users WHERE id = ?',
        [userId]
      );

      if (user?.profile_image) {
        const oldPath = path.join(__dirname, '..', 'uploads', 'profiles', user.profile_image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // 🗑️ Delete old image
        }
      }

      // 📤 Update new profile image
      await db.execute(
        `UPDATE users SET profile_image = ? WHERE id = ?`,
        [newProfileImage, userId]
      );
    }

    // 📱📧 Update phone and email
    await db.execute(
      `UPDATE users SET email = ?, phone = ? WHERE id = ?`,
      [email, phone, userId]
    );

    return res.json({ success: true, message: 'Profile updated successfully' });

  } catch (err) {
    console.error('❌ Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
exports.getBookedUsersForAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get required booking details, including status
    const [rows] = await db.execute(
      `SELECT 
         b.id AS booking_id,
         b.status AS booking_status,
         u.id AS user_id,
         u.first_name,
         u.last_name,
         c.make AS car_make,
         c.model AS car_model
       FROM bookings b
       INNER JOIN cars c ON b.car_id = c.id
       INNER JOIN users u ON b.user_id = u.id
       WHERE c.created_by = ?
       ORDER BY b.pickup_datetime DESC`,
      [adminId]
    );

    // Format results
    const result = rows.map(row => ({
      booking_id: row.booking_id,
      user_id: row.user_id,
      user_name: `${row.first_name} ${row.last_name}`,
      car_make: row.car_make,
      car_model: row.car_model,
      booking_status: row.booking_status
    }));

    return res.json({ success: true, bookings: result });

  } catch (error) {
    console.error("❌ Error fetching booked users:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getBookedUserDetails = async (req, res) => {
  try {
    const { booking_id } = req.params;

    const [rows] = await db.execute(
      `SELECT 
         b.id AS booking_id,
         b.pickup_datetime,
         b.return_datetime,
         b.total_amount,
         b.pickup_location,
         b.return_location,
         
         u.id AS user_id,
         u.first_name AS user_first_name,
         u.last_name AS user_last_name,
         u.email AS user_email,
         u.phone AS user_phone,

         c.registration_number,
         owner.first_name AS owner_first_name,
         owner.last_name AS owner_last_name,
         owner.phone AS owner_phone

       FROM bookings b
       INNER JOIN users u ON b.user_id = u.id
       INNER JOIN cars c ON b.car_id = c.id
       INNER JOIN users owner ON c.created_by = owner.id
       WHERE b.id = ?`,
      [booking_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const row = rows[0];

    const result = {
      booking_id: row.booking_id,
      user_id: row.user_id,
      user_name: `${row.user_first_name} ${row.user_last_name}`,
      email: row.user_email,
      phone: row.user_phone,
      car_registration_number: row.registration_number,
      owner_name: `${row.owner_first_name} ${row.owner_last_name}`,
      owner_phone: row.owner_phone,
      pickup_location: row.pickup_location,
      return_location: row.return_location,
      pickup_datetime: row.pickup_datetime,
      return_datetime: row.return_datetime,
      total_amount: row.total_amount
    };

    return res.json({ success: true, booking_details: result });

  } catch (error) {
    console.error("❌ Error fetching booking details:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all transactions
    const [transactions] = await db.execute(`
      SELECT 
        t.id AS transaction_id,
        t.transaction_date,
        t.amount,
        t.status,
        t.payment_method,
        b.id AS booking_id,
        c.registration_number
      FROM transactions t
      INNER JOIN bookings b ON t.booking_id = b.id
      INNER JOIN cars c ON b.car_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.transaction_date DESC
    `, [userId]);

    // Fetch total bookings and total amount
    const [[summary]] = await db.execute(`
      SELECT 
        COUNT(t.id) AS total_bookings,
        COALESCE(SUM(t.amount), 0) AS total_amount
      FROM transactions t
      WHERE t.user_id = ?
    `, [userId]);

    res.json({
      success: true,
      transactions,
      summary: {
        totalBookings: summary.total_bookings,
        totalAmount: summary.total_amount
      }
    });
  } catch (error) {
    console.error("❌ Error fetching transaction history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCarBookings = async (req, res) => {
  try {
    const { car_id } = req.params;

    const [rows] = await db.execute(`
      SELECT 
        b.id AS booking_id,
        b.pickup_datetime,
        b.return_datetime,
        u.id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.profile_image
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.car_id = ?
      ORDER BY b.pickup_datetime DESC
    `, [car_id]);

    const result = rows.map(row => ({
      booking_id: row.booking_id,
      user_id: row.user_id,
      user_name: row.user_name,
      profile_image: row.profile_image
        ? `https://indianradio.in/car-rental/uploads/profiles/${row.profile_image}`
        : null,
      pickup_datetime: row.pickup_datetime,
      return_datetime: row.return_datetime
    }));

    res.json({ success: true, bookings: result });
  } catch (error) {
    console.error("❌ Error fetching car bookings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCarBookingSummary = async (req, res) => {
  try {
    const adminId = req.user.id; // logged-in admin ID from token

    const [rows] = await db.execute(`
      SELECT 
        c.id AS car_id,
        CONCAT(c.make, ' ', c.model) AS car_name,
        c.registration_number,
        cp.price_per_day,
        ci.front_image,
        COUNT(b.id) AS booking_count
      FROM cars c
      LEFT JOIN car_images ci ON ci.car_id = c.id
      LEFT JOIN car_pricing cp ON cp.car_id = c.id
      LEFT JOIN bookings b ON b.car_id = c.id
      WHERE c.created_by = ?
      GROUP BY c.id
      ORDER BY booking_count DESC
    `, [adminId]);

    const formatted = rows.map(row => ({
      car_id: row.car_id,
      car_name: row.car_name,
      registration_number: row.registration_number,
      price_per_day: `₹${row.price_per_day}/day`,
      front_image: row.front_image || null,
      booking_count: row.booking_count
    }));

    res.json({ success: true, cars: formatted });
  } catch (error) {
    console.error('❌ Error fetching car booking summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
exports.getAdminDashboardData = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get admin name from `users` table
    const [[admin]] = await db.execute(
      `SELECT CONCAT(first_name, ' ', last_name) AS name FROM users WHERE id = ? AND role = 'admin'`,
      [adminId]
    );

    // Total cars listed
    const [[carStats]] = await db.execute(`
      SELECT COUNT(*) AS totalCarsListed FROM cars
    `);

    // Today's bookings count
    const [[bookingStats]] = await db.execute(`
      SELECT COUNT(*) AS todaysBookingCount
      FROM bookings
      WHERE DATE(created_at) = CURDATE()
    `);

    // Current month earnings
    const [[monthStats]] = await db.execute(`
      SELECT COALESCE(SUM(total_amount), 0) AS currentMonthEarnings
      FROM bookings
      WHERE MONTH(created_at) = MONTH(CURDATE())
        AND YEAR(created_at) = YEAR(CURDATE())
    `);

    // Total earnings
    const [[totalStats]] = await db.execute(`
      SELECT COALESCE(SUM(total_amount), 0) AS totalEarnings
      FROM bookings
    `);

    res.json({
      success: true,
      admin: {
        name: admin.name
      },
      stats: {
        totalCarsListed: carStats.totalCarsListed,
        todaysBookingCount: bookingStats.todaysBookingCount,
        currentMonthEarnings: monthStats.currentMonthEarnings,
        totalEarnings: totalStats.totalEarnings
      }
    });

  } catch (error) {
  console.error("❌ Error fetching admin dashboard:", error); // this prints to console
  res.status(500).json({ 
    success: false, 
    message: error.message,  // this will show you the real reason
    stack: error.stack        // (optional) shows where it failed
  });
}

};
