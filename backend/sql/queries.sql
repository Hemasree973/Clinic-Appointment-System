-- ==========================================================
-- CLINIC CONSULTATION SYSTEM - ADVANCED SQL QUERIES
-- Demonstrating SQL Subqueries & JOIN operations
-- ==========================================================

USE clinic_db;

-- ==========================================================
-- QUERY 1: Daily Doctor-Wise Schedule Summary (JOIN + Subqueries)
-- Generates aggregate schedule stats per doctor for a given date
-- Combines LEFT JOIN with scalar subqueries and correlated subqueries
-- ==========================================================
SELECT 
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.specialty,
    d.room_number,
    d.consultation_fee,
    d.shift_start,
    d.shift_end,

    -- SUBQUERY 1: Calculate total available consultation capacity based on shift duration
    (
        SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)
    ) AS total_daily_capacity,

    -- AGGREGATE WITH JOIN: Count active scheduled slots on target date
    COUNT(CASE WHEN a.status = 'scheduled' THEN a.id END) AS booked_slots_count,

    -- SUBQUERY 2: Remaining slot availability (Total Capacity - Active Booked Slots)
    (
        (SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)) - 
        (
            SELECT COUNT(*) 
            FROM appointments a_sub 
            WHERE a_sub.doctor_id = d.id 
              AND a_sub.appointment_date = CURDATE() 
              AND a_sub.status = 'scheduled'
        )
    ) AS remaining_slots_count,

    -- SUBQUERY 3: Total estimated revenue generated for the day
    (
        SELECT COALESCE(SUM(d.consultation_fee), 0.00)
        FROM appointments a_rev
        WHERE a_rev.doctor_id = d.id
          AND a_rev.appointment_date = CURDATE()
          AND a_rev.status != 'cancelled'
    ) AS daily_projected_revenue,

    -- SUBQUERY 4: Next immediate scheduled appointment time for the doctor today
    (
        SELECT MIN(a_next.start_time)
        FROM appointments a_next
        WHERE a_next.doctor_id = d.id
          AND a_next.appointment_date = CURDATE()
          AND a_next.status = 'scheduled'
    ) AS earliest_booked_time,

    -- GROUP_CONCAT with JOIN: Comma-separated booked time slots
    GROUP_CONCAT(
        CONCAT(TIME_FORMAT(a.start_time, '%H:%i'), '-', TIME_FORMAT(a.end_time, '%H:%i'))
        ORDER BY a.start_time SEPARATOR ', '
    ) AS booked_time_slots

FROM doctors d
LEFT JOIN appointments a 
    ON d.id = a.doctor_id 
    AND a.appointment_date = CURDATE() 
    AND a.status = 'scheduled'
WHERE d.is_active = TRUE
GROUP BY 
    d.id, d.name, d.specialty, d.room_number, d.consultation_fee, d.shift_start, d.shift_end, d.slot_duration_minutes
ORDER BY booked_slots_count DESC, d.name ASC;


-- ==========================================================
-- QUERY 2: Overlapping Booking Detection Query (Used in Middleware)
-- Checks if a doctor already has an active conflicting appointment
-- Overlap condition: (existing.start_time < new.end_time) AND (existing.end_time > new.start_time)
-- ==========================================================
SELECT 
    a.id,
    a.doctor_id,
    d.name AS doctor_name,
    a.appointment_date,
    a.start_time,
    a.end_time,
    p.full_name AS conflicting_patient_name
FROM appointments a
INNER JOIN doctors d ON a.doctor_id = d.id
INNER JOIN patients p ON a.patient_id = p.id
WHERE a.doctor_id = 1
  AND a.appointment_date = '2026-10-25'
  AND a.status = 'scheduled'
  AND (a.start_time < '10:00:00' AND a.end_time > '09:30:00');


-- ==========================================================
-- QUERY 3: Patient Double-Booking Prevention Query
-- Checks if the patient already has an appointment with ANY doctor at the overlapping time
-- ==========================================================
SELECT 
    a.id,
    a.patient_id,
    d.name AS booked_doctor_name,
    a.appointment_date,
    a.start_time,
    a.end_time
FROM appointments a
INNER JOIN doctors d ON a.doctor_id = d.id
WHERE a.patient_id = 1
  AND a.appointment_date = '2026-10-25'
  AND a.status = 'scheduled'
  AND (a.start_time < '10:00:00' AND a.end_time > '09:30:00');


-- ==========================================================
-- QUERY 4: Comprehensive Daily Clinic Roster with Patient & Doctor JOINs
-- ==========================================================
SELECT 
    a.id AS appointment_id,
    a.appointment_date,
    TIME_FORMAT(a.start_time, '%H:%i') AS start_time,
    TIME_FORMAT(a.end_time, '%H:%i') AS end_time,
    a.status,
    a.reason_for_visit,
    -- Doctor details via JOIN
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.specialty,
    d.room_number,
    -- Patient details via JOIN
    p.id AS patient_id,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    p.email AS patient_email
FROM appointments a
INNER JOIN doctors d ON a.doctor_id = d.id
INNER JOIN patients p ON a.patient_id = p.id
WHERE a.appointment_date = CURDATE()
ORDER BY a.start_time ASC;
