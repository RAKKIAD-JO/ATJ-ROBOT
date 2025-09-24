const Esp32Status = require('./models/esp32status');
const Esp32Data = require('./models/esp32data');
const Esp32Sensors = require('./models/esp32sensor');

async function checkAndUpdateStatuses() {
  const timeout = process.env.DEVICE_TIMEOUT;
  const TIMEOUT_LIMIT = timeout * 60 * 1000;

  try {
    const now = new Date();
    const result = await Esp32Status.updateMany(
      { last_update: { $lt: new Date(now - TIMEOUT_LIMIT) }, status: "online" },
      { $set: { status: "offline" } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Updated ${result.modifiedCount} devices to offline.`);
    }
  } catch (error) {
    console.error('Error checking device statuses:', error);
  }
}

async function checkingDataandDelete() {
  try {
    const now = new Date();
    const daysAgo = Number(process.env.MONTHS_DELETED);
    const dateThreshold = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    await Esp32Data.deleteMany({ timestamp: { $lt: dateThreshold } });
    await Esp32Sensors.deleteMany({ timestamp: { $lt: dateThreshold } });

    console.log(`Old data older than ${daysAgo} days deleted successfully!`);
  } catch (error) {
    console.error("Error deleting old data:", error);
  }
}


module.exports = { checkAndUpdateStatuses, checkingDataandDelete };