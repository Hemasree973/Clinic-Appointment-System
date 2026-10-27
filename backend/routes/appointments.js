const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const validateBookingRequest = require('../middleware/validateBooking');
const checkOverlappingBooking = require('../middleware/checkOverlap');

// GET /api/appointments - All appointments roster (supports ?date=, ?status=, ?doctor_id=)
router.get('/', appointmentController.getAllAppointments);

// GET /api/appointments/lookup - Search patient appointments by ?query= (email or phone)
router.get('/lookup', appointmentController.getPatientAppointments);

// POST /api/appointments - Book consultation slot
// Employs validateBookingRequest and checkOverlappingBooking middleware
router.post(
  '/',
  validateBookingRequest,
  checkOverlappingBooking,
  appointmentController.createAppointment
);

// PATCH /api/appointments/:id/cancel - Cancel appointment and release slot
router.patch('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
