/**
 * Utility helper functions for formatting dates and data values in ATJ Web Server.
 */

export function formatDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toISOString().split('T')[0];
}

export function formatBatteryPercentage(level: number): string {
  if (typeof level !== 'number' || isNaN(level)) {
    return '0%';
  }
  const clamped = Math.max(0, Math.min(100, level));
  return `${Math.round(clamped)}%`;
}

export function isRobotOnline(lastUpdate: Date | string | number, timeoutMinutes = 5): boolean {
  const date = new Date(lastUpdate);
  if (isNaN(date.getTime())) {
    return false;
  }
  const diffMs = Date.now() - date.getTime();
  return diffMs <= timeoutMinutes * 60 * 1000;
}
