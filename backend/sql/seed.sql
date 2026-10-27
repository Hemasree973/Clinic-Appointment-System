-- ==========================================================
-- CLINIC CONSULTATION SLOT BOOKING SYSTEM - SEED DATA
-- ==========================================================

USE clinic_db;

-- 1. Insert Doctors across multiple medical specialties
INSERT INTO doctors (id, name, specialty, department, consultation_fee, experience_years, room_number, shift_start, shift_end, slot_duration_minutes, avatar_url) VALUES
(1, 'Dr. Sarah Mitchell', 'Cardiology', 'Cardiovascular Sciences', 120.00, 14, 'Room 302-A', '09:00:00', '17:00:00', 30, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'),
(2, 'Dr. Marcus Vance', 'Neurology', 'Neuroscience Center', 150.00, 18, 'Room 410-B', '09:00:00', '17:00:00', 30, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'),
(3, 'Dr. Elena Rostova', 'Dermatology', 'Dermatology & Skin Wellness', 95.00, 9, 'Room 105', '09:30:00', '16:30:00', 30, 'https://images.unsplash.com/photo-1594824813511-2b0e6e74ee84?auto=format&fit=crop&q=80&w=300'),
(4, 'Dr. Rajesh Patel', 'Pediatrics', 'Childrens Health Unit', 85.00, 12, 'Room 204', '09:00:00', '17:00:00', 30, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300'),
(5, 'Dr. Maya Lin', 'Orthopedics', 'Musculoskeletal Institute', 130.00, 11, 'Room 315', '10:00:00', '18:00:00', 30, 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300'),
(6, 'Dr. Arthur Pendelton', 'General Medicine', 'Primary Health Care', 75.00, 20, 'Room 101', '08:30:00', '16:30:00', 30, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300');

-- 2. Insert Initial Patients
INSERT INTO patients (id, full_name, email, phone, gender, date_of_birth, medical_history_notes) VALUES
(1, 'Emma Watson', 'emma.watson@example.com', '+1-555-0192', 'Female', '1990-04-15', 'Mild asthma, seasonal pollen allergies.'),
(2, 'James Miller', 'james.miller@example.com', '+1-555-0144', 'Male', '1984-08-22', 'Hypertension stage 1.'),
(3, 'Sophia Chen', 'sophia.chen@example.com', '+1-555-0178', 'Female', '1996-11-03', 'Routine dermatology follow-up.'),
(4, 'David Beckham', 'david.b@example.com', '+1-555-0189', 'Male', '1978-05-02', 'Knee ligament reconstruction follow-up.');

-- 3. Insert Initial Appointments (using CURRENT_DATE for immediate demonstration)
INSERT INTO appointments (doctor_id, patient_id, appointment_date, start_time, end_time, status, reason_for_visit, notes) VALUES
(1, 1, CURDATE(), '09:30:00', '10:00:00', 'scheduled', 'Cardiac stress test evaluation', 'Patient requested morning slot'),
(1, 2, CURDATE(), '11:00:00', '11:30:00', 'scheduled', 'Blood pressure regulation review', 'Bring recent lab reports'),
(2, 3, CURDATE(), '10:00:00', '10:30:00', 'scheduled', 'Migraine and vertigo assessment', 'First consultation with neurologist'),
(3, 4, CURDATE(), '14:00:00', '14:30:00', 'scheduled', 'Eczema flare-up consultation', 'Prescription renewal needed');
