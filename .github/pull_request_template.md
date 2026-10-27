## Pull Request Overview

### Summary of Changes
- 

### Related Issue
Closes #

### Checklist
- [ ] Code follows modern ES6+ standards and modular Express architecture.
- [ ] Overlap check middleware tested for boundary conditions (`start_time < existing.end_time AND end_time > existing.start_time`).
- [ ] MySQL queries and migrations updated in `backend/sql/`.
- [ ] Frontend responsive layout and state-driven slot indicators tested.
- [ ] No regression in daily schedule summary calculations.

### Testing Instructions
1. Run backend: `npm run server`
2. Run frontend: `npm run client`
3. Execute sample booking and verify conflict handling.
