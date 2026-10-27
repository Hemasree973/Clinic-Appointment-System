const db = require('../config/db');

/**
 * Middleware: checkOverlappingBooking
 * Enforces the strict business rule that no doctor can be double-booked
 * and no patient can have overlapping appointments during the requested time slot.
 * Overlap formula: (existing.start_time < new.end_time) AND (existing.end_time > new.start_time)
 */
async function checkOverlappingBooking(req, res, next) {
  try {
    const { doctor_id, appointment_date, start_time, end_time, patient_id, email } = req.body;

    if (!doctor_id || !appointment_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing scheduling parameters required for overlap validation (doctor_id, appointment_date, start_time, end_time).'
      });
    }

    // Standardize time format to HH:MM:SS
    const formatTime = (t) => (t.length === 5 ? `${t}:00` : t);
    const reqStart = formatTime(start_time);
    const reqEnd = formatTime(end_time);

    // 1. MySQL Execution Path
    if (db.isMySQLActive()) {
      const pool = db.getPool();

      // Check 1: Doctor Schedule Conflict Query with JOIN
      const [doctorConflicts] = await pool.query(
        `SELECT a.id, a.start_time, a.end_time, d.name AS doctor_name, p.full_name AS patient_name
         FROM appointments a
         INNER JOIN doctors d ON a.doctor_id = d.id
         INNER JOIN patients p ON a.patient_id = p.id
         WHERE a.doctor_id = ?
           AND a.appointment_date = ?
           AND a.status = 'scheduled'
           AND (a.start_time < ? AND a.end_time > ?)
         LIMIT 1`,
        [doctor_id, appointment_date, reqEnd, reqStart]
      );

      if (doctorConflicts.length > 0) {
        const conflict = doctorConflicts[0];
        return res.status(409).json({
          success: false,
          errorType: 'DOCTOR_SLOT_CONFLICT',
          message: `Slot Conflict: ${conflict.doctor_name} is already booked from ${conflict.start_time.slice(0, 5)} to ${conflict.end_time.slice(0, 5)}. Please choose an alternate slot.`,
          conflictingSlot: {
            start: conflict.start_time,
            end: conflict.end_time
          }
        });
      }

      // Check 2: Patient Double-Booking Conflict Query (by patient_id or email)
      const [patientConflicts] = await pool.query(
        `SELECT a.id, a.start_time, a.end_time, d.name AS doctor_name, p.full_name
         FROM appointments a
         INNER JOIN doctors d ON a.doctor_id = d.id
         INNER JOIN patients p ON a.patient_id = p.id
         WHERE (a.patient_id = ? OR p.email = ?)
           AND a.appointment_date = ?
           AND a.status = 'scheduled'
           AND (a.start_time < ? AND a.end_time > ?)
         LIMIT 1`,
        [patient_id || 0, email || '', appointment_date, reqEnd, reqStart]
      );

      if (patientConflicts.length > 0) {
        const conflict = patientConflicts[0];
        return res.status(409).json({
          success: false,
          errorType: 'PATIENT_SCHEDULE_CONFLICT',
          message: `Double-Booking Prevented: The patient (${conflict.full_name}) already has a consultation with ${conflict.doctor_name} at this time (${conflict.start_time.slice(0, 5)} - ${conflict.end_time.slice(0, 5)}).`,
          conflictingSlot: {
            start: conflict.start_time,
            end: conflict.end_time
          }
        });
      }

      return next();
    }

    // 2. In-Memory Relational Fallback Path (Exact interval intersection logic)
    const store = db.inMemoryStore;
    const docIdNum = parseInt(doctor_id, 10);

    const docConflict = store.appointments.find((apt) => {
      if (apt.doctor_id !== docIdNum || apt.appointment_date !== appointment_date || apt.status !== 'scheduled') {
        return false;
      }
      return apt.start_time < reqEnd && apt.end_time > reqStart;
    });

    if (docConflict) {
      const doctor = store.doctors.find((d) => d.id === docIdNum);
      const docName = doctor ? doctor.name : `Doctor #${docIdNum}`;
      return res.status(409).json({
        success: false,
        errorType: 'DOCTOR_SLOT_CONFLICT',
        message: `Slot Conflict: ${docName} is already booked from ${docConflict.start_time.slice(0, 5)} to ${docConflict.end_time.slice(0, 5)}. Please choose an alternate slot.`,
        conflictingSlot: {
          start: docConflict.start_time,
          end: docConflict.end_time
        }
      });
    }

    // Check patient conflict
    let targetPatientId = patient_id ? parseInt(patient_id, 10) : null;
    if (!targetPatientId && email) {
      const existingPatient = store.patients.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (existingPatient) targetPatientId = existingPatient.id;
    }

    if (targetPatientId) {
      const patConflict = store.appointments.find((apt) => {
        if (apt.patient_id !== targetPatientId || apt.appointment_date !== appointment_date || apt.status !== 'scheduled') {
          return false;
        }
        return apt.start_time < reqEnd && apt.end_time > reqStart;
      });

      if (patConflict) {
        const doctor = store.doctors.find((d) => d.id === patConflict.doctor_id);
        const docName = doctor ? doctor.name : 'another specialist';
        return res.status(409).json({
          success: false,
          errorType: 'PATIENT_SCHEDULE_CONFLICT',
          message: `Double-Booking Prevented: You already have a consultation booked with ${docName} at this time (${patConflict.start_time.slice(0, 5)} - ${patConflict.end_time.slice(0, 5)}).`,
          conflictingSlot: {
            start: patConflict.start_time,
            end: patConflict.end_time
          }
        });
      }
    }

    // No overlap found, proceed to controller
    next();
  } catch (error) {
    console.error('[Middleware: checkOverlappingBooking Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while evaluating schedule overlap.',
      error: error.message
    });
  }
}

module.exports = checkOverlappingBooking;
