const db = require('../config/db');

// 1. Create a New Consultation Appointment
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctor_id,
      appointment_date,
      start_time,
      end_time,
      patient_name,
      email,
      phone,
      gender,
      date_of_birth,
      reason_for_visit,
      notes
    } = req.body;

    const docId = parseInt(doctor_id, 10);

    // 1. MySQL Execution Path
    if (db.isMySQLActive()) {
      const pool = db.getPool();

      // Find or insert patient
      let patientId;
      const [existingPatient] = await pool.query(
        'SELECT id FROM patients WHERE email = ? LIMIT 1',
        [email.trim().toLowerCase()]
      );

      if (existingPatient.length > 0) {
        patientId = existingPatient[0].id;
        // Update contact info if changed
        await pool.query(
          'UPDATE patients SET full_name = ?, phone = ? WHERE id = ?',
          [patient_name.trim(), phone.trim(), patientId]
        );
      } else {
        const [patResult] = await pool.query(
          `INSERT INTO patients (full_name, email, phone, gender, date_of_birth) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            patient_name.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            gender || 'Other',
            date_of_birth || null
          ]
        );
        patientId = patResult.insertId;
      }

      // Insert Appointment
      const [aptResult] = await pool.query(
        `INSERT INTO appointments 
         (doctor_id, patient_id, appointment_date, start_time, end_time, status, reason_for_visit, notes) 
         VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
        [docId, patientId, appointment_date, start_time, end_time, reason_for_visit, notes || '']
      );

      // Fetch newly created appointment with complete JOINs
      const [createdRows] = await pool.query(
        `SELECT 
           a.id AS appointment_id,
           a.appointment_date,
           a.start_time,
           a.end_time,
           a.status,
           a.reason_for_visit,
           a.notes,
           a.created_at,
           d.id AS doctor_id,
           d.name AS doctor_name,
           d.specialty,
           d.room_number,
           d.consultation_fee,
           p.id AS patient_id,
           p.full_name AS patient_name,
           p.email AS patient_email,
           p.phone AS patient_phone
         FROM appointments a
         INNER JOIN doctors d ON a.doctor_id = d.id
         INNER JOIN patients p ON a.patient_id = p.id
         WHERE a.id = ?`,
        [aptResult.insertId]
      );

      return res.status(201).json({
        success: true,
        message: 'Consultation slot successfully confirmed and booked!',
        data: createdRows[0]
      });
    }

    // 2. In-Memory Relational Fallback Path
    const store = db.inMemoryStore;
    const doctor = store.doctors.find((d) => d.id === docId);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Selected doctor not found.' });
    }

    // Find or create patient in store
    let patient = store.patients.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
    if (!patient) {
      patient = {
        id: store.patients.length + 1,
        full_name: patient_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gender: gender || 'Other',
        date_of_birth: date_of_birth || null
      };
      store.patients.push(patient);
    } else {
      patient.full_name = patient_name.trim();
      patient.phone = phone.trim();
    }

    const newAppointment = {
      id: store.appointments.length + 1,
      doctor_id: docId,
      patient_id: patient.id,
      appointment_date,
      start_time,
      end_time,
      status: 'scheduled',
      reason_for_visit,
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    store.appointments.push(newAppointment);

    res.status(201).json({
      success: true,
      message: 'Consultation slot successfully confirmed and booked!',
      data: {
        appointment_id: newAppointment.id,
        appointment_date,
        start_time,
        end_time,
        status: newAppointment.status,
        reason_for_visit,
        notes: newAppointment.notes,
        created_at: newAppointment.created_at,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        specialty: doctor.specialty,
        room_number: doctor.room_number,
        consultation_fee: doctor.consultation_fee,
        patient_id: patient.id,
        patient_name: patient.full_name,
        patient_email: patient.email,
        patient_phone: patient.phone
      }
    });
  } catch (error) {
    console.error('[createAppointment Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to record appointment.', error: error.message });
  }
};

