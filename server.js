// server.js

const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');
//test routes
const testRoutes = require('./routes/testRoutes');


dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/test', testRoutes);
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
