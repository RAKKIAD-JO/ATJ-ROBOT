require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/esp32_db'; 

const app = express();
const port = 3000;

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

const statusSchema = new mongoose.Schema({
  device_id: String,
  token: String,
  status: String,
  last_update: { type: Date, default: Date.now },
});

const authenticateDevice = async (req, res, next) => {
  const { device_id, token } = req.headers;

  if (!device_id || !token) {
    console.log("Missing headers");
    return res.status(401).send('Authentication required!');
  }

  try {
    const device = await Status.findOne({ device_id, token });
    if (!device) {
      return res.status(403).send('Invalid token or device ID!');
    }
    next(); 
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).send('Server error!');
  }
};

const checkMongoConnection = () => {
  return mongoose.connection.readyState === 1;
};

const esp32DataSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  plantType: { type: String, required: true },
  liquidType: { type: String, required: true },
  chemicalName: { type: String, required: true },
  area: { type: String, required: true },
  other: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

const esp32SensorSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  battery: { type: Number, required: true },
  pumpStatus: { type: String, required: true },
  sprayRate: { type: Number, required: true },
  flowRate: { type: Number, required: true, default: 0 },
  waterLevel: { type: Number, required: true },
  liquidType: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
});

function normalizeLiquidType(tupe) {
  if (!tupe) return 'unknown';
  const trimmedType = tupe.trim().toLowerCase();
  if (trimmedType === 'น้ำ') return 'water';
  if (trimmedType === 'ปุ๋ย') return 'fertilizer';
  if (trimmedType === 'สารเคมี') return 'pesticide';
  return 'unknown';
}

const Status = mongoose.model('Status', statusSchema);
const Esp32Data = mongoose.model('Esp32Data', esp32DataSchema);
const Esp32Sensor = mongoose.model('Esp32Sensor', esp32SensorSchema);

app.use(express.json());
app.use(bodyParser.json());


