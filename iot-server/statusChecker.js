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
  const now = new Date();
  const nowThailand = new Date(now.getTime() + 7 * 60 * 60 * 1000); // +7 ชั่วโมง
  const MonthsDelete = `${process.env.MONTHS_AGO}`;
  
  // เดือนก่อน
  const MonthsAgo = new Date();
  MonthsAgo.setMonth(now.getMonth() - Number(process.env.MONTHS_AGO));

  console.log("เวลาปัจจุบัน (UTC):", nowThailand.toISOString());
  console.log("เวลาเก่า (", MonthsDelete, " เดือน):", MonthsAgo.toISOString());

  // ดูตัวอย่างข้อมูลเก่า
  const oldDataEsp32 = await Esp32Data.find({ timestamp: { $lt: MonthsAgo } });
  const oldDataSensors = await Esp32Sensors.find({ timestamp: { $lt: MonthsAgo } });

  console.log("จำนวน esp32data เก่า:", oldDataEsp32.length);
  console.log("จำนวน esp32sensors เก่า:", oldDataSensors.length);

  // ลบข้อมูล
  await Esp32Data.deleteMany({ timestamp: { $lt: MonthsAgo } });
  await Esp32Sensors.deleteMany({ timestamp: { $lt: MonthsAgo } });
}

module.exports = { checkAndUpdateStatuses, checkingDataandDelete };