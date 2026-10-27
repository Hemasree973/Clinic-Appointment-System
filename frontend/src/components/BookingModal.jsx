import React, { useState } from 'react';
import { X, Calendar, Clock, User, Mail, Phone, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatReadableDate, formatSlotTime } from '../utils/dateUtils';

const BookingModal = ({
  isOpen,
  onClose,
  doctor,
  selectedDate,
  selectedSlot,
  onSubmitBooking,
  submitting,
  validationAlert
}) => {
  const [formData, setFormData] = useState({
    patient_name: '',
    email: '',
    phone: '',
    gender: 'Female',
    date_of_birth: '',
    reason_for_visit: '',
    notes: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

  if (!isOpen || !doctor || !selectedSlot) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Client-side Validation with Interactive Feedback
    const errors = {};
    if (!formData.patient_name.trim()) {
      errors.patient_name = 'Patient full name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address (e.g. name@example.com).';
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      errors.phone = 'Valid phone number with area code is required.';
    }

    if (!formData.reason_for_visit.trim()) {
      errors.reason_for_visit = 'Please state primary reason for medical visit.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Call submit with validated data
    onSubmitBooking({
      doctor_id: doctor.id,
      appointment_date: selectedDate,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      ...formData
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Confirm Consultation Booking</div>
            <div className="modal-subtitle">
              Slot: {formatReadableDate(selectedDate)} • {formatSlotTime(selectedSlot.start_time)}
            </div>
          </div>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={22} />
          </button>
        </div>

        {/* Doctor & Slot Pill Summary */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.98rem' }}>
              {doctor.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--emerald)' }}>
              {doctor.specialty} • {doctor.room_number}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '1.1rem' }}>
              ${parseFloat(doctor.consultation_fee).toFixed(0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Consultation Fee</div>
          </div>
        </div>

        {/* Interactive Validation Alert Banner (if error from backend or conflict) */}
        {validationAlert && (
          <div
            style={{
              background: validationAlert.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${validationAlert.type === 'error' ? 'var(--rose)' : 'var(--amber)'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: '#ffffff',
              fontSize: '0.86rem'
            }}
          >
            <AlertCircle size={20} color={validationAlert.type === 'error' ? 'var(--rose)' : 'var(--amber)'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>
                {validationAlert.title}
              </strong>
              <span>{validationAlert.message}</span>
            </div>
          </div>
        )}

        {/* Patient Form */}
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="patient_name">
              <span>Patient Full Name *</span>
            </label>
            <input
              id="patient_name"
              type="text"
              name="patient_name"
              placeholder="e.g. John Doe"
              value={formData.patient_name}
              onChange={handleChange}
              className={`form-input ${fieldErrors.patient_name ? 'error' : ''}`}
            />
            {fieldErrors.patient_name && <span className="input-error-hint">{fieldErrors.patient_name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <span>Email Address *</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
              />
              {fieldErrors.email && <span className="input-error-hint">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                <span>Phone Number *</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="+1-555-0100"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
              />
              {fieldErrors.phone && <span className="input-error-hint">{fieldErrors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reason_for_visit">
              <span>Reason for Medical Visit *</span>
            </label>
            <input
              id="reason_for_visit"
              type="text"
              name="reason_for_visit"
              placeholder="e.g. Persistent chest tightness, annual checkup, skin rash"
              value={formData.reason_for_visit}
              onChange={handleChange}
              className={`form-input ${fieldErrors.reason_for_visit ? 'error' : ''}`}
            />
            {fieldErrors.reason_for_visit && <span className="input-error-hint">{fieldErrors.reason_for_visit}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">
              <span>Additional Clinical Notes (Optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Mention allergies, current prescriptions, or previous medical records..."
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span>Validating & Booking...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirm Consultation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
