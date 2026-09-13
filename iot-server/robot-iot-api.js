const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/esp32_db';
const Esp32Status = require('./models/esp32status');
const Esp32Data = require('./models/esp32data');
const Esp32Sensor = require('./models/esp32sensor');
const authenticateDevice = require('./middleware/authenticateDevice');
const express = require("express");
const router = express.Router();
const moment = require('moment-timezone');

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('ไม่สามารถเชื่อมต่อกับ MongoDB ได้:', error));

const checkMongoConnection = () => {
  return mongoose.connection.readyState === 1;
};

function normalizeLiquidType(liquidType) {
  if (!liquidType) return 'unknown';
  const trimmedType = liquidType.trim().toLowerCase();
  if (trimmedType === 'น้ำ') return 'water';
  if (trimmedType === 'ปุ๋ย') return 'fertilizer';
  if (trimmedType === 'สารเคมี') return 'pesticide';
  return 'unknown';
}

router.post('/esp32-status', async (req, res) => {
  const { device_id, token, status } = req.body;

  if (!device_id || !token) {
    return res.status(400).send("Device ID and Token are required.");
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const device = await Esp32Status.findOne({ device_id, token });
    if (!device) {
      return res.status(401).json({ success: false, message: 'Invalid Token.' });
    }

    device.status = status;
    device.last_update = new Date();

    await device.save();

    res.json({ 
      success: true, 
      data: {
        device_id : device.device_id,
        status : device.status,
        token : device.token,
        last_update: device.last_update
      } 
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    return res.status(500).send("Server error");
  }
});

router.post('/generate-token', async (req, res) => {
  const { device_id } = req.body;
  console.log('Received Request:', req.body);

  if (!device_id) {
    return res.status(400).json({ success: false, message: 'Device ID is required.' });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const token = require('crypto').randomBytes(11).toString('hex');
    const result = await Esp32Status.findOneAndUpdate(
      { device_id },
      {
        token,
        $setOnInsert: { status: "offline" }
      },
      { upsert: true, new: true }
    );

    console.log('Database Update Result:', result);

    res.json({
      success: true,
      token,
      status: result.status,
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.post('/esp32-data', authenticateDevice, async (req, res) => {
  const { formID, device_id, plantType, liquidType, chemicalName, area, other, timestamp } = req.body;

  if (!device_id || !plantType || !liquidType || !chemicalName || !area || !timestamp || !formID) {
    return res.status(400).send("Missing required fields!");
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const saveData = new Esp32Data({
      formID,
      device_id,
      plantType,
      liquidType,
      chemicalName,
      area,
      other: other || "",
      timestamp: new Date(timestamp)
    });

    await saveData.save();
    return res.status(200).send("Data saved/updated successfully!");

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    return res.status(500).send("Server error");
  }
});

router.post('/esp32-sensor', authenticateDevice, async (req, res) => {
  const { device_id, battery, pumpStatus, sprayRate, waterLevel, timestamp, liquidType, flowRate, totalVolume, formID } = req.body;
  if (!device_id || !battery || !pumpStatus || !waterLevel || !timestamp || !flowRate || !totalVolume || !formID) {
    return res.status(400).send('Missing required fields!');
  }
  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }
  try {
    const newSensorData = new Esp32Sensor({
      formID,
      device_id,
      battery,
      pumpStatus,
      sprayRate,
      flowRate,
      waterLevel,
      liquidType: normalizeLiquidType(liquidType),
      timestamp: new Date(timestamp),
      totalVolume
    });

    await newSensorData.save();
    res.status(200).send('Sensor data saved successfully!');
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    res.status(500).send('Server error');
  }
});

router.get("/device/:token", async (req, res) => {
  const { token } = req.params;

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const device = await Esp32Status.findOne({ token }).lean();

    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    res.json({
      success: true,
      data: {
        device_id: device.device_id,
        status: device.status,
        last_update: device.last_update
      }
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get("/device-status/:device_id/:token", async (req, res) => {
  const { device_id, token } = req.params;

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const status = await Esp32Status.findOne({ device_id, token }).lean();

    if (!status) {
      return res.status(404).json({ success: false, message: "Device status not found" });
    }

    res.json({
      success: true,
      data: {
        device_id: status.device_id,
        status: status.status,
        last_update: status.last_update,
      }
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get("/sensor-data/:device_id", async (req, res) => {
  const { device_id } = req.params;

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const sensorData = await Esp32Sensor.findOne({ device_id }).sort({ timestamp: -1 }).lean();
    const latestData = await Esp32Data.findOne({ device_id }).sort({ timestamp: -1 }).lean();

    if (!sensorData) {
      return res.status(404).json({ success: false, message: "No sensor data found" });
    }
    if (!latestData) {
      return res.status(404).json({ success: false, message: "No data log found" });
    }

    res.json({
      success: true,
      data: {
        formID: latestData.formID,
        device_id: sensorData.device_id,
        battery: sensorData.battery,
        sprayRate: sensorData.sprayRate,
        flowRate: sensorData.flowRate,
        waterLevel: sensorData.waterLevel,
        totalVolume: sensorData.totalVolume,
        pumpStatus: sensorData.pumpStatus,
        liquidType: sensorData.liquidType || "unknown",
        timestamp: sensorData.timestamp
      }
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get('/sensor-data/:device_id/latest10', async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ message: "ต้องระบุ device_id" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const latestForm = await Esp32Data.findOne({ device_id })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestForm) {
      return res.status(404).json({ message: "ไม่พบข้อมูล Esp32Data ล่าสุด" });
    }

    const sensors = await Esp32Sensor.find({
      device_id,
      formID: latestForm.formID
    })
      .sort({ timestamp: 1 })
      .limit(10)
      .select(
        'formID device_id battery flowRate waterLevel totalVolume pumpStatus liquidType timestamp'
      )
      .lean();

    if (!sensors || sensors.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลเซ็นเซอร์" });
    }

    return res.json({
      success: true,
      count: sensors.length,
      data: sensors
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด::", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get('/esp32-data/:device_id', async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ message: "ต้องระบุ device_id" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({
      success: false,
      message: "MongoDB not connected"
    });
  }

  try {
    const dataLogs = await Esp32Data.findOne({ device_id }).sort({ timestamp: -1 }).select('formID device_id plantType liquidType chemicalName area other timestamp');

    if (!dataLogs) {
      return res.status(404).json({ message: "ไม่พบข้อมูล sensor ล่าสุด" });
    }

    return res.json({
      success: true,
      data: dataLogs,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get('/esp32-status', async (req, res) => {
  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const dataLogs = await Esp32Status.find().lean();

    if (!dataLogs) {
      return res.status(404).json({ error: "ไม่พบข้อมูล" })
    };

    res.json({
      success: true,
      data: dataLogs
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด::", error.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get("/spray-logs", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;
  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({
      success: false,
      message: "MongoDB not connected"
    });
  }

  try {
    const start = moment.utc(startDate, "YYYY-MM-DD").startOf("day").toDate();
    const end = moment.utc(endDate, "YYYY-MM-DD").endOf("day").toDate();

    const dataLogs = await Esp32Data.find({
      device_id,
      timestamp: { $gte: start, $lte: end }
    });

    if (!dataLogs || dataLogs.length === 0) {
      return res.status(404).json({ error: "NO Datas" });
    }

    res.json({ success: true, data: dataLogs });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get("/usage-history", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ message: "Parameter ไม่ครบ" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const start = moment.tz(startDate, "YYYY-MM-DD").startOf("day").toDate();
    const end = moment.tz(endDate, "YYYY-MM-DD").endOf("day").toDate();

    const DataLogs = await Esp32Data.find({
      device_id,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });

    const SensorLogs = await Esp32Sensor.find({
      device_id,
      timestamp: { $gte: start, $lte: end },
    })
      .sort({ timestamp: 1 })
      .select("formID timestamp flowRate pumpStatus liquidType totalVolume");

    if ((!DataLogs || DataLogs.length === 0) && (!SensorLogs || SensorLogs.length === 0)) {
      return res.status(404).json({ error: "No data found for the specified device and date range" });
    }

    const isPumpOn = (item) => {
      if (typeof item === "string") {
        const items = item.trim().toLowerCase();
        return items === "on";
      }
      return false;
    };

    const usageHistory = [];

    for (const data of DataLogs) {
      const sensorsForFormId = SensorLogs.filter((s) => s.formID === data.formID);
      let usageSec = 0;

      if (sensorsForFormId.length >= 2) {
        for (let i = 1; i < sensorsForFormId.length; i++) {
          const prev = sensorsForFormId[i - 1];
          const curr = sensorsForFormId[i];

          if (!isPumpOn(prev.pumpStatus)) continue;

          const prevTime = new Date(prev.timestamp);
          const currTime = new Date(curr.timestamp);
          const durationSec = (currTime - prevTime) / 1000;

          if (durationSec > 0 && durationSec < 600) {
            usageSec += durationSec;
          }
        }
      }

      const latestSensor = sensorsForFormId[sensorsForFormId.length - 1];
      const totalVolume = latestSensor ? Number(latestSensor.totalVolume) || 0 : 0;

      usageHistory.push({
        formID: data.formID,
        _id: data._id,
        plantType: data.plantType,
        liquidType: data.liquidType,
        chemicalName: data.chemicalName,
        area: data.area,
        other: data.other || "",
        timestamp: data.timestamp,
        usageTime: parseFloat((usageSec / 60).toFixed(2)),
        totalVolume: parseFloat(totalVolume.toFixed(2)),
      });
    }

    return res.json({ success: true, data: { device_id, usageHistory } });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.put("/EditData-MongoDB/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await Esp32Data.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูล Id นี้" });
    }

    res.json(
      {
        success: true,
        data: updated
      });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.delete("/deleteDataRobot/:device_id", async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ success: false, message: "ต้องระบุ device_id" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ success: false, message: "MongoDB not connected" });
  }

  try {
    const statusRes = await Esp32Status.deleteMany({ device_id });
    const dataRes = await Esp32Data.deleteMany({ device_id });
    const sensorRes = await Esp32Sensor.deleteMany({ device_id });

    const totalDeleted =
      (statusRes.deletedCount || 0) +
      (dataRes.deletedCount || 0) +
      (sensorRes.deletedCount || 0);

    if (totalDeleted === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลสำหรับ device_id นี้" });
    }

    res.json({
      success: true,
      message: "ลบข้อมูลทั้งหมดสำเร็จ",
      deleted: {
        status: statusRes.deletedCount,
        data: dataRes.deletedCount,
        sensor: sensorRes.deletedCount,
      },
    });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการลบ:", error);
    return res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// router.get("/api/esp32data-app", async (req, res) => {
//   try {
//     const data = await Esp32Data.find().sort({ timestamp: -1 });
//     res.json({ success: true, count: data.length, data });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

module.exports = router;