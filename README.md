<<<<<<< HEAD
# 🏥 MediPulse Clinic - Consultation Slot Booking System

A lightweight, robust, and state-driven clinic consultation booking system engineered for patient self-service, real-time doctor slot availability, and strict schedule conflict prevention.

---

## 🌟 Architecture Overview

```
                                      ┌─────────────────────────────────────────────────────────┐
                                      │              React + Modern JS Frontend                 │
                                      │  - Dynamic Date Picker (Custom ES6 Arrow Functions)     │
                                      │  - State-Driven Slot Indicators (Avail/Booked/Selected) │
                                      │  - Interactive Validation Alerts & Confirmed Pass Card  │
                                      └───────────────────────────┬─────────────────────────────┘
                                                                  │ HTTP (REST JSON)
                                                                  ▼
                                      ┌─────────────────────────────────────────────────────────┐
                                      │               Node.js & Express API                     │
                                      │  ├── /api/doctors (List, Profile, Schedule, Summaries)  │
                                      │  └── /api/appointments (Booking, Lookups, Cancelling)   │
                                      │  Middleware:                                            │
                                      │    1. validateBookingRequest (Syntax & Date Integrity)  │
                                      │    2. checkOverlappingBooking (Strict Conflict Guard)   │
                                      └───────────────────────────┬─────────────────────────────┘
                                                                  │ SQL (mysql2 / pool)
                                                                  ▼
                                      ┌─────────────────────────────────────────────────────────┐
                                      │                    MySQL Database                       │
                                      │  ├── doctors (Specialties, Shift Hours, Rooms, Fees)    │
                                      │  ├── patients (Demographics, Medical Contacts)          │
                                      │  └── appointments (Date, Time Intervals, Status)        │
                                      │  Advanced Queries: Subqueries & Multi-Table JOINs       │
                                      └─────────────────────────────────────────────────────────┘
```

---

## 🎯 Key System Highlights

### 1. Frontend (React & Modern JS)
- **Dynamic Date Selection**: Powered by custom ES6 arrow functions (`getUpcomingDates`, `formatDateIso`, `formatReadableDate`, `groupSlotsByPeriod`) that dynamically generate upcoming consultation days without hardcoding.
- **State-Driven Slot Availability Indicators**: Slots are dynamically color-coded with live status indicators:
  - `Available`: Emerald glow, interactive hover transition, capacity metric count.
  - `Booked`: Muted slate, strike-through text, reserved lock badge.
  - `Selected`: Glowing cyan border, checkmark, active selection state.
- **Interactive Alerts for Form Validation**: Real-time error toasts and inline alert banners providing instant feedback for invalid emails, missing required patient info, or scheduling conflicts.
- **Interactive Digital Consultation Pass**: On booking completion, patients receive a printable clinic pass featuring appointment ID, doctor details, room number, and consultation fee.

### 2. Backend (Node.js & Express)
- **Modular Routing**: Clean separation between doctor-related logic (`/api/doctors`) and booking operations (`/api/appointments`).
- **Overlap Prevention Middleware (`checkOverlappingBooking`)**: Enforces strict interval intersection:
  $$\text{Overlap Condition} \iff (\text{existing.start\_time} < \text{new.end\_time}) \land (\text{existing.end\_time} > \text{new.start\_time})$$
  Rejects double-booking attempts with an HTTP `409 Conflict` and descriptive conflict details before hitting the database.
- **Dual Database Resilience**: Fully supports native MySQL connection pools, while providing an automatic relational fallback store so the application runs seamlessly out-of-the-box in any development environment.

### 3. Database (MySQL Relational Schema & Advanced SQL)
- **Tables**: `doctors`, `patients`, `appointments` with foreign keys, indexes, and constraints.
- **Subqueries & JOIN Operations**:
  - Daily doctor-wise schedule summaries (`GET /api/doctors/daily-summary`) using **LEFT JOIN** across doctors and appointments, paired with **correlated subqueries** to compute total capacity, remaining open slots, and daily projected consultation revenue.
- Comprehensive SQL scripts included in `backend/sql/`:
  - [`schema.sql`](backend/sql/schema.sql): Complete DDL definitions.
  - [`seed.sql`](backend/sql/seed.sql): Production-grade seed data across specialties.
  - [`queries.sql`](backend/sql/queries.sql): Showcase of advanced SQL subqueries and JOIN queries.

