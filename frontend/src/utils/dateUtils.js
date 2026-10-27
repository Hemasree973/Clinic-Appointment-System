/**
 * Dynamic Date Utilities using Custom ES6 Arrow Functions
 * Powers dynamic date selection, date arithmetic, and temporal slot filtering
 */

// Custom ES6 arrow function: Format a Date object to YYYY-MM-DD
export const formatDateIso = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

// Custom ES6 arrow function: Generate an array of upcoming sequential dates
export const getUpcomingDates = (count = 14) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const iso = formatDateIso(d);
    dates.push({
      iso,
      dayNumber: d.getDate(),
      dayName: daysOfWeek[d.getDay()],
      monthName: months[d.getMonth()],
      year: d.getFullYear(),
      isToday: i === 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6
    });
  }

  return dates;
};

// Custom ES6 arrow function: Format human-readable date (e.g. "Monday, Oct 27, 2026")
export const formatReadableDate = (isoStr) => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Custom ES6 arrow function: Format time from 24h to 12h AM/PM
export const formatSlotTime = (timeStr) => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 hour is 12 AM
  return `${h}:${m} ${ampm}`;
};

// Custom ES6 arrow function: Test if date is strictly in the past
export const isDatePast = (dateStr) => {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target < today;
};

// Custom ES6 arrow function: Partition slots into Morning, Afternoon, and Evening buckets
export const groupSlotsByPeriod = (slots = []) => {
  const morning = [];
  const afternoon = [];
  const evening = [];

  slots.forEach((slot) => {
    const hour = parseInt(slot.start_time.split(':')[0], 10);
    if (hour < 12) {
      morning.push(slot);
    } else if (hour < 16) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });

  return { morning, afternoon, evening };
};

// Custom ES6 arrow function: Calculate slot availability statistics
export const calculateAvailabilityScore = (slots = []) => {
  if (!slots.length) return { total: 0, available: 0, booked: 0, percentage: 0 };
  const total = slots.length;
  const available = slots.filter((s) => s.is_available).length;
  const booked = total - available;
  const percentage = Math.round((available / total) * 100);
  return { total, available, booked, percentage };
};
