import { formatDate, formatBatteryPercentage, isRobotOnline } from '../utils/formatters';

describe('formatters utility functions', () => {
  describe('formatDate', () => {
    it('should format a valid date string to YYYY-MM-DD', () => {
      expect(formatDate('2026-09-14T10:00:00.000Z')).toBe('2026-09-14');
    });

    it('should return Invalid Date for invalid inputs', () => {
      expect(formatDate('not-a-date')).toBe('Invalid Date');
    });
  });

  describe('formatBatteryPercentage', () => {
    it('should format valid numbers correctly', () => {
      expect(formatBatteryPercentage(85.4)).toBe('85%');
    });

    it('should clamp values between 0 and 100', () => {
      expect(formatBatteryPercentage(150)).toBe('100%');
      expect(formatBatteryPercentage(-20)).toBe('0%');
    });

    it('should handle non-number inputs', () => {
      expect(formatBatteryPercentage(NaN)).toBe('0%');
      // @ts-ignore
      expect(formatBatteryPercentage('50')).toBe('0%');
    });
  });

  describe('isRobotOnline', () => {
    it('should return true for recent updates', () => {
      const recent = new Date().toISOString();
      expect(isRobotOnline(recent)).toBe(true);
    });

    it('should return false for old updates', () => {
      const oldDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(isRobotOnline(oldDate, 5)).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isRobotOnline('invalid-date')).toBe(false);
    });
  });
});
