const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function parseDate(value) {
  const match = DATE_PATTERN.exec(value || '');
  if (!match) throw fail('INVALID_DATE', 'Date must use YYYY-MM-DD format.');
  const [, yearText, monthText, dayText] = match;
  const parts = { year: Number(yearText), month: Number(monthText), day: Number(dayText) };
  const calendarDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    calendarDate.getUTCFullYear() !== parts.year
    || calendarDate.getUTCMonth() !== parts.month - 1
    || calendarDate.getUTCDate() !== parts.day
  ) throw fail('INVALID_DATE', 'Date is not a real calendar date.');
  return { ...parts, calendarDate };
}

function parseClock(value) {
  const match = TIME_PATTERN.exec(value || '');
  if (!match) throw fail('INVALID_SCHEDULE', 'Schedule times must use 24-hour HH:mm format.');
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw fail('INVALID_SCHEDULE', 'Schedule contains an invalid time.');
  return hour * 60 + minute;
}

function formatLocalParts(date, timezone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const values = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function localToUtc(dateParts, minuteOfDay, timezone) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const targetAsUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute);
  let guess = targetAsUtc;

  // Iteratively correct the assumed UTC value until it formats as the requested
  // wall-clock time in the salon's timezone. This avoids machine-local timezone use.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = formatLocalParts(new Date(guess), timezone);
    const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute);
    const correction = targetAsUtc - observedAsUtc;
    guess += correction;
    if (correction === 0) break;
  }

  const result = new Date(guess);
  const check = formatLocalParts(result, timezone);
  if (
    check.year !== dateParts.year
    || check.month !== dateParts.month
    || check.day !== dateParts.day
    || check.hour !== hour
    || check.minute !== minute
  ) throw fail('INVALID_LOCAL_TIME', 'This local time does not exist in the salon timezone.');
  return result;
}

function toValidInterval(start, end, description) {
  const startMinute = parseClock(start);
  const endMinute = parseClock(end);
  if (endMinute <= startMinute) throw fail('INVALID_SCHEDULE', `${description} must end after it starts.`);
  return { startMinute, endMinute };
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export function hasCompleteWeeklyHours(hours) {
  return Array.isArray(hours) && hours.length === 7 && hours.some((day) => day !== null)
    && hours.every((day) => day === null || (
      typeof day?.open === 'string' && typeof day?.close === 'string'
      && TIME_PATTERN.test(day.open) && TIME_PATTERN.test(day.close)
      && parseClock(day.close) > parseClock(day.open)
    ));
}

export function getDailyScheduleWindow({ date, weeklyHours, timezone }) {
  const dateParts = parseDate(date);
  const weekday = dateParts.calendarDate.getUTCDay();
  const schedule = weeklyHours?.[weekday];
  if (!schedule) return { closed: true, dateParts };

  const { startMinute: openMinute, endMinute: closeMinute } = toValidInterval(
    schedule.open,
    schedule.close,
    'Opening hours',
  );
  return {
    closed: false,
    dateParts,
    openMinute,
    closeMinute,
    openingAt: localToUtc(dateParts, openMinute, timezone),
    closingAt: localToUtc(dateParts, closeMinute, timezone),
  };
}

export function buildArrivalTimes({ date, timezone, weeklyHours, intervalMinutes = 15, after = new Date() }) {
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 5 || intervalMinutes > 60) {
    throw fail('INVALID_SCHEDULE', 'Arrival time interval must be between 5 and 60 minutes.');
  }
  const window = getDailyScheduleWindow({ date, weeklyHours, timezone });
  if (window.closed) return { date, timezone, openingAt: null, closingAt: null, slots: [] };

  const slots = [];
  for (let minute = window.openMinute; minute < window.closeMinute; minute += intervalMinutes) {
    const startAt = localToUtc(window.dateParts, minute, timezone);
    if (startAt <= new Date(after)) continue;
    slots.push({ startAt: startAt.toISOString(), time: displayTime(startAt, timezone) });
  }
  return {
    date,
    timezone,
    openingAt: window.openingAt.toISOString(),
    closingAt: window.closingAt.toISOString(),
    slots,
  };
}

