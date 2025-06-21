require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/esp32_db'; 

const app = express();
const port = 3000;

// MongoDB Connection
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
    return res.status(401).send('Authentication required!');
  }

  try {
    const device = await Status.findOne({ device_id, token });
    if (!device) {
      return res.status(403).send('Invalid token or device ID!');
    }
    next(); // อุปกรณ์ถูกต้อง ให้ดำเนินการต่อ
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).send('Server error!');
  }
};

// Helper function to check MongoDB connection
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
  battery: { type: String, required: true },
  pumpStatus: { type: String, required: true },
  sprayRate: { type: String, required: true },
  waterLevel: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Status = mongoose.model('Status', statusSchema);
const Esp32Data = mongoose.model('Esp32Data', esp32DataSchema);
const Esp32Sensor = mongoose.model('Esp32Sensor', esp32SensorSchema);

app.use(express.json());
app.use(bodyParser.json());


// API input
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

// API Endpoint to receive data from ESP32
app.post('/api/esp32-data', async (req, res) => {
  const { device_id, plantType, liquidType, chemicalName, area, other} = req.body;

  // Validate input
  if (!device_id || !plantType || !liquidType || !chemicalName || !area) {
      return res.status(400).send('Missing required fields!');
  }

  try {
      // Save data to MongoDB
      const newData = new Esp32Data({ device_id, plantType, liquidType, chemicalName, area, other: other || ''});
      
      await newData.save();
      res.status(200).send('Data saved successfully!');
  } catch (err) {
      console.error('Error saving data:', err);
      res.status(500).send('Server error!');
  }
});

// API Sensor
app.post('/api/esp32-sensor', authenticateDevice, async (req, res) => {
  const { device_id, battery, pumpStatus, sprayRate, waterLevel ,timestamp } = req.body;
  const thaiTimestamp = new Date(new Date(timestamp).getTime() + 7 * 60 * 60 * 1000);
  // ตรวจสอบข้อมูล
  if (!device_id || battery == null || pumpStatus == null || sprayRate == null || waterLevel == null || !timestamp) {
    return res.status(400).send('Missing required fields!');
  }

  try {
    // บันทึกข้อมูลใน MongoDB
    const newSensorData = new Esp32Sensor({
      device_id,
      battery,
      pumpStatus,
      sprayRate,
      waterLevel,
      timestamp: thaiTimestamp 
    });

    await newSensorData.save();
    res.status(200).send('Sensor data saved successfully!');
  } catch (err) {
    console.error('Error saving sensor data:', err);
    res.status(500).send('Server error!');
  }
});

// 1. ดึงข้อมูลอุปกรณ์จาก token
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

// 2. ดึงสถานะอุปกรณ์
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

// 3. ดึงข้อมูล sensor
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

// 4. ดึงข้อมูลสถานะหลายอุปกรณ์พร้อมกัน
app.post("/api/devices-status", async (req, res) => {
  const { devices } = req.body; // [{ device_id, token }, ...]
  
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

// 5. Health check
app.get("/api/health", (req, res) => {
  const mongoStatus = checkMongoConnection();
  
  res.json({
    status: "OK",
    mongodb: mongoStatus ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
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

    return res.json(data.reverse()); // เรียงจากเก่าไปใหม่
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
      .select('device_id plantType liquidType chemicalName area other timestamp'); // เลือกเฉพาะฟิลด์ที่ต้องการ

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


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
});


// การปรับ เป็น offline
const CHECK_INTERVAL = 60000; // เช็คทุก 10 วินาที
const TIMEOUT_LIMIT = 2 * 10000; // ระยะเวลา Timeout (2 นาที)

setInterval(async () => {
  const now = new Date();
  try {
    const result = await Status.updateMany(
      { last_update: { $lt: new Date(now - TIMEOUT_LIMIT) }, status: "online" },
      { $set: { status: "offline" } }
    );

    // ตรวจสอบเฉพาะเมื่อมีการเปลี่ยนแปลง
    if (result.modifiedCount > 0) {
      console.log(`Updated ${result.modifiedCount} devices to offline.`);
    }
  } catch (err) {
    console.error('Error checking device statuses:', err);
  }
}, CHECK_INTERVAL);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});