### 4. Version Control (Git & GitHub)
- **Issue Tracking**: Templates for reproducible bug reporting (`.github/ISSUE_TEMPLATE/bug_report.md`) and feature proposals (`.github/ISSUE_TEMPLATE/feature_request.md`).
- **Pull Request Template**: Enforcing code reviews and overlap test verification (`.github/pull_request_template.md`).
- **Branch Protection Guide**: Complete production branch protection rules for `main` documented in [`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md).
- **GitHub Actions CI**: Automated workflow testing backend startup and building frontend (`.github/workflows/ci.yml`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MySQL (Optional: app includes seamless relational fallback if MySQL is not running locally)

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```
> The backend will listen at `http://localhost:5000`.

### 2. Start Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
> Open your browser at `http://localhost:5173`.

---

## 🗄️ MySQL Database Setup (Optional)

If running local MySQL server:
1. Log into your MySQL instance:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema and seed scripts:
   ```sql
   SOURCE backend/sql/schema.sql;
   SOURCE backend/sql/seed.sql;
   ```
3. Update `backend/.env` with your credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=clinic_db
   DB_PORT=3306
   ```

---

## 📊 Daily Schedule Summary SQL Query

The daily schedule summary demonstrates multi-table **JOIN** operations alongside multiple **Subqueries**:

```sql
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
    -- AGGREGATE JOIN: Scheduled appointments count on date
    COUNT(CASE WHEN a.status = 'scheduled' THEN a.id END) AS booked_slots_count,
    -- SUBQUERY 2: Remaining slot availability
    ((SELECT FLOOR(TIMESTAMPDIFF(MINUTE, d.shift_start, d.shift_end) / d.slot_duration_minutes)) - 
     (SELECT COUNT(*) FROM appointments a_sub WHERE a_sub.doctor_id = d.id AND a_sub.appointment_date = CURDATE() AND a_sub.status = 'scheduled')) AS remaining_slots_count,
    -- SUBQUERY 3: Total estimated revenue
    (SELECT COALESCE(SUM(d.consultation_fee), 0.00) FROM appointments a_rev WHERE a_rev.doctor_id = d.id AND a_rev.appointment_date = CURDATE() AND a_rev.status != 'cancelled') AS daily_projected_revenue,
    -- GROUP_CONCAT with JOIN: Booked time intervals
    GROUP_CONCAT(CONCAT(TIME_FORMAT(a.start_time, '%H:%i'), '-', TIME_FORMAT(a.end_time, '%H:%i')) ORDER BY a.start_time SEPARATOR ', ') AS booked_time_slots
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id AND a.appointment_date = CURDATE() AND a.status = 'scheduled'
WHERE d.is_active = TRUE
GROUP BY d.id, d.name, d.specialty, d.room_number, d.consultation_fee, d.shift_start, d.shift_end, d.slot_duration_minutes
ORDER BY booked_slots_count DESC, d.name ASC;
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and database connectivity indicator |
| `GET` | `/api/doctors` | List all active doctors (supports `?specialty=` filter) |
| `GET` | `/api/doctors/:id` | Get individual doctor profile |
| `GET` | `/api/doctors/:id/schedule?date=YYYY-MM-DD` | Returns slots with real-time `is_available` states |
| `GET` | `/api/doctors/daily-summary?date=YYYY-MM-DD` | SQL Subqueries & JOIN daily doctor-wise schedule summary |
| `GET` | `/api/appointments` | List all scheduled consultations |
| `GET` | `/api/appointments/lookup?query=emailOrPhone` | Search patient bookings |
| `POST`| `/api/appointments` | Book consultation (Protected by `checkOverlappingBooking` middleware) |
| `PATCH`| `/api/appointments/:id/cancel` | Cancel consultation and immediately release slot |

---

## 🔒 Version Control & Branch Protection

- Branching guidelines and GitHub branch protection rule configuration are detailed in [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md).
- Automated CI pipeline runs tests on PR creation via [.github/workflows/ci.yml](.github/workflows/ci.yml).
=======
# Clinic-Appointment-System
A full-stack web application that enables patients to book doctor appointments based on availability. Built using React.js, Node.js, Express.js, and MySQL, it features dynamic slot selection, appointment validation, overlapping booking prevention, and doctor-wise schedule management.
>>>>>>> ea51b7a4db705aa275862ef7b53cd9325859996f
