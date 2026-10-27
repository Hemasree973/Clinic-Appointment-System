import React from 'react';
import { CheckCircle, Calendar, Clock, MapPin, User, FileText, Printer, ArrowRight } from 'lucide-react';
import { formatReadableDate, formatSlotTime } from '../utils/dateUtils';

const BookingSuccessCard = ({ booking, onReset }) => {
  if (!booking) return null;

  return (
    <div className="glass-panel" style={{ maxWidth: '640px', margin: '0 auto', padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid var(--emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: 'var(--emerald)',
            boxShadow: 'var(--shadow-emerald)'
          }}
        >
          <CheckCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
          Consultation Confirmed!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
          Your appointment has been registered and reserved in the clinic database.
        </p>
      </div>

      {/* Digital Consultation Pass */}
      <div className="consultation-pass">
        <div className="pass-header">
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clinic Consultation Pass
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              MediPulse Health Center
            </div>
          </div>
          <div className="pass-id-chip">
            REF #{booking.appointment_id || booking.id || 'APT-1001'}
          </div>
        </div>

        <div className="pass-grid">
          <div>
            <div className="pass-field-label">Specialist Doctor</div>
            <div className="pass-field-value" style={{ color: '#38bdf8' }}>
              {booking.doctor_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--emerald)' }}>
              {booking.specialty}
            </div>
          </div>

          <div>
            <div className="pass-field-label">Clinic Location</div>
            <div className="pass-field-value">
              {booking.room_number || 'Main Building'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Floor 3 • Check-in Desk
            </div>
          </div>

          <div>
            <div className="pass-field-label">Appointment Date</div>
            <div className="pass-field-value">
              {formatReadableDate(booking.appointment_date)}
            </div>
          </div>

          <div>
            <div className="pass-field-label">Time Slot</div>
            <div className="pass-field-value" style={{ color: '#34d399' }}>
              {formatSlotTime(booking.start_time)} - {formatSlotTime(booking.end_time)}
            </div>
          </div>

          <div>
            <div className="pass-field-label">Patient Name</div>
            <div className="pass-field-value">{booking.patient_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              {booking.patient_phone}
            </div>
          </div>

          <div>
            <div className="pass-field-label">Consultation Fee</div>
            <div className="pass-field-value" style={{ color: '#f59e0b' }}>
              ${parseFloat(booking.consultation_fee || 50).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Pay at Clinic Reception
            </div>
          </div>
        </div>

        {booking.reason_for_visit && (
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
            <div className="pass-field-label">Reason for Visit</div>
            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginTop: '2px' }}>
              {booking.reason_for_visit}
            </div>
          </div>
        )}
      </div>

      {/* Pass Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.print()}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Printer size={16} />
          <span>Print Pass</span>
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onReset}
          style={{ flex: 1.4 }}
        >
          <span>Book Another Slot</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default BookingSuccessCard;
