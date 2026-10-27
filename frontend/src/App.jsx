import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import InteractiveAlert from './components/InteractiveAlert';
import DateSelector from './components/DateSelector';
import DoctorSelector from './components/DoctorSelector';
import SlotGrid from './components/SlotGrid';
import BookingModal from './components/BookingModal';
import BookingSuccessCard from './components/BookingSuccessCard';
import DoctorScheduleSummary from './components/DoctorScheduleSummary';
import PatientAppointments from './components/PatientAppointments';

import {
  fetchDoctors,
  fetchDoctorSchedule,
  bookAppointment,
  checkServerHealth
} from './services/api';

import { formatDateIso } from './utils/dateUtils';

function App() {
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'summary' | 'my-bookings'
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Scheduling State
  const [selectedDate, setSelectedDate] = useState(() => formatDateIso(new Date()));
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // UI Flow States
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Interactive Alert Notification State
  const [alerts, setAlerts] = useState([]);
  const [modalValidationAlert, setModalValidationAlert] = useState(null);

  // Custom ES6 arrow function to add alerts
  const triggerAlert = useCallback((alertObj) => {
    const id = alertObj.id || Date.now();
    setAlerts((prev) => [...prev, { ...alertObj, id }]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 6000);
  }, []);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // 1. Initial Load: Check Backend Health and Fetch Doctors
  useEffect(() => {
    const initApp = async () => {
      // Health check
      const health = await checkServerHealth();
      if (health.ok && health.data?.database?.isMySQLActive) {
        setIsDbConnected(true);
      } else {
        setIsDbConnected(false);
      }

      // Fetch Doctors
      setLoadingDoctors(true);
      const res = await fetchDoctors();
      if (res.ok && res.data.success) {
        setDoctors(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedDoctor(res.data.data[0]);
        }
      } else {
        triggerAlert({
          type: 'error',
          title: 'Connection Error',
          message: 'Unable to connect to backend server. Make sure node server is started at port 5000.'
        });
      }
      setLoadingDoctors(false);
    };

    initApp();
  }, [triggerAlert]);

  // 2. Fetch Doctor Slots whenever Selected Doctor or Date Changes
  const loadScheduleSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    const res = await fetchDoctorSchedule(selectedDoctor.id, selectedDate);
    if (res.ok && res.data.success) {
      setSlots(res.data.slots || []);
    } else {
      triggerAlert({
        type: 'error',
        title: 'Schedule Fetch Failed',
        message: res.data.message || 'Could not calculate doctor slot availability.'
      });
    }
    setLoadingSlots(false);
  }, [selectedDoctor, selectedDate, triggerAlert]);

  useEffect(() => {
    loadScheduleSlots();
  }, [loadScheduleSlots]);

  // 3. Handle Appointment Booking Submission
  const handleBookingSubmit = async (bookingData) => {
    setSubmittingBooking(true);
    setModalValidationAlert(null);

    const res = await bookAppointment(bookingData);

    if (res.ok && res.data.success) {
      setIsModalOpen(false);
      setConfirmedBooking(res.data.data);
      triggerAlert({
        type: 'success',
        title: 'Booking Confirmed!',
        message: `Consultation confirmed with ${res.data.data.doctor_name}. Consultation pass generated.`
      });
      // Refresh the slots so the newly booked slot becomes immediately unavailable!
      loadScheduleSlots();
    } else {
      // Handle Overlap Conflict from Middleware (409 Conflict) or Validation Error (400)
      if (res.status === 409) {
        setModalValidationAlert({
          type: 'warning',
          title: 'Schedule Overlap Conflict',
          message: res.data.message
        });
        triggerAlert({
          type: 'warning',
          title: 'Booking Conflict Prevented',
          message: res.data.message
        });
      } else {
        setModalValidationAlert({
          type: 'error',
          title: 'Validation Failed',
          message: res.data.message || 'Please check the form inputs.'
        });
        triggerAlert({
          type: 'error',
          title: 'Submission Error',
          message: res.data.message || 'Failed to submit appointment.'
        });
      }
    }

    setSubmittingBooking(false);
  };

  const handleResetFlow = () => {
    setConfirmedBooking(null);
    setSelectedSlot(null);
    loadScheduleSlots();
  };

  return (
    <div>
      {/* Toast Alert System */}
      <InteractiveAlert alerts={alerts} onDismiss={dismissAlert} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDbConnected={isDbConnected}
      />

      <main className="app-container">
        {/* TAB 1: BOOKING WORKFLOW */}
        {activeTab === 'booking' && (
          <div>
            {!confirmedBooking ? (
              <>
                <div className="hero-header">
                  <h1>Book Specialist Consultation</h1>
                  <p className="hero-subtitle">
                    Select a date, browse doctor schedules, and reserve your 30-minute consultation slot in real time with automated overlap prevention.
                  </p>
                </div>

                {/* 1. Dynamic Date Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <DateSelector
                    selectedDate={selectedDate}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                  />
                </div>

                {/* 2 & 3. Doctors & State-Driven Slots Layout */}
                <div className="booking-grid">
                  <DoctorSelector
                    doctors={doctors}
                    selectedDoctor={selectedDoctor}
                    onSelectDoctor={(doc) => {
                      setSelectedDoctor(doc);
                      setSelectedSlot(null);
                    }}
                    loading={loadingDoctors}
                  />

                  <SlotGrid
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(slot) => setSelectedSlot(slot)}
                    loading={loadingSlots}
                    doctorName={selectedDoctor?.name || 'Doctor'}
                    onProceedBooking={() => {
                      setModalValidationAlert(null);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              </>
            ) : (
              <BookingSuccessCard
                booking={confirmedBooking}
                onReset={handleResetFlow}
              />
            )}
          </div>
        )}

        {/* TAB 2: DAILY DOCTOR-WISE SCHEDULE SUMMARY (SQL SUBQUERIES & JOINS) */}
        {activeTab === 'summary' && (
          <div>
            <div className="hero-header">
              <h1>Relational Schedule Analytics</h1>
              <p className="hero-subtitle">
                Inspect daily consultation summaries generated via SQL subqueries and multi-table JOINs across Doctors, Patients, and Appointments.
              </p>
            </div>
            <DoctorScheduleSummary />
          </div>
        )}

        {/* TAB 3: PATIENT APPOINTMENTS LOOKUP */}
        {activeTab === 'my-bookings' && (
          <div>
            <div className="hero-header">
              <h1>Patient Appointment Management</h1>
              <p className="hero-subtitle">
                Lookup scheduled consultations, check room assignments, or cancel your booking to instantly release the slot.
              </p>
            </div>
            <PatientAppointments onAlert={triggerAlert} />
          </div>
        )}
      </main>

      {/* Patient Booking Form Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctor={selectedDoctor}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        onSubmitBooking={handleBookingSubmit}
        submitting={submittingBooking}
        validationAlert={modalValidationAlert}
      />
    </div>
  );
}

export default App;
