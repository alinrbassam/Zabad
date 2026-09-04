/**
 * Date formatting utilities for Zabad POS.
 * Formats all user-facing dates as DD-MM-YYYY.
 */

/**
 * Formats a date, string, or timestamp as DD-MM-YYYY.
 * E.g., '2026-09-04' -> '04-09-2026'
 *       '2026-09-04T11:51:22.000Z' -> '04-09-2026'
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return '—';

  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '—';

    // Direct match for YYYY-MM-DD or YYYY/MM/DD to avoid timezone shifting on pure date strings
    const isoDateMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (isoDateMatch && /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(trimmed)) {
      const [, year, month, day] = isoDateMatch;
      return `${day}-${month}-${year}`;
    }
  }

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Formats a date, string, or timestamp as DD-MM-YYYY HH:mm (or with seconds).
 * E.g., '2026-09-04T11:51:22.000Z' -> '04-09-2026 11:51'
 */
export function formatDateTime(
  date: string | number | Date | null | undefined,
  includeSeconds = false
): string {
  if (!date) return '—';

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';

  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (includeSeconds) {
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${datePart} ${hours}:${minutes}:${seconds}`;
  }

  return `${datePart} ${hours}:${minutes}`;
}
