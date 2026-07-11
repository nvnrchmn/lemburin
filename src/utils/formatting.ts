/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} menit`;
  if (mins === 0) return `${hours} jam`;
  return `${hours} jam ${mins} menit`;
}

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number, currency = 'IDR'): string {
  const formatter = new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  // Custom manual replacements for specific symbols if Intl doesn't do it well
  let formatted = formatter.format(amount);
  if (currency === 'IDR' && !formatted.includes('Rp')) {
    formatted = `Rp ${formatted}`;
  }
  return formatted;
}

/**
 * Format string number with thousands separator (for input fields)
 */
export function formatNumberInput(value: string | number): string {
  if (!value) return '';
  const numStr = value.toString().replace(/[^0-9]/g, '');
  if (!numStr) return '';
  
  return parseInt(numStr, 10).toLocaleString('id-ID'); // Always uses dot as separator
}

/**
 * Parse formatted string back to number
 */
export function parseNumberInput(value: string): number {
  if (!value) return 0;
  const numStr = value.replace(/[^0-9]/g, '');
  return parseInt(numStr, 10) || 0;
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format time string (HH:mm)
 */
export function formatTime(timeString: string): string {
  return timeString.substring(0, 5);
}

/**
 * Calculate overtime duration in minutes
 */
export function calculateOvertimeMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

  // Handle overnight
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  return Math.max(0, totalMinutes - breakMinutes);
}

/**
 * Calculate overtime hours (rounded to nearest 0.5)
 */
export function calculateOvertimeHours(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): number {
  const minutes = calculateOvertimeMinutes(startTime, endTime, breakMinutes);
  return Math.round((minutes / 60) * 2) / 2;
}