// API input status from ESP32
app.post('/api/esp32-status', async (req, res) => {
  const { device_id, token, status } = req.body;
  console.log('Received Data:', req.body); 

  if (!device_id || !token) {
    return res.status(400).json({ success: false, message: 'Device ID and Token are required.' });
  }

  try {
    const device = await Status.findOne({ device_id, token });
    if (!device) {
      return res.status(401).json({ success: false, message: 'Invalid Token.' });
    }
    device.status = status;
    device.last_update = new Date();
    await device.save();
    console.log('Database Update Result:', device);
    res.json({ success: true, data: device });
  } catch (err) {
    console.error('Error updating MongoDB:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Token generation route
app.post('/api/generate-token', async (req, res) => {
  const { device_id } = req.body; 
  console.log('Received Request:', req.body);

  if (!device_id) {
    return res.status(400).json({ success: false, message: 'Device ID is required.' });
  }
  
  try {
    const token = require('crypto').randomBytes(11).toString('hex');
    const result = await Status.findOneAndUpdate(
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
  } catch (err) {
    console.error('Error generating token:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Data
app.post('/api/esp32-data', authenticateDevice, async (req, res) => {
  const { device_id, plantType, liquidType, chemicalName, area, other, timestamp} = req.body;
  if (!device_id || !plantType || !liquidType || !chemicalName || !area || !timestamp) {
      return res.status(400).send('Missing required fields!');
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
app.post('/api/esp32-sensor', authenticateDevice, async (req, res) => {
  const { device_id, battery, pumpStatus, sprayRate, waterLevel ,timestamp, liquidType, flowRate } = req.body;
  if (!device_id || battery == null || pumpStatus == null || sprayRate == null || waterLevel == null || !timestamp || flowRate == null) {
    return res.status(400).send('Missing required fields!');
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
app.get("/api/device/:token", async (req, res) => {
  const { token } = req.params;
  
  console.log(`🔍 Looking for device with token: ${token.substring(0, 10)}...`);
  
  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const device = await Status.findOne({ token }).lean();
    
    if (!device) {
      console.log('❌ Device not found');
      return res.status(404).json({ 
        success: false, 
        message: "Device not found" 
      });
    }

    console.log('✅ Device found:', device.device_id);
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
app.get("/api/device-status/:device_id/:token", async (req, res) => {
  const { device_id, token } = req.params;
  
  console.log(`🔍 Checking status for device: ${device_id}`);
  
  if (!checkMongoConnection()) {
    return res.status(503).json({ 
      success: false, 
      message: "MongoDB not connected" 
    });
  }

  try {
    const status = await Promise.race([
      Status.findOne({ device_id, token }).lean(),
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

    const isOnline = new Date() - status.last_update < 300000; // 5 minutes
    
    res.json({
      success: true,
      data: {
        device_id: status.device_id,
        status: status.status,
        last_update: status.last_update,
        isOnline
      }
    });
  } catch (error) {
    console.error("Error fetching device status:", error);
    
    if (error.message.includes('timeout')) {
      return res.status(503).json({ 
        success: false, 
        message: "Database timeout" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ดึงข้อมูล sensor
app.get("/api/sensor-data/:device_id", async (req, res) => {
  const { device_id } = req.params;
  
  console.log(`📊 Fetching sensor data for device: ${device_id}`);
  
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

    // Normalize pump status
    const normalizedPumpStatus =
      sensorData.pumpStatus === true ||
      sensorData.pumpStatus === "ON" ||
      sensorData.pumpStatus === 1;

    res.json({
      success: true,
      data: {
        device_id: sensorData.device_id,
        battery: sensorData.battery,
        sprayRate: sensorData.sprayRate,
        waterLevel: sensorData.waterLevel,
        pumpStatus: normalizedPumpStatus,
        timestamp: sensorData.timestamp
      }
    });
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    
    if (error.message.includes('timeout')) {
      return res.status(503).json({ 
        success: false, 
        message: "Database timeout" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ดึงข้อมูลสถานะหลายอุปกรณ์พร้อมกัน
app.post("/api/devices-status", async (req, res) => {
  const { devices } = req.body; 
  
  console.log(`🔍 Checking status for ${devices?.length || 0} devices`);
  
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
          Status.findOne({ device_id, token }).lean(),
          Esp32Sensor.findOne({ device_id }).sort({ timestamp: -1 }).lean()
        ]);

        return {
          device_id,
          status: status?.status,
          last_update: status?.last_update,
          isOnline: status ? (new Date() - status.last_update < 300000) : false,
          hasSensorData: !!sensorData
        };
      } catch (err) {
        console.error(`Error for device ${device_id}:`, err);
        return {
          device_id,
          status: null,
          last_update: null,
          isOnline: false,
          hasSensorData: false,
          error: err.message
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

// GET /api/sensor-data/:device_id/latest10
app.get('/api/sensor-data/:device_id/latest10', async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ error: "ต้องระบุ device_id" });
  }

  try {
    const data = await Esp32Sensor.find({ device_id })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('battery sprayRate waterLevel pumpStatus timestamp -_id')
      .lean();

    if (data.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลเซ็นเซอร์สำหรับ device นี้" });
    }

    return res.json(data.reverse()); 
  } catch (error) {
    console.error("❌ Error getting sensor data:", error.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

app.get('/api/esp32-data/:device_id', async (req, res) => {
  const { device_id } = req.params;

  if (!device_id) {
    return res.status(400).json({ error: "ต้องระบุ device_id" });
  }

  try {
    const latestData = await Esp32Data.findOne({ device_id })
      .sort({ timestamp: -1 }) // ดึงข้อมูลล่าสุด
      .select('device_id plantType liquidType chemicalName area other timestamp');

    if (!latestData) {
      return res.status(404).json({ error: "ไม่พบข้อมูล sensor ล่าสุด" });
    }

    return res.json({
      success: true,
      data: latestData,
    });
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

app.get('/api/esp32-status', async (req, res) => {
  try {
    const statuses = await Status.find().lean();
    res.json({
      success: true,
      data: statuses
    });
  } catch (err) {
    console.error("❌ Error fetching ESP32 statuses:", err.message);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// ดึงข้อมูลการใช้งานสารเคมี
app.get("/mongodb/spray-logs", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;
  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const dataLogs = await Esp32Data.find({
      device_id,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    if (!dataLogs || dataLogs.length === 0){
      return res.status(404).json({error : "NO Datas Spray-logs"})
    }

    res.json({ success: true, data: dataLogs });
  } catch (err) {
    console.error("Error fetching MongoDB spray logs:", err);
    res.status(500).json({ error: "MongoDB server error" });
  }
});

// /mongodb/chemical-usage-by-type
app.get("/mongodb/chemical-usage-by-type", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sensors = await Esp32Sensor.find({
      device_id,
      timestamp: { $gte: start, $lte: end },
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
      if (list.length > 1) {
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
    }

    for (const type in usageByType) {
      usageByType[type] = parseFloat(usageByType[type].toFixed(2));
    }

    res.json({
      success: true,
      data: usageByType,
      totalSensors: sensors.length,
    });
  } catch (err) {
    console.error("MongoDB error:", err);
    res.status(500).json({ error: "MongoDB server error" });
  }
});

app.get("/mongodb/chemical-usage-history", async (req, res) => {
  const { device_id, startDate, endDate } = req.query;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
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

      // ใช้ช่วงเวลา ±15 นาที
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
  } catch (err) {
    console.error("Error fetching MongoDB chemical usage history:", err);
    return res.status(500).json({ error: "MongoDB server error" });
  }
});

// การปรับ เป็น offline
const timemin = 2; // ระยะเวลา Timeout (นาที)
const CHECK_INTERVAL = 60000; // เช็คทุก 10 วินาที
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});