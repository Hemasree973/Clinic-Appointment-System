import React, { useState } from 'react';
import { Search, Calendar, Clock, MapPin, User, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { lookupPatientAppointments, cancelAppointment } from '../services/api';
import { formatReadableDate, formatSlotTime } from '../utils/dateUtils';

const PatientAppointments = ({ onAlert }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      onAlert({
        id: Date.now(),
        type: 'warning',
        title: 'Input Required',
        message: 'Please enter a patient email address or phone number to look up bookings.'
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    const res = await lookupPatientAppointments(searchTerm);
    if (res.ok && res.data.success) {
      setAppointments(res.data.data || []);
      if ((res.data.data || []).length === 0) {
        onAlert({
          id: Date.now(),
          type: 'info',
          title: 'No Bookings Found',
          message: `No consultation slots are currently booked under "${searchTerm}".`
        });
      }
    } else {
      onAlert({
        id: Date.now(),
        type: 'error',
        title: 'Search Failed',
        message: res.data.message || 'Could not query patient records.'
      });
    }
    setLoading(false);
  };

  const handleCancelBooking = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation slot? It will be immediately made available for other patients.')) {
      return;
    }

    setCancellingId(aptId);
    const res = await cancelAppointment(aptId);
    if (res.ok && res.data.success) {
      onAlert({
        id: Date.now(),
        type: 'success',
        title: 'Appointment Cancelled',
        message: 'Your slot has been cancelled and returned to open clinic availability.'
      });
      // Update local state to cancelled
      setAppointments((prev) =>
        prev.map((a) => (a.appointment_id === aptId ? { ...a, status: 'cancelled' } : a))
      );
    } else {
      onAlert({
        id: Date.now(),
        type: 'error',
        title: 'Cancellation Failed',
        message: res.data.message || 'Could not cancel appointment.'
      });
    }
    setCancellingId(null);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search Header */}
      <div className="glass-panel section-card">
        <div className="section-title">
          <User size={22} color="var(--primary)" />
          <span>Patient Consultation Lookup & Self-Service</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Search existing appointment records using your registered email or contact number.
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Enter patient email (e.g. emma.watson@example.com) or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '40px' }}
            />
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span>Searching...</span> : <span>Find Bookings</span>}
          </button>
        </form>
      </div>

      {/* Appointments List */}
      {searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.92rem', color: '#94a3b8', fontWeight: 600 }}>
            {appointments.length} record(s) found
          </div>

          {appointments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No active or past consultation bookings registered for this patient.
            </div>
          ) : (
            appointments.map((apt) => {
              const isCancelled = apt.status === 'cancelled';
              return (
                <div
                  key={apt.appointment_id}
                  className="glass-panel"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    opacity: isCancelled ? 0.6 : 1,
                    borderLeft: `4px solid ${isCancelled ? 'var(--rose)' : 'var(--emerald)'}`
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                        {apt.doctor_name}
                      </span>
                      <span className="badge badge-primary">{apt.specialty}</span>
                      <span className={`badge ${isCancelled ? 'badge-amber' : 'badge-emerald'}`}>
                        {apt.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.84rem', color: '#94a3b8' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--primary)" />
                        {formatReadableDate(apt.appointment_date)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--emerald)" />
                        {formatSlotTime(apt.start_time)} - {formatSlotTime(apt.end_time)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} />
                        {apt.room_number || 'Room 101'}
                      </span>
                    </div>

                    {apt.reason_for_visit && (
                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>
                        <strong>Reason:</strong> {apt.reason_for_visit}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(apt.appointment_id)}
                        disabled={cancellingId === apt.appointment_id}
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          color: 'var(--rose)',
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Trash2 size={14} />
                        <span>{cancellingId === apt.appointment_id ? 'Cancelling...' : 'Cancel Slot'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
