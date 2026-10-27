const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (default port 5173) and localhost
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger for API calls
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health & System Info Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Clinic Consultation Slot Booking API',
    timestamp: new Date().toISOString(),
    database: {
      isMySQLActive: db.isMySQLActive(),
      host: db.dbConfig.host,
      database: db.dbConfig.database
    }
  });
});

// Mount Modular Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏥 Clinic Booking Backend running at http://localhost:${PORT}`);
  console.log(`📋 API Docs:`);
  console.log(`   - Doctors:      http://localhost:${PORT}/api/doctors`);
  console.log(`   - Daily Summary:http://localhost:${PORT}/api/doctors/daily-summary`);
  console.log(`   - Appointments: http://localhost:${PORT}/api/appointments`);
  console.log(`====================================================`);
});

module.exports = app;
