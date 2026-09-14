const { checkAndUpdateStatuses, checkingDataandDelete } = require('../statusChecker');
const Esp32Status = require('../models/esp32status');
const Esp32Data = require('../models/esp32data');
const Esp32Sensors = require('../models/esp32sensor');

jest.mock('../models/esp32status');
jest.mock('../models/esp32data');
jest.mock('../models/esp32sensor');

describe('statusChecker module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.DEVICE_TIMEOUT = '5';
    process.env.MONTHS_DELETED = '30';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('checkAndUpdateStatuses', () => {
    it('should update statuses to offline when devices exceed timeout', async () => {
      Esp32Status.updateMany.mockResolvedValue({ modifiedCount: 2 });
      const spyConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      await checkAndUpdateStatuses();

      expect(Esp32Status.updateMany).toHaveBeenCalled();
      expect(spyConsoleLog).toHaveBeenCalledWith('Updated 2 devices to offline.');

      spyConsoleLog.mockRestore();
    });

    it('should not log when no devices are modified', async () => {
      Esp32Status.updateMany.mockResolvedValue({ modifiedCount: 0 });
      const spyConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      await checkAndUpdateStatuses();

      expect(Esp32Status.updateMany).toHaveBeenCalled();
      expect(spyConsoleLog).not.toHaveBeenCalled();

      spyConsoleLog.mockRestore();
    });

    it('should handle errors gracefully during status check', async () => {
      Esp32Status.updateMany.mockRejectedValue(new Error('DB Error'));
      const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      await checkAndUpdateStatuses();

      expect(spyConsoleError).toHaveBeenCalledWith('Error checking device statuses:', expect.any(Error));

      spyConsoleError.mockRestore();
    });
  });

  describe('checkingDataandDelete', () => {
    it('should delete old data according to MONTHS_DELETED env', async () => {
      Esp32Data.deleteMany.mockResolvedValue({ deletedCount: 10 });
      Esp32Sensors.deleteMany.mockResolvedValue({ deletedCount: 5 });
      const spyConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

      await checkingDataandDelete();

      expect(Esp32Data.deleteMany).toHaveBeenCalled();
      expect(Esp32Sensors.deleteMany).toHaveBeenCalled();
      expect(spyConsoleLog).toHaveBeenCalledWith('Old data older than 30 days deleted successfully!');

      spyConsoleLog.mockRestore();
    });

    it('should handle errors gracefully during data deletion', async () => {
      Esp32Data.deleteMany.mockRejectedValue(new Error('Deletion Error'));
      const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      await checkingDataandDelete();

      expect(spyConsoleError).toHaveBeenCalledWith('Error deleting old data:', expect.any(Error));

      spyConsoleError.mockRestore();
    });
  });
});
