import React from 'react';
import { Stethoscope, Calendar, Database, UserCheck, ShieldCheck } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, isDbConnected }) => {
  return (
    <header className="navbar">
      <div className="nav-content">
        <div className="brand-group">
          <div className="brand-icon">
            <Stethoscope size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">MediPulse Clinic</span>
              <span className="brand-badge">PRO V2.4</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isDbConnected ? '#10b981' : '#f59e0b',
                  display: 'inline-block'
                }}
              />
              {isDbConnected ? 'MySQL Connected' : 'Relational Engine Active'}
            </div>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <Calendar size={16} />
            <span>Book Consultation</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <Database size={16} />
            <span>Doctor Schedule Summary (SQL)</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'my-bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-bookings')}
          >
            <UserCheck size={16} />
            <span>Lookup Bookings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
