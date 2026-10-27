const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// GET /api/doctors/daily-summary - Daily doctor-wise schedule summary (using SQL subqueries & JOINs)
router.get('/daily-summary', doctorController.getDailyScheduleSummary);

// GET /api/doctors - List all doctors with optional ?specialty filter
router.get('/', doctorController.getAllDoctors);

// GET /api/doctors/:id - Specific doctor profile
router.get('/:id', doctorController.getDoctorById);

// GET /api/doctors/:id/schedule?date=YYYY-MM-DD - Generated slots with real-time availability indicator
router.get('/:id/schedule', doctorController.getDoctorSchedule);

module.exports = router;
