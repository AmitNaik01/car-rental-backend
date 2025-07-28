const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// ✅ Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static folder for uploads
app.use('/uploads/cars', express.static(path.join(__dirname, 'uploads/cars')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));
app.use('/uploads/drivers', express.static(path.join(__dirname, 'uploads/drivers')));
app.use('/uploads/users', express.static(path.join(__dirname, 'uploads/users')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use('/uploads/others', express.static(path.join(__dirname, 'uploads/others')));

// ✅ Health Check Route
app.get('/', (req, res) => {
  res.send('✅ Car Rental Backend is up and running!');
});

// ✅ Route Imports
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const adminCarsRoutes = require('./routes/adminCars');
const userBookingRoutes = require('./routes/userBooking');
const chatRoutes = require('./routes/chatRoutes'); // ✅ Chat Routes

// ✅ Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', adminCarsRoutes);
app.use('/api/user', userBookingRoutes);
app.use('/api/chat', chatRoutes); // mounted at /api/chat

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
