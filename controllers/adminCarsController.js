const db = require("../config/db"); // db is already the pool
const path = require("path");

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
    const [[user]] = await db.execute("SELECT * FROM users");

    // 3. Map data to each booking
    const result = bookings.map(booking => {
      const car = cars.find(item => item.id === booking.car_id) || {};
      const image = images.find(item => item.car_id === booking.car_id);
      const user = user.find(u => u.id === booking.user_id);
      const user_name = user ? user.first_name : null;

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
