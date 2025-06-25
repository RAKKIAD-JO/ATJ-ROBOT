const express = require("express");
const router = express.Router();
const db = require("../postgres"); // ปรับตามโครงสร้างจริง
const axios = require("axios");
const authenticateToken = require('../middleware/auth');
require('dotenv').config();

// Config for API Server
const API_SERVER_URL = process.env.IOT_SERVER_URL;

// Helper function to call API with timeout
const callAPI = async (url, options = {}) => {
  const method = options.method || 'GET';
  const timeout = options.timeout || 10000;
  const data = options.data || null;

  try {
    const axiosConfig = {
      method,
      url,
      timeout,
      data,
    };

    const response = await Promise.race([
      axios(axiosConfig),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API call timeout')), timeout)
      )
    ]);
    return response;
  } catch (error) {
    console.error("Connect robot error:", error.message);
    throw error;
  }
};

router.post("/connect-robot", authenticateToken, async (req, res) => {
  const userId = req.userId;
  const { token, robot_name } = req.body;

  if (!token || !robot_name) {
    return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  try {
    // ตรวจสอบ token กับ API Server และดึง device_id
    const response = await axios.get(`http://iot-server:3000/api/device/${token}`);
    
    if (!response.data.success || !response.data.data) {
      return res.status(404).json({ success: false, message: "token ไม่พบในระบบ" });
    }

    const device_id = response.data.data.device_id;
    if (!device_id) {
      return res.status(400).json({ success: false, message: "ไม่พบ device_id" });
    }

    // ตรวจสอบว่า token นี้มีใน PostgreSQL แล้วหรือยัง
    const selectQuery = `SELECT * FROM robots WHERE token = $1`;
    const selectResult = await db.query(selectQuery, [token]);

    if (selectResult.rows.length === 0) {
      // ยังไม่มี → แทรกใหม่
      const insertQuery = `
        INSERT INTO robots (user_id, token, robot_name, device_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const insertResult = await db.query(insertQuery, [userId, token, robot_name, device_id]);
      return res.json({ success: true, message: "เชื่อมต่อหุ่นยนต์สำเร็จ", user: insertResult.rows[0] });
    } else {
      // มีอยู่แล้ว → อัปเดตชื่อหรือ device_id ถ้ามีการเปลี่ยน
      const existing = selectResult.rows[0];
      if (
        existing.robot_name !== robot_name ||
        existing.user_id !== userId ||
        existing.device_id !== device_id
      ) {
        const updateQuery = `
          UPDATE robots
          SET robot_name = $1, user_id = $2, device_id = $3
          WHERE token = $4
          RETURNING *
        `;
        const updateResult = await db.query(updateQuery, [robot_name, userId, device_id, token]);
        return res.json({ success: true, message: "อัปเดตข้อมูลหุ่นยนต์สำเร็จ", user: updateResult.rows[0] });
      } else {
        return res.json({ success: true, message: "เชื่อมต่อสำเร็จ", user: existing });
      }
    }
  } catch (error) {
    console.error("Connect robot error:", error.message);
    
    if (error.message.includes('API server not available')) {
      return res.status(503).json({ 
        success: false, 
        message: "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง" 
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "token ไม่พบในระบบ" });
    }
    
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// GET /robot/my_robot - ดึงรายการหุ่นยนต์ของผู้ใช้
router.get("/my_robot", authenticateToken, async (req, res) => {
  const userId = req.userId;

  try {
    const pgClient = await db.connect();
    try {
      const query = `
        SELECT id, robot_name, token, device_id 
        FROM robots 
        WHERE user_id = $1
      `;
      const result = await pgClient.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.json({ 
          success: true, 
          robots: [] 
        });
      }
      const devices = result.rows.map(robot => ({
        device_id: robot.device_id,
        token: robot.token
      }));
      try {
        const statusResponse = await axios.post(`${API_SERVER_URL}/devices-status`, 
          { devices },
          { timeout: 15000 }
        );

        if (statusResponse.data.success) {
          const robotsWithStatus = result.rows.map(robot => {
            const statusData = statusResponse.data.data.find(
              item => item.device_id === robot.device_id
            );
            
            return {
              ...robot,
              isOnline: statusData?.isOnline || false,
              lastSeen: statusData?.last_update,
              hasSensorData: statusData?.hasSensorData || false,
              status: statusData?.status
            };
          });

          return res.json({ 
            success: true, 
            robots: robotsWithStatus 
          });
        } else {
          const robotsWithBasicData = result.rows.map(robot => ({
            ...robot,
            isOnline: false,
            lastSeen: null,
            hasSensorData: false,
            status: 'unknown'
          }));

          return res.json({ 
            success: true, 
            robots: robotsWithBasicData,
            warning: "ไม่สามารถดึงสถานะล่าสุดได้"
          });
        }
      } catch (apiError) {
        console.error('API call failed:', apiError.message);
        
        // ถ้า API Server ไม่พร้อม ให้ส่งข้อมูลพื้นฐาน
        const robotsWithBasicData = result.rows.map(robot => ({
          ...robot,
          isOnline: false,
          lastSeen: null,
          hasSensorData: false,
          status: 'unknown'
        }));

        return res.json({ 
          success: true, 
          robots: robotsWithBasicData,
          warning: "ระบบสถานะไม่พร้อมใช้งาน"
        });
      }
    } finally {
      pgClient.release();
    }
  } catch (err) {
    console.error('Error fetching robots:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /robot/sensor-data/:robot_id - ดึงข้อมูล sensor
router.get("/sensor-data/:robot_id", authenticateToken, async (req, res) => {
  const { robot_id } = req.params;
  const user_id = req.userId;
  const isAdmin = req.isAdmin;

  console.log(`📊 Sensor data request - Robot ID: ${robot_id}, User ID: ${user_id}`);

  if (isNaN(robot_id)) {
    return res.status(400).json({ error: "robot_id ต้องเป็นตัวเลข" });
  }

  try {
    const pgClient = await db.connect();
    try {
      // ตรวจสอบความเป็นเจ้าของหุ่นยนต์
      console.log('🔍 Checking robot ownership...');

      const robotQuery = isAdmin
        ? `SELECT device_id, token FROM robots WHERE id = $1`
        : `SELECT device_id, token FROM robots WHERE id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [robot_id])
        : await pgClient.query(robotQuery, [robot_id, user_id]);

      if (robotResult.rows.length === 0) {
        console.log('❌ Robot not found or not owned by user');
        return res.status(403).json({ error: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }

      const { device_id, token } = robotResult.rows[0];
      console.log(`📱 Device ID: ${device_id}, Token: ${token?.substring(0, 10)}...`);

      if (!device_id || !token) {
        return res.status(400).json({ error: "ข้อมูลหุ่นยนต์ไม่สมบูรณ์" });
      }

      try {
        // เรียก API เพื่อดึงสถานะอุปกรณ์
        console.log('🔍 Fetching device status...');
        const [statusResponse, sensorResponse] = await Promise.all([
          axios.get(`http://iot-server:3000/api/device-status/${device_id}/${token}`),
          axios.get(`http://iot-server:3000/api/sensor-data/${device_id}`)
        ]);

        // ตรวจสอบการตอบกลับจาก API
        if (!statusResponse.data.success) {
          return res.status(404).json({ error: "ไม่พบอุปกรณ์ในระบบ" });
        }

        if (!sensorResponse.data.success) {
          return res.status(404).json({ error: "ยังไม่มีข้อมูล sensor" });
        }

        const statusData = statusResponse.data.data;
        const sensorData = sensorResponse.data.data;

        console.log('✅ Data retrieved successfully');
        return res.json({
          device_id: statusData.device_id,
          battery: sensorData.battery,
          sprayRate: sensorData.sprayRate,
          waterLevel: sensorData.waterLevel,
          pumpStatus: sensorData.pumpStatus,
          timestamp: sensorData.timestamp,
          deviceStatus: statusData.status,
          lastUpdate: statusData.last_update,
        });

      } catch (apiError) {
        console.error("🚨 API call error:", apiError.message);
        
        if (apiError.message.includes('API server not available')) {
          return res.status(503).json({ 
            error: "ระบบข้อมูลไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง" 
          });
        }
        
        if (apiError.message.includes('timeout')) {
          return res.status(503).json({ 
            error: "ระบบตอบสนองช้า กรุณาลองใหม่อีกครั้ง" 
          });
        }

        if (apiError.response?.status === 404) {
          return res.status(404).json({ 
            error: apiError.response.data.message || "ไม่พบข้อมูล" 
          });
        }
        
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
      }
    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("🚨 Database error:", error.message);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// GET /robot/sensor-data/:robot_id/latest10
router.get('/sensor-data/:robot_id/latest10', authenticateToken, async (req, res) => {
  const robotId = parseInt(req.params.robot_id, 10);
  const userId = req.userId;
  const isAdmin = req.isAdmin;

  if (isNaN(robotId)) {
    return res.status(400).json({ error: "robot_id ต้องเป็นตัวเลข" });
  }

  try {
    const pgClient = await db.connect();
    try {
      // ตรวจสอบความเป็นเจ้าของหุ่นยนต์
      const robotQuery = isAdmin
        ? `SELECT device_id, token FROM robots WHERE id = $1`
        : `SELECT device_id, token FROM robots WHERE id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [robotId])
        : await pgClient.query(robotQuery, [robotId, userId]);

      if (robotResult.rows.length === 0) {
        return res.status(403).json({ error: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }

      const { device_id, token } = robotResult.rows[0];

      if (!device_id || !token) {
        return res.status(400).json({ error: "ข้อมูลหุ่นยนต์ไม่สมบูรณ์" });
      }
      const apiUrl = `http://iot-server:3000/api/sensor-data/${device_id}/latest10`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });

      return res.json(response.data);

    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("❌ Error fetching sensor data:", error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({ error: "ไม่พบข้อมูลเซ็นเซอร์จากอุปกรณ์นี้" });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "ไม่สามารถเชื่อมต่อ API MongoDB ได้" });
    }

    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

// /robot/all-robot
router.get("/all-robot", authenticateToken, async (req, res) => {
  console.log("req.userId:", req.userId);
  console.log("req.isAdmin:", req.isAdmin);

  try {
    if (!req.isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const pgClient = await db.connect();
    try {
      // 1. ดึงข้อมูล robots จาก PostgreSQL
      const pgQuery = `
        SELECT r.id, r.user_id, r.robot_name, r.device_id, r.token,
               u.email, u.phone, u.first_name, u.last_name
        FROM robots r
        LEFT JOIN users u ON r.user_id = u.id
      `;
      const pgResult = await pgClient.query(pgQuery);
      const pgRobots = pgResult.rows;

      // 🔁 สร้าง Map ของ robots จาก PostgreSQL โดยใช้ device_id เป็น key
      const pgRobotMap = {};
      pgRobots.forEach(robot => {
        pgRobotMap[robot.device_id] = robot;
      });

      // 2. ดึงข้อมูลสถานะทั้งหมดจาก IoT Server
      const iotRes = await fetch('http://iot-server:3000/api/esp32-status');
      const iotJson = await iotRes.json();

      if (!iotJson.success || !Array.isArray(iotJson.data)) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลจาก IoT Server ได้" });
      }

      const now = new Date();

      // 3. รวมข้อมูลจากทั้งสองแหล่ง
      const robotsWithStatus = iotJson.data.map((status) => {
        const robot = pgRobotMap[status.device_id];
        const lastUpdate = status?.last_update ? new Date(status.last_update) : null;
        const isOnline = lastUpdate ? (now - lastUpdate < 300000) : false;

        return {
          id: robot?.id || null,
          user_id: robot?.user_id || null,
          phone: robot?.phone || null,
          robot_name: robot?.robot_name || null,
          device_id: status.device_id,
          token: robot?.token || null,
          email: robot?.email || null,
          firstName: robot?.first_name || null,
          lastName: robot?.last_name || null,
          isOnline,
          last_update: status?.last_update || null,
          ...status, // ข้อมูลจาก IoT เช่น battery, sprayRate, waterLevel, pumpStatus, etc.
        };
      });

      res.json({ success: true, robots: robotsWithStatus });
    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("ALL-ROBOT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.get('/robot-data/:robot_id/latest', authenticateToken, async (req, res) => {
  const { robot_id } = req.params;
  const user_id = req.userId;
  const isAdmin = req.isAdmin;

  if (isNaN(robot_id)) {
    return res.status(400).json({ error: "robot_id ต้องเป็นตัวเลข" });
  }

  try {
    const pgClient = await db.connect();

    try {
      // ดึง device_id และ token จาก PostgreSQL
      const query = isAdmin
        ? `SELECT device_id, token FROM robots WHERE id = $1`
        : `SELECT device_id, token FROM robots WHERE id = $1 AND user_id = $2`;

      const values = isAdmin ? [robot_id] : [robot_id, user_id];
      const result = await pgClient.query(query, values);

      if (result.rows.length === 0) {
        return res.status(403).json({ error: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }

      const { device_id, token } = result.rows[0];

      if (!device_id || !token) {
        return res.status(400).json({ error: "ข้อมูลหุ่นยนต์ไม่สมบูรณ์" });
      }

      // เรียก API ที่ Mongo (iot-server)
      const apiUrl = `http://iot-server:3000/api/esp32-data/${device_id}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 10000
      });

      return res.json({
        success: true,
        data: response.data.data
      });

    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({ error: "ไม่พบข้อมูลเซ็นเซอร์ล่าสุด" });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "เชื่อมต่อ API ข้อมูลไม่สำเร็จ" });
    }

    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

module.exports = router;