function displayTime(date, timezone) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function buildAvailabilitySlots({
  date,
  timezone,
  weeklyHours,
  serviceDurationMinutes,
  slotIntervalMinutes = 15,
  breaks = [],
  blockedPeriods = [],
  occupiedWindows = [],
}) {
  if (!Number.isInteger(serviceDurationMinutes) || serviceDurationMinutes < 1 || serviceDurationMinutes > 600) {
    throw fail('INVALID_SERVICE_DURATION', 'Service duration must be between 1 and 600 minutes.');
  }
  if (!Number.isInteger(slotIntervalMinutes) || slotIntervalMinutes < 5 || slotIntervalMinutes > 60) {
    throw fail('INVALID_SCHEDULE', 'Slot interval must be between 5 and 60 minutes.');
  }

  const window = getDailyScheduleWindow({ date, weeklyHours, timezone });
  if (window.closed) return { date, timezone, openingAt: null, closingAt: null, slots: [] };

  const dailyBlocks = [
    ...breaks.map((period) => toValidInterval(period.start, period.end, 'Break')),
    ...blockedPeriods
      .filter((period) => period.date === date)
      .map((period) => toValidInterval(period.start, period.end, 'Blocked period')),
  ];
  const occupied = occupiedWindows
    .map(({ startAt, endAt }) => ({ startAt: new Date(startAt), endAt: new Date(endAt) }))
    .filter(({ startAt, endAt }) => Number.isFinite(startAt.getTime()) && Number.isFinite(endAt.getTime()) && endAt > startAt);

  const slots = [];
  for (
    let startMinute = window.openMinute;
    startMinute + serviceDurationMinutes <= window.closeMinute;
    startMinute += slotIntervalMinutes
  ) {
    const endMinute = startMinute + serviceDurationMinutes;
    if (dailyBlocks.some((block) => overlaps(startMinute, endMinute, block.startMinute, block.endMinute))) continue;

    const startAt = localToUtc(window.dateParts, startMinute, timezone);
    const endAt = localToUtc(window.dateParts, endMinute, timezone);
    if (occupied.some((booking) => overlaps(startAt.getTime(), endAt.getTime(), booking.startAt.getTime(), booking.endAt.getTime()))) continue;
    slots.push({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      time: displayTime(startAt, timezone),
    });
  }

  return {
    date,
    timezone,
    openingAt: window.openingAt.toISOString(),
    closingAt: window.closingAt.toISOString(),
    slots,
  };
}

export function buildStaffAvailability({
  date,
  timezone,
  salonWeeklyHours,
  salonBreaks = [],
  salonBlockedPeriods = [],
  staffMembers,
  serviceId,
  serviceIds = serviceId ? [serviceId] : [],
  serviceDurationMinutes,
  slotIntervalMinutes = 15,
  occupiedBookings = [],
  requestedStaffId,
  after = new Date(0),
}) {
  const requestedServices = [...new Set(serviceIds)];
  if (requestedServices.length === 0) throw fail('INVALID_SERVICE_IDS', 'At least one service is required.');
  const candidates = staffMembers.filter((member) => (
    member.active !== false
    && hasCompleteWeeklyHours(member.weeklyHours)
    && requestedServices.every((id) => member.serviceIds?.includes(id))
    && (!requestedStaffId || String(member._id ?? member.id) === String(requestedStaffId))
  ));
  const combinedSlots = new Map();
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const salonWindow = getDailyScheduleWindow({ date, weeklyHours: salonWeeklyHours, timezone });
  const formatClock = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

  for (const member of candidates) {
    const memberId = String(member._id ?? member.id);
    const memberHours = member.weeklyHours;
    const memberWindow = getDailyScheduleWindow({ date, weeklyHours: memberHours, timezone });
    if (salonWindow.closed || memberWindow.closed) continue;
    const opensAtMinute = Math.max(salonWindow.openMinute, memberWindow.openMinute);
    const closesAtMinute = Math.min(salonWindow.closeMinute, memberWindow.closeMinute);
    if (closesAtMinute <= opensAtMinute) continue;
    const effectiveHours = Array(7).fill(null);
    effectiveHours[weekday] = { open: formatClock(opensAtMinute), close: formatClock(closesAtMinute) };
    const leavePeriods = (member.leaveDates || [])
      .filter((leaveDate) => leaveDate === date)
      .map((leaveDate) => ({ date: leaveDate, start: '00:00', end: '23:59' }));
    const slots = buildAvailabilitySlots({
      date,
      timezone,
      weeklyHours: effectiveHours,
      serviceDurationMinutes,
      slotIntervalMinutes,
      breaks: [...salonBreaks, ...(member.breaks || [])],
      blockedPeriods: [...salonBlockedPeriods, ...(member.blockedPeriods || []), ...leavePeriods],
      occupiedWindows: occupiedBookings
        .filter((booking) => String(booking.staffId) === memberId)
        .map(({ startAt, endAt }) => ({ startAt, endAt })),
    });

    for (const slot of slots.slots) {
      if (new Date(slot.startAt) <= new Date(after)) continue;
      const key = `${slot.startAt}|${slot.endAt}`;
      const current = combinedSlots.get(key) || {
        startAt: slot.startAt,
        endAt: slot.endAt,
        time: slot.time,
        staffOptions: [],
      };
      current.staffOptions.push({ id: memberId, name: member.displayName });
      combinedSlots.set(key, current);
    }
  }

  const slots = [...combinedSlots.values()]
    .map((slot) => ({ ...slot, availableStaffCount: slot.staffOptions.length }))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return { date, timezone, slots };
}
