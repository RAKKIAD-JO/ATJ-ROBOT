const Esp32Status = require('./models/esp32status');

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

module.exports = checkAndUpdateStatuses;