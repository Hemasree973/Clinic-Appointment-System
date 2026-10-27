import React, { useState, useEffect } from 'react';
import { Database, Calendar, DollarSign, Clock, Users, Code, RefreshCw } from 'lucide-react';
import { fetchDailyScheduleSummary } from '../services/api';
import { formatDateIso, formatReadableDate } from '../utils/dateUtils';

const DoctorScheduleSummary = () => {
  const [selectedDate, setSelectedDate] = useState(formatDateIso(new Date()));
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSql, setShowSql] = useState(false);
  const [dataSource, setDataSource] = useState('');

  const loadSummary = async (date) => {
    setLoading(true);
    const res = await fetchDailyScheduleSummary(date);
    if (res.ok && res.data.success) {
      setSummaryData(res.data.summary || []);
      setDataSource(res.data.source || 'MySQL');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate]);

  const rawSqlQuery = `
-- DAILY DOCTOR-WISE SCHEDULE SUMMARY (JOINs & Subqueries)
SELECT 
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.specialty,
    d.room_number,
    d.consultation_fee,
    d.shift_start,
    d.shift_end,
    -- SUBQUERY 1: Calculate total daily shift slot capacity
    (SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)) AS total_daily_capacity,
    -- AGGREGATE JOIN: Scheduled count for date
    COUNT(CASE WHEN a.status = 'scheduled' THEN a.id END) AS booked_slots_count,
    -- SUBQUERY 2: Remaining slot availability
    ((SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)) - 
     (SELECT COUNT(*) FROM appointments a_sub WHERE a_sub.doctor_id = d.id AND a_sub.appointment_date = '${selectedDate}' AND a_sub.status = 'scheduled')) AS remaining_slots_count,
    -- SUBQUERY 3: Total estimated revenue
    (SELECT COALESCE(SUM(d.consultation_fee), 0.00) FROM appointments a_rev WHERE a_rev.doctor_id = d.id AND a_rev.appointment_date = '${selectedDate}' AND a_rev.status != 'cancelled') AS daily_projected_revenue,
    -- GROUP_CONCAT with JOIN: Active booked intervals
    GROUP_CONCAT(CONCAT(TIME_FORMAT(a.start_time, '%H:%i'), '-', TIME_FORMAT(a.end_time, '%H:%i')) ORDER BY a.start_time SEPARATOR ', ') AS booked_time_slots
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id AND a.appointment_date = '${selectedDate}' AND a.status = 'scheduled'
WHERE d.is_active = TRUE
GROUP BY d.id, d.name, d.specialty, d.room_number, d.consultation_fee, d.shift_start, d.shift_end, d.slot_duration_minutes
ORDER BY booked_slots_count DESC, d.name ASC;`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className="glass-panel section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={24} color="#0ea5e9" />
              <span>Daily Doctor-Wise Schedule Summary</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Relational aggregation driven by SQL Subqueries and multi-table LEFT JOIN operations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.04)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={16} color="var(--primary)" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => loadSummary(selectedDate)}
              title="Refresh schedule summary"
            >
              <RefreshCw size={15} />
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowSql(!showSql)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Code size={16} />
              <span>{showSql ? 'Hide SQL' : 'View SQL Query'}</span>
            </button>
          </div>
        </div>

        {/* SQL Code Drawer */}
        {showSql && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
              Backend Executed MySQL Query (Subqueries + JOINs):
            </div>
            <pre className="sql-query-viewer">{rawSqlQuery}</pre>
          </div>
        )}
      </div>

      {/* Summary Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f1f5f9' }}>
            Schedule Analysis for {formatReadableDate(selectedDate)}
          </div>
          <span className="badge badge-primary">
            Source: {dataSource}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Executing relational schedule summary queries...
          </div>
        ) : summaryData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No doctor records found.
          </div>
        ) : (
          <div className="summary-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Doctor & Specialty</th>
                  <th>Room</th>
                  <th>Shift Hours</th>
                  <th>Total Capacity</th>
                  <th>Booked Slots</th>
                  <th>Remaining Open</th>
                  <th>Est. Daily Revenue</th>
                  <th>Booked Slot Intervals</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row) => (
                  <tr key={row.doctor_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{row.doctor_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--emerald)' }}>{row.specialty}</div>
                    </td>
                    <td>{row.room_number}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {row.shift_start?.slice(0, 5)} - {row.shift_end?.slice(0, 5)}
                    </td>
                    <td style={{ fontWeight: 700 }}>{row.total_daily_capacity} slots</td>
                    <td>
                      <span className={`badge ${row.booked_slots_count > 0 ? 'badge-amber' : 'badge-emerald'}`}>
                        {row.booked_slots_count} booked
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: row.remaining_slots_count > 0 ? 'var(--emerald)' : 'var(--rose)' }}>
                        {row.remaining_slots_count} left
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                        ${parseFloat(row.daily_projected_revenue || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      {row.booked_time_slots ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                          {row.booked_time_slots.split(', ').map((slot, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.72rem',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                          All slots free
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorScheduleSummary;
