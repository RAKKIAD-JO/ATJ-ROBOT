require('dotenv').config();
const mongoose = require('mongoose');
const mongoUrl = process.env.MONGO_URL;
const Esp32Status = require('./models/esp32status');
const Esp32Data = require('./models/esp32data');
const Esp32Sensor = require('./models/esp32sensor');
const authenticateDevice = require('./middleware/authenticateDevice');
const express = require("express");
const router = express.Router();

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB!'))
  .catch(error => console.error('Could not connect to MongoDB:', error));

const checkMongoConnection = () => {
return mongoose.connection.readyState === 1;
};

function normalizeLiquidType(tupe) {
  if (!tupe) return 'unknown';
  const trimmedType = tupe.trim().toLowerCase();
  if (trimmedType === 'น้ำ') return 'water';
  if (trimmedType === 'ปุ๋ย') return 'fertilizer';
  if (trimmedType === 'สารเคมี') return 'pesticide';
  return 'unknown';
}

// API input status from ESP32
router.post('/esp32-status', async (req, res) => {
  const { device_id, token, status } = req.body;
  console.log('Received Data:', req.body); 

  if (!device_id || !token) {
    return res.status(400).json({ success: false, message: 'Device ID and Token are required.' });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const device = await Esp32Status.findOne({ device_id, token });
    if (!device) {
      return res.status(401).json({ success: false, message: 'Invalid Token.' });
    }

    device.status = status;
    device.last_update = new Date();

    await device.save();
    console.log('Database Update Result:', device);

    res.json({ 
      success: true, 
      data: device 
    });
  } catch (error) {
    console.error('Error updating MongoDB:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Token generation route
router.post('/generate-token', async (req, res) => {
  const { device_id } = req.body; 
  console.log('Received Request:', req.body);

  if (!device_id) {
    return res.status(400).json({ success: false, message: 'Device ID is required.' });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
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
    console.error('Error generating token:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Data
router.post('/esp32-data', authenticateDevice, async (req, res) => { 
  const { device_id, plantType, liquidType, chemicalName, area, other, timestamp} = req.body;
  if (!device_id || !plantType || !liquidType || !chemicalName || !area || !timestamp) {
      return res.status(400).send('Missing required fields!');
  }
  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }
  try {
      const newData = new Esp32Data({ 
        device_id, 
        plantType, 
        liquidType, 
        chemicalName, 
        area, 
        other: other || '',
        timestamp: new Date(timestamp),
      });

      await newData.save();
      res.status(200).send('Data saved successfully!');
  } catch (err) {
      console.error('Error saving data:', err);
      res.status(500).send('Server error!');
  }
});

// API Sensor
router.post('/esp32-sensor', authenticateDevice, async (req, res) => {
  const { device_id, battery, pumpStatus, sprayRate, waterLevel ,timestamp, liquidType, flowRate } = req.body;
  if (!device_id || battery == null || pumpStatus == null || sprayRate == null || waterLevel == null || !timestamp || flowRate == null) {
    return res.status(400).send('Missing required fields!');
  }
  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }
  try {
    const newSensorData = new Esp32Sensor({
      device_id,
      battery,
      pumpStatus,
      sprayRate,
      flowRate,
      waterLevel,
      liquidType: normalizeLiquidType(liquidType),
      timestamp: new Date(timestamp)
    });

    await newSensorData.save();
    res.status(200).send('Sensor data saved successfully!');
  } catch (err) {
    console.error('Error saving sensor data:', err);
    res.status(500).send('Server error!');
  }
});

// ดึงข้อมูลอุปกรณ์จาก token
router.get("/device/:token", async (req, res) => {
  const { token } = req.params;

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const device = await Esp32Status.findOne({ token }).lean();

    if (!device) {
      console.log('Device not found');
      return res.status(404).json({ 
        success: false, 
        message: "Device not found" 
      });
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
    console.error("Error fetching device:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ดึงสถานะอุปกรณ์
router.get("/device-status/:device_id/:token", async (req, res) => {
  const { device_id, token } = req.params;
  
  console.log(`Checking status for device: ${device_id}`);
  
  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const status = await Promise.race([
      Esp32Status.findOne({ device_id, token }).lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Status query timeout')), 8000)
      )
    ]);
    
    if (!status) {
      return res.status(404).json({ 
        success: false, 
        message: "Device status not found" 
      });
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
    console.error("Error fetching device status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ดึงข้อมูล sensor
router.get("/sensor-data/:device_id", async (req, res) => {
  const { device_id } = req.params;
  
  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const sensorData = await Promise.race([
      Esp32Sensor.findOne({ device_id }).sort({ timestamp: -1 }).lean(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sensor query timeout')), 8000)
      )
    ]);
    
    if (!sensorData) {
      return res.status(404).json({ 
        success: false, 
        message: "No sensor data found" 
      });
    }

    res.json({
      success: true,
      data: {
        device_id: sensorData.device_id,
        battery: sensorData.battery,
        sprayRate: sensorData.sprayRate,
        waterLevel: sensorData.waterLevel,
        pumpStatus: sensorData.pumpStatus,
        timestamp: sensorData.timestamp
      }
    });
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ดึงข้อมูลสถานะหลายอุปกรณ์พร้อมกัน
router.post("/devices-status", async (req, res) => {
  const { devices } = req.body;
  
  if (!devices || !Array.isArray(devices)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid devices array" 
    });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const statusPromises = devices.map(async ({ device_id, token }) => {
      try {
        const [status, sensorData] = await Promise.all([
          Esp32Status.findOne({ device_id, token }).lean(),
          Esp32Sensor.findOne({ device_id }).sort({ timestamp: -1 }).lean()
        ]);

        return {
          device_id,
          status: status?.status,
          last_update: status?.last_update,
          hasSensorData: !!sensorData
        };
      } catch (error) {
        console.error(`Error for device ${device_id}:`, error);
        return {
          device_id,
          status: null,
          last_update: null,
          hasSensorData: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(statusPromises);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Error fetching devices status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

//ต้องการข้อมูล แบบ array
router.get('/sensor-data/:device_id/latest10', async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ error: "ต้องระบุ device_id" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const data = await Esp32Sensor.find({ device_id }).sort({ timestamp: -1 }).limit(10).select('battery sprayRate waterLevel pumpStatus timestamp').lean();

    if (data.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลเซ็นเซอร์" });
    }

    return res.json({
      success: true,
      data: data.reverse()
    });
  } catch (error) {
    console.error("Error getting sensor data:", error.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get('/esp32-data/:device_id', async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ error: "ต้องระบุ device_id" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const latestData = await Esp32Data.findOne({ device_id }).sort({ timestamp: -1 }).select('device_id plantType liquidType chemicalName area other timestamp');

    if (!latestData) {
      return res.status(404).json({ error: "ไม่พบข้อมูล sensor ล่าสุด" });
    }

    return res.json({
      success: true,
      data: latestData,
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get('/esp32-status', async (req, res) => {

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }
  try {
    const statuses = await Esp32Status.find().lean();
    res.json({
      success: true,
      data: statuses
    });
  } catch (err) {
    console.error("Error fetching ESP32 statuses:", err.message);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// ดึงข้อมูลการใช้งานสารเคมี
router.get("/spray-logs", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;
  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const dataLogs = await Esp32Data.find({
      device_id,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    if (!dataLogs || dataLogs.length === 0){
      return res.status(404).json({error : "NO Datas"})
    }

    res.json({ success: true, data: dataLogs });
  } catch (error) {
    console.error("Error fetching MongoDB spray logs:", error);
    res.status(500).json({ error: "MongoDB server error" });
  }
});

// /mongodb/chemical-usage-by-type
router.get("/chemical-usage-by-type", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sensors = await Esp32Sensor.find({ 
      device_id, 
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 });

    if (!sensors || sensors.length === 0) {
      return res.status(404).json({ error : "No Datas Sensors"})
    }

    const usageByType = { water: 0, fertilizer: 0, pesticide: 0 };
    const factor = 1;
    const typeMap = {
      water: [],
      fertilizer: [],
      pesticide: []
    };

    for (const sensor of sensors) {
      const type = (sensor.liquidType || "").toLowerCase().trim();
      if (typeMap[type]) {
        typeMap[type].push(sensor);
      }
    }

    for (const type in typeMap) {
      const list = typeMap[type];
      for (let i = 1; i < list.length; i++) {
        const prev = list[i - 1];
        const curr = list[i];

        if (!(prev.pumpStatus === "ON" && Number(prev.flowRate) > 0)) continue
        const flowRate = Number(prev.flowRate);
        const durationSec = Math.min((curr.timestamp - prev.timestamp) / 1000, 60);
        const added = flowRate * (durationSec / 60) * factor;
        usageByType[type] += added;
      }
    }

    for (const type in usageByType) {
      usageByType[type] = parseFloat(usageByType[type].toFixed(2));
    }

    res.json({
      success: true,
      data: usageByType,
      totalSensors: sensors.length,
    });
  } catch (error) {
    console.error("MongoDB error:", error);
    res.status(500).json({ error: "MongoDB server error" });
  }
});

router.get("/chemical-usage-history", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const DataLogs = await Esp32Data.find({
      device_id,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });

    const SensorLogs = await Esp32Sensor.find({
      device_id,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });

    if ((!DataLogs || DataLogs.length === 0) && (!SensorLogs || SensorLogs.length === 0)) {
      return res.status(404).json({ error: "No data found for the specified device and date range" });
    }

    const groupedTime = {};
    const groupedUsage = {};

    for (const log of DataLogs) {
      const logTime = new Date(log.timestamp);
      const rangeStart = new Date(logTime.getTime() - 15 * 60 * 1000);
      const rangeEnd = new Date(logTime.getTime() + 15 * 60 * 1000);
      const sensorsInRange = SensorLogs.filter(sensor => {
        const sensorTime = new Date(sensor.timestamp);
        return sensorTime >= rangeStart && sensorTime <= rangeEnd;
      });

      let usageSec = 0;
      let usageLiters = 0;

      
      for (let i = 1; i < sensorsInRange.length; i++) {
        const prev = sensorsInRange[i - 1];
        const curr = sensorsInRange[i];

        if (!(prev.pumpStatus === "ON" && Number(prev.flowRate) > 0)) continue; 

        const prevTime = new Date(prev.timestamp);
        const currTime = new Date(curr.timestamp);

        const durationSec = Math.min((currTime - prevTime) / 1000, 60);
        if (durationSec <= 0 || durationSec >= 90) continue;

        const durationMin = durationSec / 60;
        const flowRate = Number(prev.flowRate) || 0;
        const usedLiters = flowRate * durationMin;

        usageSec += durationSec;
        usageLiters += usedLiters;
      }

      const logDate = logTime.toISOString().split("T")[0];
      if (!groupedTime[logDate]) groupedTime[logDate] = 0;
      if (!groupedUsage[logDate]) groupedUsage[logDate] = 0;

      groupedTime[logDate] += usageSec;
      groupedUsage[logDate] += usageLiters;
    }

    for (const date in groupedTime) {
      groupedTime[date] = parseFloat((groupedTime[date] / 60).toFixed(2));
    }
    for (const date in groupedUsage) {
      groupedUsage[date] = parseFloat(groupedUsage[date].toFixed(2));
    }

    res.json({
      success: true,
      data: {
        device_id,
        usageHistory: DataLogs.map((log) => {
          const logDate = new Date(log.timestamp).toISOString().split("T")[0];
          return {
            plantType: log.plantType,
            liquidType: log.liquidType,
            chemicalName: log.chemicalName,
            area: log.area,
            other: log.other || "",
            timestamp: log.timestamp,
            groupedTime: groupedTime[logDate] || 0,
            groupedUsage: groupedUsage[logDate] || 0,
          };
        }),
        groupedTime,
        groupedUsage,
      },
    });
  } catch (error) {
    console.error("Error fetching MongoDB chemical usage history:", error);
    return res.status(500).json({ error: "MongoDB server error" });
  }
});

// การปรับ เป็น offline
const timemin = 2; 
const CHECK_INTERVAL = 60000; 
const TIMEOUT_LIMIT = timemin * 10000;

setInterval(async () => {
  const now = new Date();
  try {
    const result = await Status.updateMany(
      { last_update: { $lt: new Date(now - TIMEOUT_LIMIT) }, status: "online" },
      { $set: { status: "offline" } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Updated ${result.modifiedCount} devices to offline.`);
    }
  } catch (error) {
    console.error('Error checking device statuses:', error);
  }
}, CHECK_INTERVAL);

module.exports = router;