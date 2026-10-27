import React, { useMemo } from 'react';
import { Clock, Sun, Sunset, Moon, Check, Lock, Sparkles } from 'lucide-react';
import { formatSlotTime, groupSlotsByPeriod, calculateAvailabilityScore } from '../utils/dateUtils';

/**
 * SlotGrid Component
 * Demonstrates state-driven slot availability indicators (Available, Booked, Selected).
 */
const SlotGrid = ({
  slots = [],
  selectedSlot,
  onSelectSlot,
  loading,
  doctorName,
  onProceedBooking
}) => {
  // Compute partitioned slots and metrics using custom ES6 arrow functions
  const { morning, afternoon, evening } = useMemo(() => groupSlotsByPeriod(slots), [slots]);
  const stats = useMemo(() => calculateAvailabilityScore(slots), [slots]);

  const renderSlotGroup = (groupTitle, icon, groupSlots) => {
    if (!groupSlots || groupSlots.length === 0) return null;

    return (
      <div className="slot-group">
        <div className="slot-group-title">
          {icon}
          <span>{groupTitle}</span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
            ({groupSlots.filter((s) => s.is_available).length} open)
          </span>
        </div>

        <div className="slot-grid-layout">
          {groupSlots.map((slot) => {
            const isBooked = !slot.is_available;
            const isSelected = selectedSlot && selectedSlot.start_time === slot.start_time;

            let buttonClass = 'slot-btn';
            if (isBooked) {
              buttonClass += ' booked';
            } else if (isSelected) {
              buttonClass += ' selected';
            } else {
              buttonClass += ' available';
            }

            return (
              <button
                key={slot.start_time}
                type="button"
                className={buttonClass}
                disabled={isBooked}
                onClick={() => !isBooked && onSelectSlot(slot)}
                title={isBooked ? `Reserved by ${slot.patient_name || 'Patient'}` : 'Click to select consultation slot'}
              >
                <div className="slot-time">
                  {formatSlotTime(slot.start_time)}
                </div>

                <div className="slot-status-text">
                  {isBooked ? (
                    <>
                      <Lock size={11} />
                      <span>Booked</span>
                    </>
                  ) : isSelected ? (
                    <>
                      <Check size={12} />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <span className="stat-indicator indicator-avail" style={{ width: '6px', height: '6px' }} />
                      <span>Available</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="step-number">3</span>
          <span>Available Consultation Slots</span>
        </div>
        {selectedSlot && (
          <span className="badge badge-emerald">
            <Sparkles size={13} /> Slot Selected
          </span>
        )}
      </div>

      {/* State-Driven Availability Indicators Legend & Summary Bar */}
      <div className="availability-stat-bar">
        <div className="stat-pill">
          <span className="stat-indicator indicator-avail" />
          <span>Available: <strong style={{ color: 'var(--emerald)' }}>{stats.available}</strong></span>
        </div>
        <div className="stat-pill">
          <span className="stat-indicator indicator-booked" />
          <span>Booked: <strong style={{ color: '#94a3b8' }}>{stats.booked}</strong></span>
        </div>
        <div className="stat-pill">
          <span className="stat-indicator indicator-selected" />
          <span>Selected: <strong style={{ color: '#38bdf8' }}>{selectedSlot ? '1' : '0'}</strong></span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Calculating real-time doctor availability...
        </div>
      ) : slots.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No working shift schedule defined for this date.
        </div>
      ) : (
        <div className="slots-container">
          {renderSlotGroup('Morning Sessions', <Sun size={15} color="#f59e0b" />, morning)}
          {renderSlotGroup('Afternoon Sessions', <Sunset size={15} color="#0ea5e9" />, afternoon)}
          {renderSlotGroup('Evening Sessions', <Moon size={15} color="#818cf8" />, evening)}

          {/* Action Footer */}
          <div style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              {selectedSlot ? (
                <div style={{ fontSize: '0.86rem', color: '#e2e8f0' }}>
                  Slot confirmed for <strong>{formatSlotTime(selectedSlot.start_time)} - {formatSlotTime(selectedSlot.end_time)}</strong> with {doctorName}
                </div>
              ) : (
                <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                  Please click an available slot above to proceed.
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={!selectedSlot}
              onClick={onProceedBooking}
            >
              <span>Continue to Patient Details</span>
              <Check size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotGrid;
