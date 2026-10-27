/**
 * API Service Layer: ES6 Async Arrow Functions for Backend Communication
 */

const BASE_URL = 'http://localhost:5000/api';

// Helper for standardized fetch handling
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`[API Network Error on ${endpoint}]:`, error);
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: 'Could not connect to backend server. Ensure backend is running at http://localhost:5000.',
        error: error.message
      }
    };
  }
};

// 1. Fetch active doctors with optional specialty filter
export const fetchDoctors = async (specialty = '') => {
  const query = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
  return await apiRequest(`/doctors${query}`);
};

// 2. Fetch specific doctor details
export const fetchDoctorById = async (id) => {
  return await apiRequest(`/doctors/${id}`);
};

// 3. Fetch doctor slots and live availability for specific date
export const fetchDoctorSchedule = async (doctorId, date) => {
  return await apiRequest(`/doctors/${doctorId}/schedule?date=${encodeURIComponent(date)}`);
};

// 4. Fetch daily doctor-wise schedule summary (MySQL subqueries & JOINs)
export const fetchDailyScheduleSummary = async (date = '') => {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return await apiRequest(`/doctors/daily-summary${query}`);
};

// 5. Book a consultation slot (invokes overlap middleware on backend)
export const bookAppointment = async (bookingPayload) => {
  return await apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(bookingPayload)
  });
};

// 6. Fetch general appointments roster
export const fetchAppointments = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const query = queryParams ? `?${queryParams}` : '';
  return await apiRequest(`/appointments${query}`);
};

// 7. Lookup existing appointments for patient (by email or phone)
export const lookupPatientAppointments = async (searchQuery) => {
  return await apiRequest(`/appointments/lookup?query=${encodeURIComponent(searchQuery)}`);
};

// 8. Cancel appointment to free up slot
export const cancelAppointment = async (appointmentId) => {
  return await apiRequest(`/appointments/${appointmentId}/cancel`, {
    method: 'PATCH'
  });
};

// 9. Server Health Check
export const checkServerHealth = async () => {
  return await apiRequest('/health');
};
