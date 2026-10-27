import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { getUpcomingDates, formatReadableDate } from '../utils/dateUtils';

/**
 * Dynamic Date Selection Component
 * Utilizes custom ES6 arrow functions to generate and format selectable consultation dates.
 */
const DateSelector = ({ selectedDate, onSelectDate }) => {
  // Generate next 14 available clinic days using custom ES6 arrow function
  const availableDates = useMemo(() => getUpcomingDates(14), []);

  return (
    <div className="glass-panel section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="step-number">1</span>
          <span>Select Consultation Date</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={16} />
          <span>{formatReadableDate(selectedDate)}</span>
        </div>
      </div>

      <div className="date-selector-wrapper">
        {availableDates.map((d) => {
          const isSelected = d.iso === selectedDate;
          return (
            <div
              key={d.iso}
              className={`date-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDate(d.iso)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectDate(d.iso)}
            >
              <span className="date-day-name">{d.dayName}</span>
              <span className="date-number">{d.dayNumber}</span>
              <span className="date-month-name">{d.monthName}</span>
              {d.isToday && <span className="today-badge">TODAY</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DateSelector;
