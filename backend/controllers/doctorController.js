const db = require('../config/db');

// Helper to generate full daily slot intervals for a doctor (e.g. 09:00 to 17:00 in 30-min steps)
function generateShiftSlots(shiftStart, shiftEnd, slotMinutes = 30) {
  const slots = [];
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);

  let currentMin = startH * 60 + startM;
  const finishMin = endH * 60 + endM;

  while (currentMin + slotMinutes <= finishMin) {
    const sH = Math.floor(currentMin / 60);
    const sM = currentMin % 60;
    const eMin = currentMin + slotMinutes;
    const eH = Math.floor(eMin / 60);
    const eM = eMin % 60;

    const pad = (n) => String(n).padStart(2, '0');
    slots.push({
      start_time: `${pad(sH)}:${pad(sM)}:00`,
      end_time: `${pad(eH)}:${pad(eM)}:00`,
      display_time: `${pad(sH)}:${pad(sM)} - ${pad(eH)}:${pad(eM)}`
    });

    currentMin += slotMinutes;
  }
  return slots;
}

// 1. Get All Active Doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      let query = 'SELECT * FROM doctors WHERE is_active = TRUE';
      const params = [];
      if (specialty) {
        query += ' AND specialty = ?';
        params.push(specialty);
      }
      query += ' ORDER BY name ASC';
      const [doctors] = await pool.query(query, params);
      return res.json({ success: true, count: doctors.length, data: doctors });
    }

    // In-memory fallback
    let doctors = db.inMemoryStore.doctors.filter((d) => d.is_active);
    if (specialty) {
      doctors = doctors.filter((d) => d.specialty.toLowerCase() === specialty.toLowerCase());
    }
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve doctors list.', error: error.message });
  }
};

// 2. Get Doctor By ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      const [rows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [doctorId]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }
      return res.json({ success: true, data: rows[0] });
    }

    const doctor = db.inMemoryStore.doctors.find((d) => d.id === doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve doctor details.', error: error.message });
  }
};

// 3. Get Doctor Availability & Slots for a Given Date
exports.getDoctorSchedule = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id, 10);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Query parameter "date" (YYYY-MM-DD) is required.' });
    }

    let doctor = null;
    let bookedAppointments = [];

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      const [docRows] = await pool.query('SELECT * FROM doctors WHERE id = ?', [doctorId]);
      if (docRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }
      doctor = docRows[0];

      // Fetch booked slots on this date with JOIN to get patient details
      const [aptRows] = await pool.query(
        `SELECT a.id, a.start_time, a.end_time, a.status, p.full_name AS patient_name
         FROM appointments a
         INNER JOIN patients p ON a.patient_id = p.id
         WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.status = 'scheduled'
         ORDER BY a.start_time ASC`,
        [doctorId, date]
      );
      bookedAppointments = aptRows;
    } else {
      doctor = db.inMemoryStore.doctors.find((d) => d.id === doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found.' });
      }
      bookedAppointments = db.inMemoryStore.appointments
        .filter((a) => a.doctor_id === doctorId && a.appointment_date === date && a.status === 'scheduled')
        .map((a) => {
          const pat = db.inMemoryStore.patients.find((p) => p.id === a.patient_id);
          return {
            id: a.id,
            start_time: a.start_time,
            end_time: a.end_time,
            status: a.status,
            patient_name: pat ? pat.full_name : 'Patient'
          };
        });
    }

    // Generate all intervals for this doctor's working shift
    const allSlots = generateShiftSlots(doctor.shift_start, doctor.shift_end, doctor.slot_duration_minutes || 30);

    // Compute availability status for each slot
    const slotsWithStatus = allSlots.map((slot) => {
      const matchedBooking = bookedAppointments.find((b) => {
        // Compare HH:MM or HH:MM:SS
        const bStart = b.start_time.slice(0, 5);
        const sStart = slot.start_time.slice(0, 5);
        return bStart === sStart;
      });

      return {
        ...slot,
        is_available: !matchedBooking,
        status: matchedBooking ? 'booked' : 'available',
        appointment_id: matchedBooking ? matchedBooking.id : null,
        patient_name: matchedBooking ? matchedBooking.patient_name : null
      };
    });

    const totalSlots = slotsWithStatus.length;
    const bookedCount = slotsWithStatus.filter((s) => !s.is_available).length;
    const availableCount = totalSlots - bookedCount;

    res.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        room_number: doctor.room_number,
        consultation_fee: doctor.consultation_fee
      },
      date,
      summary: {
        total_slots: totalSlots,
        booked_slots: bookedCount,
        available_slots: availableCount
      },
      slots: slotsWithStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compute doctor schedule.', error: error.message });
  }
};

