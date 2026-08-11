/**
 * Converts integer paise into Indian Rupee formatting (₹)
 * Example: 749900 -> "₹7,499"
 */
export function formatINR(paise: number, showDecimals = false): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  }).format(rupees);
}

/**
 * Formats ISO date string to Indian localized date
 * Example: "2026-08-15" -> "15 Aug 2026"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (_) {
    return dateStr;
  }
}

/**
 * Formats 24h time string ("07:00") to 12h AM/PM time ("7:00 AM")
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m || 0).padStart(2, '0')} ${period}`;
}
