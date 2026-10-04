/**
 * Calculate time similarity score (0 to 100) using configurable time decay.
 *
 * Rules:
 * - Found date/time is typically at or after the lost date/time.
 * - Same day within a few hours: 95-100%
 * - Within 24 hours: 90%
 * - Within 3 days: 80%
 * - Within 7 days: 65%
 * - Within 14 days: 50%
 * - Found prior to being reported lost by a short margin (e.g. finder found it first before owner noticed): handled gracefully.
 */
export const calculateTimeScore = (lostDate, foundDate, lostTime = '', foundTime = '') => {
  if (!lostDate || !foundDate) return 50; // Neutral baseline if dates are missing

  const d1 = new Date(lostDate);
  const d2 = new Date(foundDate);

  // If time string like "14:30" or "02:30 PM" exists, parse hours and minutes
  if (lostTime) {
    const parts = parseTimeString(lostTime);
    if (parts) d1.setHours(parts.hours, parts.minutes, 0, 0);
  }
  if (foundTime) {
    const parts = parseTimeString(foundTime);
    if (parts) d2.setHours(parts.hours, parts.minutes, 0, 0);
  }

  // Difference in hours
  const diffHours = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);

  // Found shortly after being lost
  if (diffHours >= 0) {
    if (diffHours <= 2) return 100;
    if (diffHours <= 6) return 95;
    if (diffHours <= 24) return 90;
    if (diffHours <= 72) return 80;
    if (diffHours <= 168) return 65; // 7 days
    if (diffHours <= 336) return 50; // 14 days
    if (diffHours <= 720) return 30; // 30 days
    return Math.max(10, Math.round(30 - (diffHours - 720) / 100));
  } else {
    // Found slightly before reported lost time (e.g. owner thought they lost it at 3pm but it dropped at 2pm)
    const absDiff = Math.abs(diffHours);
    if (absDiff <= 4) return 85;
    if (absDiff <= 24) return 70;
    if (absDiff <= 48) return 50;
    return 15;
  }
};

function parseTimeString(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*([APap][Mm]))?/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}
