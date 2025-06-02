const db = require("../config/db"); // db is already the pool
const path = require("path");

exports.saveBasicInfo = async (req, res) => {
  const {
    car_id, make, model, year, color, registration_number, vin,
    total_km, car_type, engine_capacity, fuel_type,
    mileage, max_power, max_speed, about, ratings,
    features // Pass as an object
  } = req.body;

  const adminId = req.user.id;

  try {
    if (car_id) {
      await db.execute(
        `UPDATE cars SET make = ?, model = ?, year = ?, color = ?, registration_number = ?, vin = ?,
         total_km = ?, car_type = ?, engine_capacity = ?, fuel_type = ?, mileage = ?, 
         max_power = ?, max_speed = ?, about = ?, ratings = ?, updated_at = NOW() WHERE id = ?`,
        [make, model, year, color, registration_number, vin,
         total_km, car_type, engine_capacity, fuel_type, mileage,
         max_power, max_speed, about, ratings, car_id]
      );

      // Update features if provided
      if (features) {
        await db.execute(
          `REPLACE INTO car_features (car_id, bluetooth, air_conditioning, power_windows, power_steering,
            keyless_entry, music_system, air_fresher)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            car_id,
            features.bluetooth || false,
            features.air_conditioning || false,
            features.power_windows || false,
            features.power_steering || false,
            features.keyless_entry || false,
            features.music_system || false,
            features.air_fresher || false,
          ]
        );
      }

      return res.json({ success: true, message: "Car info updated", car_id });
    } else {
      const [result] = await db.execute(
        `INSERT INTO cars (make, model, year, color, registration_number, vin, total_km, car_type, 
         engine_capacity, fuel_type, mileage, max_power, max_speed, about, ratings, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [make, model, year, color, registration_number, vin,
         total_km, car_type, engine_capacity, fuel_type,
         mileage, max_power, max_speed, about, ratings, adminId]
      );

      const newCarId = result.insertId;

      // Insert features if provided
      if (features) {
        await db.execute(
          `INSERT INTO car_features (car_id, bluetooth, air_conditioning, power_windows, power_steering,
            keyless_entry, music_system, air_fresher)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newCarId,
            features.bluetooth || false,
            features.air_conditioning || false,
            features.power_windows || false,
            features.power_steering || false,
            features.keyless_entry || false,
            features.music_system || false,
            features.air_fresher || false,
          ]
        );
      }

      return res.json({
        success: true,
        message: "Car created",
        car_id: newCarId,
      });
    }
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

    const imageFields = {
      front_image: files.front_image?.[0]?.filename || null,
      rear_image: files.rear_image?.[0]?.filename || null,
      side_image: files.side_image?.[0]?.filename || null,
      interior_front_image: files.interior_front_image?.[0]?.filename || null,
      interior_back_image: files.interior_back_image?.[0]?.filename || null,
    };

    // Check if row exists for this car_id in car_images table
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

      const sql = `UPDATE car_images SET ${updateFields}, updated_at = NOW() WHERE car_id = ?`;
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
    });
  } catch (error) {
    console.error("❌ Error uploading images:", error);
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
      ['active', car_id, userId]
    );

    res.json({ success: true, message: 'Car marked as active' });
  } catch (error) {
    console.error('❌ Error marking car as complete:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCarDetails = async (req, res) => {
  const { car_id } = req.params;

  try {
    // 1. Basic Car Info with all extended fields
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

    // 3. Build response
    res.json({
      success: true,
      data: {
        car: car[0],
        images: images[0] || {},
        pricing: pricing[0] || {},
        availability: availability[0] || {},
        documents: documents[0] || {},
        features: features[0] || {},
      },
    });
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