// 2. Get All Appointments (with JOIN operations across doctors and patients)
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, status, doctor_id } = req.query;

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      let query = `
        SELECT 
          a.id AS appointment_id,
          a.appointment_date,
          TIME_FORMAT(a.start_time, '%H:%i') AS start_time,
          TIME_FORMAT(a.end_time, '%H:%i') AS end_time,
          a.status,
          a.reason_for_visit,
          a.created_at,
          d.id AS doctor_id,
          d.name AS doctor_name,
          d.specialty,
          d.room_number,
          d.consultation_fee,
          p.id AS patient_id,
          p.full_name AS patient_name,
          p.email AS patient_email,
          p.phone AS patient_phone
        FROM appointments a
        INNER JOIN doctors d ON a.doctor_id = d.id
        INNER JOIN patients p ON a.patient_id = p.id
        WHERE 1=1
      `;
      const params = [];
      if (date) {
        query += ' AND a.appointment_date = ?';
        params.push(date);
      }
      if (status) {
        query += ' AND a.status = ?';
        params.push(status);
      }
      if (doctor_id) {
        query += ' AND a.doctor_id = ?';
        params.push(doctor_id);
      }
      query += ' ORDER BY a.appointment_date DESC, a.start_time ASC';

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, count: rows.length, data: rows });
    }

    // In-memory relational join
    const store = db.inMemoryStore;
    let list = store.appointments.map((a) => {
      const doctor = store.doctors.find((d) => d.id === a.doctor_id) || {};
      const patient = store.patients.find((p) => p.id === a.patient_id) || {};
      return {
        appointment_id: a.id,
        appointment_date: a.appointment_date,
        start_time: a.start_time.slice(0, 5),
        end_time: a.end_time.slice(0, 5),
        status: a.status,
        reason_for_visit: a.reason_for_visit,
        created_at: a.created_at,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        specialty: doctor.specialty,
        room_number: doctor.room_number,
        consultation_fee: doctor.consultation_fee,
        patient_id: patient.id,
        patient_name: patient.full_name,
        patient_email: patient.email,
        patient_phone: patient.phone
      };
    });

    if (date) list = list.filter((a) => a.appointment_date === date);
    if (status) list = list.filter((a) => a.status === status);
    if (doctor_id) list = list.filter((a) => a.doctor_id === parseInt(doctor_id, 10));

    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve appointments list.', error: error.message });
  }
};

// 3. Search Appointments by Patient Email or Phone
exports.getPatientAppointments = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query parameter (email or phone) is required.' });
    }

    const searchTerm = query.trim().toLowerCase();

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      const [rows] = await pool.query(
        `SELECT 
           a.id AS appointment_id,
           a.appointment_date,
           TIME_FORMAT(a.start_time, '%H:%i') AS start_time,
           TIME_FORMAT(a.end_time, '%H:%i') AS end_time,
           a.status,
           a.reason_for_visit,
           d.name AS doctor_name,
           d.specialty,
           d.room_number,
           d.consultation_fee,
           p.full_name AS patient_name,
           p.email AS patient_email,
           p.phone AS patient_phone
         FROM appointments a
         INNER JOIN doctors d ON a.doctor_id = d.id
         INNER JOIN patients p ON a.patient_id = p.id
         WHERE LOWER(p.email) = ? OR p.phone = ?
         ORDER BY a.appointment_date DESC, a.start_time ASC`,
        [searchTerm, searchTerm]
      );
      return res.json({ success: true, count: rows.length, data: rows });
    }

    const store = db.inMemoryStore;
    const matchedPatients = store.patients.filter(
      (p) => p.email.toLowerCase() === searchTerm || p.phone === searchTerm
    );
    const patIds = matchedPatients.map((p) => p.id);

    const appointments = store.appointments
      .filter((a) => patIds.includes(a.patient_id))
      .map((a) => {
        const doctor = store.doctors.find((d) => d.id === a.doctor_id) || {};
        const patient = store.patients.find((p) => p.id === a.patient_id) || {};
        return {
          appointment_id: a.id,
          appointment_date: a.appointment_date,
          start_time: a.start_time.slice(0, 5),
          end_time: a.end_time.slice(0, 5),
          status: a.status,
          reason_for_visit: a.reason_for_visit,
          doctor_name: doctor.name,
          specialty: doctor.specialty,
          room_number: doctor.room_number,
          consultation_fee: doctor.consultation_fee,
          patient_name: patient.full_name,
          patient_email: patient.email,
          patient_phone: patient.phone
        };
      });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to look up patient appointments.', error: error.message });
  }
};

// 4. Cancel Appointment (Slot freed up immediately)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);

    if (db.isMySQLActive()) {
      const pool = db.getPool();
      const [check] = await pool.query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
      if (check.length === 0) {
        return res.status(404).json({ success: false, message: 'Appointment not found.' });
      }

      await pool.query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [appointmentId]);
      return res.json({
        success: true,
        message: 'Appointment successfully cancelled. The consultation slot has been released and is now available.'
      });
    }

    const store = db.inMemoryStore;
    const apt = store.appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    apt.status = 'cancelled';
    res.json({
      success: true,
      message: 'Appointment successfully cancelled. The consultation slot has been released and is now available.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel appointment.', error: error.message });
  }
};
