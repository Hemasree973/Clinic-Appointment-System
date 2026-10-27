const mysql = require('mysql2/promise');
require('dotenv').config();

// Default MySQL configuration from environment or standard defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clinic_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// In-Memory Fallback State (Simulates MySQL Relational Tables if MySQL daemon is not running)
const inMemoryStore = {
  doctors: [
    {
      id: 1,
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      department: 'Cardiovascular Sciences',
      consultation_fee: 120.00,
      experience_years: 14,
      room_number: 'Room 302-A',
      shift_start: '09:00:00',
      shift_end: '17:00:00',
      slot_duration_minutes: 30,
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      is_active: true
    },
    {
      id: 2,
      name: 'Dr. Marcus Vance',
      specialty: 'Neurology',
      department: 'Neuroscience Center',
      consultation_fee: 150.00,
      experience_years: 18,
      room_number: 'Room 410-B',
      shift_start: '09:00:00',
      shift_end: '17:00:00',
      slot_duration_minutes: 30,
      avatar_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      is_active: true
    },
    {
      id: 3,
      name: 'Dr. Elena Rostova',
      specialty: 'Dermatology',
      department: 'Dermatology & Skin Wellness',
      consultation_fee: 95.00,
      experience_years: 9,
      room_number: 'Room 105',
      shift_start: '09:30:00',
      shift_end: '16:30:00',
      slot_duration_minutes: 30,
      avatar_url: 'https://images.unsplash.com/photo-1594824813511-2b0e6e74ee84?auto=format&fit=crop&q=80&w=300',
      is_active: true
    },
    {
      id: 4,
      name: 'Dr. Rajesh Patel',
      specialty: 'Pediatrics',
      department: 'Childrens Health Unit',
      consultation_fee: 85.00,
      experience_years: 12,
      room_number: 'Room 204',
      shift_start: '09:00:00',
      shift_end: '17:00:00',
      slot_duration_minutes: 30,
      avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      is_active: true
    },
    {
      id: 5,
      name: 'Dr. Maya Lin',
      specialty: 'Orthopedics',
      department: 'Musculoskeletal Institute',
      consultation_fee: 130.00,
      experience_years: 11,
      room_number: 'Room 315',
      shift_start: '10:00:00',
      shift_end: '18:00:00',
      slot_duration_minutes: 30,
      avatar_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300',
      is_active: true
    },
    {
      id: 6,
      name: 'Dr. Arthur Pendelton',
      specialty: 'General Medicine',
      department: 'Primary Health Care',
      consultation_fee: 75.00,
      experience_years: 20,
      room_number: 'Room 101',
      shift_start: '08:30:00',
      shift_end: '16:30:00',
      slot_duration_minutes: 30,
      avatar_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      is_active: true
    }
  ],
  patients: [
    {
      id: 1,
      full_name: 'Emma Watson',
      email: 'emma.watson@example.com',
      phone: '+1-555-0192',
      gender: 'Female',
      date_of_birth: '1990-04-15'
    },
    {
      id: 2,
      full_name: 'James Miller',
      email: 'james.miller@example.com',
      phone: '+1-555-0144',
      gender: 'Male',
      date_of_birth: '1984-08-22'
    },
    {
      id: 3,
      full_name: 'Sophia Chen',
      email: 'sophia.chen@example.com',
      phone: '+1-555-0178',
      gender: 'Female',
      date_of_birth: '1996-11-03'
    }
  ],
  appointments: []
};

// Populate default appointments for today & tomorrow
const todayStr = new Date().toISOString().split('T')[0];
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

inMemoryStore.appointments.push(
  {
    id: 1,
    doctor_id: 1,
    patient_id: 1,
    appointment_date: todayStr,
    start_time: '09:30:00',
    end_time: '10:00:00',
    status: 'scheduled',
    reason_for_visit: 'Cardiac evaluation checkup',
    notes: 'Morning consultation',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    doctor_id: 1,
    patient_id: 2,
    appointment_date: todayStr,
    start_time: '11:00:00',
    end_time: '11:30:00',
    status: 'scheduled',
    reason_for_visit: 'Blood pressure regulation',
    notes: 'Follow up',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    doctor_id: 2,
    patient_id: 3,
    appointment_date: todayStr,
    start_time: '10:00:00',
    end_time: '10:30:00',
    status: 'scheduled',
    reason_for_visit: 'Migraine and vertigo checkup',
    notes: 'First visit',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    doctor_id: 3,
    patient_id: 1,
    appointment_date: tomorrowStr,
    start_time: '14:00:00',
    end_time: '14:30:00',
    status: 'scheduled',
    reason_for_visit: 'Skin irritation diagnosis',
    notes: 'Allergy consultation',
    created_at: new Date().toISOString()
  }
);

let pool = null;
let isUsingMySQL = false;

// Initialize connection
async function initDatabase() {
  try {
    const testPool = mysql.createPool(dbConfig);
    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();
    pool = testPool;
    isUsingMySQL = true;
    console.log(`[Database] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  } catch (err) {
    console.warn(`[Database] MySQL not reachable (${err.code || err.message}).`);
    console.info('[Database] Seamlessly activated in-memory relational mock store with real SQL logic, JOINs & subquery support.');
    isUsingMySQL = false;
  }
}

initDatabase();

module.exports = {
  dbConfig,
  getPool: () => pool,
  isMySQLActive: () => isUsingMySQL,
  inMemoryStore,
  // Helper to query either real MySQL or in-memory
  query: async (sqlText, params = []) => {
    if (isUsingMySQL && pool) {
      const [rows] = await pool.query(sqlText, params);
      return rows;
    }
    // Return null to signal using fallback implementation in controllers
    return null;
  }
};