// 4. Daily Doctor-Wise Schedule Summary (Utilizing SQL Subqueries and JOIN Operations)
exports.getDailyScheduleSummary = async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    // SQL with JOIN and Subqueries
    const sqlQuery = `
      SELECT 
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.specialty,
        d.room_number,
        d.consultation_fee,
        d.shift_start,
        d.shift_end,
        (
          SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)
        ) AS total_daily_capacity,
        COUNT(CASE WHEN a.status = 'scheduled' THEN a.id END) AS booked_slots_count,
        (
          (SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)) - 
          (
            SELECT COUNT(*) 
            FROM appointments a_sub 
            WHERE a_sub.doctor_id = d.id 
              AND a_sub.appointment_date = ? 
              AND a_sub.status = 'scheduled'
          )
        ) AS remaining_slots_count,
        (
          SELECT COALESCE(SUM(d.consultation_fee), 0.00)
          FROM appointments a_rev
          WHERE a_rev.doctor_id = d.id
            AND a_rev.appointment_date = ?
            AND a_rev.status != 'cancelled'
        ) AS daily_projected_revenue,
        (
          SELECT MIN(a_next.start_time)
          FROM appointments a_next
          WHERE a_next.doctor_id = d.id
            AND a_next.appointment_date = ?
            AND a_next.status = 'scheduled'
        ) AS earliest_booked_time,
        GROUP_CONCAT(
          CONCAT(TIME_FORMAT(a.start_time, '%H:%i'), '-', TIME_FORMAT(a.end_time, '%H:%i'))
          ORDER BY a.start_time SEPARATOR ', '
        ) AS booked_time_slots
      FROM doctors d
      LEFT JOIN appointments a 
        ON d.id = a.doctor_id 
        AND a.appointment_date = ? 
        AND a.status = 'scheduled'
      WHERE d.is_active = TRUE
      GROUP BY 
        d.id, d.name, d.specialty, d.room_number, d.consultation_fee, d.shift_start, d.shift_end, d.slot_duration_minutes
      ORDER BY booked_slots_count DESC, d.name ASC
    `;

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      const [rows] = await pool.query(sqlQuery, [targetDate, targetDate, targetDate, targetDate]);
      return res.json({
        success: true,
        date: targetDate,
        source: 'MySQL (Subqueries & JOINs)',
        summary: rows
      });
    }

    // In-memory relational computation matching the exact subquery + JOIN logic
    const store = db.inMemoryStore;
    const summary = store.doctors.map((d) => {
      const [sH, sM] = d.shift_start.split(':').map(Number);
      const [eH, eM] = d.shift_end.split(':').map(Number);
      const totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
      const capacity = Math.floor(totalMinutes / d.slot_duration_minutes);

      // Booked appointments for this doctor on targetDate (mimicking LEFT JOIN a ON ...)
      const doctorAppointments = store.appointments.filter(
        (a) => a.doctor_id === d.id && a.appointment_date === targetDate && a.status === 'scheduled'
      );

      const bookedCount = doctorAppointments.length;
      const remainingCount = Math.max(0, capacity - bookedCount);
      const revenue = bookedCount * d.consultation_fee;

      const earliestTime = doctorAppointments.length > 0 
        ? doctorAppointments.map((a) => a.start_time).sort()[0] 
        : null;

      const bookedSlots = doctorAppointments
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
        .map((a) => `${a.start_time.slice(0, 5)}-${a.end_time.slice(0, 5)}`)
        .join(', ');

      return {
        doctor_id: d.id,
        doctor_name: d.name,
        specialty: d.specialty,
        room_number: d.room_number,
        consultation_fee: d.consultation_fee,
        shift_start: d.shift_start,
        shift_end: d.shift_end,
        total_daily_capacity: capacity,
        booked_slots_count: bookedCount,
        remaining_slots_count: remainingCount,
        daily_projected_revenue: revenue.toFixed(2),
        earliest_booked_time: earliestTime,
        booked_time_slots: bookedSlots || null
      };
    }).sort((a, b) => b.booked_slots_count - a.booked_slots_count);

    res.json({
      success: true,
      date: targetDate,
      source: 'Relational Store (Simulating Subqueries & JOINs)',
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to compute daily schedule summary.', error: error.message });
  }
};
