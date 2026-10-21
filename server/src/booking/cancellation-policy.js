import { getDailyScheduleWindow } from './availability.js';

export const CANCELLATION_CUTOFF_MINUTES = 60;

export function isCustomerCancellationAllowed(startAt, now = Date.now()) {
  return new Date(startAt).getTime() - new Date(now).getTime() >= CANCELLATION_CUTOFF_MINUTES * 60_000;
}

export function isVisitDateCancellationAllowed(visitDate, { timezone, weeklyHours }, now = Date.now()) {
  const window = getDailyScheduleWindow({ date: visitDate, timezone, weeklyHours });
  if (window.closed) return false;
  const cancellationDeadline = window.openingAt.getTime() - CANCELLATION_CUTOFF_MINUTES * 60_000;
  return new Date(now).getTime() <= cancellationDeadline;
}
