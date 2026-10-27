import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, ShieldAlert } from 'lucide-react';

const InteractiveAlert = ({ alerts = [], onDismiss }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alert-container">
      {alerts.map((alert) => {
        const { id, type = 'error', title, message, details } = alert;

        return (
          <div key={id} className={`interactive-alert ${type}`}>
            <div className="alert-icon">
              {type === 'error' && <AlertTriangle size={22} />}
              {type === 'warning' && <ShieldAlert size={22} />}
              {type === 'success' && <CheckCircle size={22} />}
              {type === 'info' && <Info size={22} />}
            </div>

            <div className="alert-body">
              <div className="alert-title">{title}</div>
              <div className="alert-desc">{message}</div>
              {details && Array.isArray(details) && details.length > 0 && (
                <ul style={{ marginTop: '6px', paddingLeft: '18px', fontSize: '0.8rem', color: '#fecdd3' }}>
                  {details.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              )}
            </div>

            <button
              className="alert-dismiss-btn"
              onClick={() => onDismiss(id)}
              aria-label="Dismiss alert"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default InteractiveAlert;
