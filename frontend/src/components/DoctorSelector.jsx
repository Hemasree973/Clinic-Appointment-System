import React, { useState } from 'react';
import { UserCheck, Star, MapPin, Clock, Award } from 'lucide-react';

const DoctorSelector = ({ doctors = [], selectedDoctor, onSelectDoctor, loading }) => {
  const [filterSpecialty, setFilterSpecialty] = useState('ALL');

  const specialties = ['ALL', ...new Set(doctors.map((d) => d.specialty))];

  const filteredDoctors = filterSpecialty === 'ALL'
    ? doctors
    : doctors.filter((d) => d.specialty === filterSpecialty);

  return (
    <div className="glass-panel section-card">
      <div className="section-header">
        <div className="section-title">
          <span className="step-number">2</span>
          <span>Select Specialist Doctor</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {filteredDoctors.length} available
        </span>
      </div>

      {/* Specialty Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
        {specialties.map((spec) => (
          <button
            key={spec}
            type="button"
            onClick={() => setFilterSpecialty(spec)}
            style={{
              background: filterSpecialty === spec ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${filterSpecialty === spec ? 'var(--primary)' : 'var(--border-subtle)'}`,
              color: filterSpecialty === spec ? '#38bdf8' : 'var(--text-muted)',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {spec}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
          Loading specialists...
        </div>
      ) : (
        <div className="doctor-cards-list">
          {filteredDoctors.map((doc) => {
            const isSelected = selectedDoctor && selectedDoctor.id === doc.id;
            return (
              <div
                key={doc.id}
                className={`doctor-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectDoctor(doc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectDoctor(doc)}
              >
                <div className="doc-info-wrap">
                  <img
                    src={doc.avatar_url || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150'}
                    alt={doc.name}
                    className="doc-avatar"
                  />
                  <div>
                    <div className="doc-name">{doc.name}</div>
                    <div className="doc-specialty">{doc.specialty}</div>
                    <div className="doc-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {doc.room_number}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={12} /> {doc.experience_years} yrs exp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="doc-fee-badge">
                  <div className="fee-amount">${parseFloat(doc.consultation_fee).toFixed(0)}</div>
                  <div className="fee-label">Consultation</div>
                  {isSelected && (
                    <span className="badge badge-primary" style={{ marginTop: '4px' }}>
                      Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorSelector;
