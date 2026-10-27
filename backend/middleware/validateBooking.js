/**
 * Middleware: validateBookingRequest
 * Validates the syntax, required fields, and temporal validity of the consultation booking request.
 */
function validateBookingRequest(req, res, next) {
  const { doctor_id, appointment_date, start_time, patient_name, email, phone, reason_for_visit } = req.body;
  const errors = [];

  // Required Field Checks
  if (!doctor_id) errors.push('Doctor selection (doctor_id) is required.');
  if (!appointment_date) errors.push('Appointment date is required.');
  if (!start_time) errors.push('Start time slot is required.');
  if (!patient_name || patient_name.trim().length < 2) errors.push('Valid patient name (minimum 2 characters) is required.');
  
  // Email Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  // Phone Validation
  if (!phone || phone.trim().length < 7) {
    errors.push('A valid phone number with area code is required.');
  }

  // Date Check: Prevent booking past dates
  if (appointment_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(appointment_date);
    selectedDate.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      errors.push('Invalid appointment date format (expected YYYY-MM-DD).');
    } else if (selectedDate < today) {
      errors.push('Cannot book appointments for past dates. Please select today or a future date.');
    }
  }

  // Automatically calculate end_time (+30 minutes) if not explicitly passed
  if (start_time && !req.body.end_time) {
    const [hours, minutes] = start_time.split(':').map(Number);
    let endMin = minutes + 30;
    let endHour = hours;
    if (endMin >= 60) {
      endMin -= 60;
      endHour += 1;
    }
    const pad = (n) => String(n).padStart(2, '0');
    req.body.end_time = `${pad(endHour)}:${pad(endMin)}:00`;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed for appointment booking.',
      errors
    });
  }

  next();
}

module.exports = validateBookingRequest;
