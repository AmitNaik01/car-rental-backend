// server.js

const express = require('express');
const dotenv = require('dotenv');
const db = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const adminCarsRoutes = require('./routes/adminCars');
const userBookingRoutes = require('./routes/userBooking');

// Load env variables
dotenv.config();

// Initialize app
const app = express();

// ✅ Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Health Check Route
app.get('/', (req, res) => {
  res.send('✅ Car Rental Backend is up and running!');
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminCarsRoutes);
app.use('/api/user', userBookingRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
