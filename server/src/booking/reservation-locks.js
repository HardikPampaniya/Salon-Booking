export function buildReservationSegments(startValue, endValue, intervalMinutes = 15) {
  const startAt = new Date(startValue);
  const endAt = new Date(endValue);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
    throw new TypeError('Reservation start and end must form a valid positive interval.');
  }
  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 1 || intervalMinutes > 60) {
    throw new TypeError('Reservation interval must be an integer from 1 to 60 minutes.');
  }
  const intervalMs = intervalMinutes * 60_000;
  const firstBucket = Math.floor(startAt.getTime() / intervalMs) * intervalMs;
  const segments = [];
  for (let bucket = firstBucket; bucket < endAt.getTime(); bucket += intervalMs) segments.push(new Date(bucket));
  return segments;
}
