---
name: "Bug Report"
about: "Report a reproducible defect, booking error, or schedule mismatch"
title: "[BUG] "
labels: ["bug", "triage"]
assignees: ""
---

### Bug Description
A clear and concise description of what the bug is.

### Reproduction Steps
1. Navigate to '...'
2. Select Date: 'YYYY-MM-DD'
3. Select Doctor: 'Dr. ...'
4. Select Slot: 'HH:MM - HH:MM'
5. Submit booking modal with patient data
6. Observe failure / unexpected behavior

### Expected Behavior
A clear and concise description of what you expected to happen (e.g. overlap middleware to throw 409 conflict, or slot to update state to booked).

### Actual Behavior
What actually occurred (e.g. overlapping slot booked, client crash, 500 error).

### Error Log / Screenshots
```text
Paste any terminal, Express middleware, or browser console error logs here
```

### Environment Details
- **Frontend OS & Browser**: [e.g. Windows 11, Chrome 128]
- **Node.js Version**: [e.g. v20.x, v22.x]
- **Database Engine**: [e.g. MySQL 8.0 or In-Memory Relational Engine]
- **API Endpoint**: [e.g. POST /api/appointments or GET /api/doctors/daily-summary]

### Severity
- [ ] Critical (Blocks patient consultation booking)
- [ ] Major (Overlap check failure or schedule inconsistency)
- [ ] Minor (UI alignment or cosmetic issue)
