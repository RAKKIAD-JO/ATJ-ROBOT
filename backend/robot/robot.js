const express = require("express");
const router = express.Router();
const db = require("../postgres");
const axios = require("axios");
const authenticateToken = require('../middleware/auth');
require('dotenv').config();

const API_SERVER_URL = process.env.IOT_SERVER_URL;

router.post("/connect-robot", authenticateToken, async (req, res) => {
  const user_Id = req.userId;
  const { token, robot_name } = req.body;

  if (!token || !robot_name) {
    return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
  }

  try {
    const response = await axios.get(`${API_SERVER_URL}/api/device/${token}`);

    if (!response.data.success) {
      return res.status(404).json({ success: false, message: "รหัสหุุ่นยนต์ไม่ถููกต้อง" });
    }

    const device_id = response.data.data.device_id;
    const selectQuery = `SELECT * FROM robots WHERE token = $1`;
    const selectResult = await db.query(selectQuery, [token]);

    if (selectResult.rows.length === 0) {
      const insertQuery = `
        INSERT INTO robots (user_id, token, robot_name, device_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const insertResult = await db.query(insertQuery, [user_Id, token, robot_name, device_id]);
      return res.json({
        success: true,
        message: "เชื่อมต่อหุ่นยนต์สำเร็จ",
        user: insertResult.rows[0]
      });
    } else {
      const existing = selectResult.rows[0];
      if (
        existing.robot_name !== robot_name ||
        existing.user_id !== user_Id ||
        existing.device_id !== device_id
      ) {
        const updateQuery = `
          UPDATE robots
          SET robot_name = $1, user_id = $2, device_id = $3
          WHERE token = $4
          RETURNING *
        `;
        const updateResult = await db.query(updateQuery, [robot_name, user_Id, device_id, token]);
        return res.json({ success: true, message: "อัปเดตข้อมูลหุ่นยนต์สำเร็จ", user: updateResult.rows[0] });
      } else {
        return res.json({ success: true, message: "เชื่อมต่อสำเร็จ", user: existing });
      }
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "token ไม่พบในระบบ" });
    }
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});
//ดึงรายการหุ่นยนต์ของผู้ใช้
router.get("/my_robot", authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const pgClient = await db.connect();
    try {
      const query = `SELECT robots_id, robot_name, token, device_id FROM robots WHERE user_id = $1`;
      const result = await pgClient.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.json({ success: true, robots: [] });
      }
      try {
        const robotsWithStatus = result.rows.map(robot => {
          return {
            robot_id: robot.robots_id,
            robot_name: robot.robot_name,
            device_id: robot.device_id,
          };
        });

        return res.json({
          success: true,
          robots: robotsWithStatus
        });

      } catch (error) {
        console.error('API call failed:', error.message);
        return res.json({ success: false, error: "ระบบสถานะไม่พร้อมใช้งาน" });
      }
    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error('Error fetching robots:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});
// GET /robot/sensor-data/:robot_id - ดึงข้อมูล sensor
router.get("/sensor-data/:robot_id", authenticateToken, async (req, res) => {
  const { robot_id } = req.params;
  const user_id = req.userId;
  const isAdmin = req.isAdmin;

  if (isNaN(robot_id)) {
    return res.status(400).json({ success: false, error: "robot_id ต้องเป็นตัวเลข" });
  }

  try {
    const pgClient = await db.connect();
    try {
      const robotQuery = isAdmin
        ? `SELECT device_id, token FROM robots WHERE robots_id = $1`
        : `SELECT device_id, token FROM robots WHERE robots_id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [robot_id])
        : await pgClient.query(robotQuery, [robot_id, user_id]);

      if (robotResult.rows.length === 0) {
        return res.status(403).json({ success: false, error: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }

      const { device_id, token } = robotResult.rows[0];

      if (!device_id || !token) {
        return res.status(400).json({ success: false, error: "ข้อมูลหุ่นยนต์ไม่สมบูรณ์" });
      }
      const [statusResponse, sensorResponse] = await Promise.all([
        axios.get(`${API_SERVER_URL}/api/device-status/${device_id}/${token}`),
        axios.get(`${API_SERVER_URL}/api/sensor-data/${device_id}`)
      ]);

      if (!statusResponse.data.success) {
        return res.status(404).json({ success: false, error: "ไม่พบอุปกรณ์ในระบบ" });
      }

      if (!sensorResponse.data.success) {
        return res.status(404).json({ success: false, error: "ยังไม่มีข้อมูล sensor" });
      }

      const statusData = statusResponse.data.data;
      const sensorData = sensorResponse.data.data;

      return res.json({
        device_id: statusData.device_id,
        battery: sensorData.battery,
        sprayRate: sensorData.sprayRate,
        waterLevel: sensorData.waterLevel,
        totalVolume: sensorData.totalVolume,
        flowRate: sensorData.flowRate,
        pumpStatus: sensorData.pumpStatus,
        timestamp: sensorData.timestamp,
        deviceStatus: statusData.status,
        lastUpdate: statusData.last_update,
      });
    } finally {
      pgClient.release();
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูล" });
    }
    console.error("🚨 Database error:", error.message);
    return res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});
// Home latest 10 data
router.get("/sensor-data/:robot_id/latest10", authenticateToken, async (req, res) => {
  const robotId = parseInt(req.params.robot_id, 10);
  const userId = req.userId;
  const isAdmin = req.isAdmin;


  if (isNaN(robotId)) {
    return res.status(400).json({ success: false, message: "robot_id ต้องเป็นตัวเลข" });
  }

  try {
    const pgClient = await db.connect();
    try {
      const robotQuery = isAdmin
        ? `SELECT device_id, token FROM robots WHERE robots_id = $1`
        : `SELECT device_id, token FROM robots WHERE robots_id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [robotId])
        : await pgClient.query(robotQuery, [robotId, userId]);

      if (robotResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }

      const { device_id, token } = robotResult.rows[0];

      if (!device_id || !token) {
        return res.status(400).json({ success: false, message: "ข้อมูลหุ่นยนต์ไม่สมบูรณ์" });
      }

      const response = await axios.get(`${API_SERVER_URL}/api/sensor-data/${device_id}/latest10`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return res.json(response.data.data);

    } finally {
      pgClient.release();
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: "ไม่พบข้อมูลเซ็นเซอร์จากอุปกรณ์นี้" });
    }
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});
// Admin รายการหุ่นยนต์ทั้งหมด
router.get("/all-robot", authenticateToken, async (req, res) => {
  console.log("req.userId:", req.userId);
  console.log("req.isAdmin:", req.isAdmin);

  try {
    if (!req.isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const pgClient = await db.connect();
    try {
      const pgQuery = `
        SELECT r.robots_id, r.user_id, r.robot_name, r.device_id, r.token,
               u.email, u.phone, u.first_name, u.last_name
        FROM robots r
        LEFT JOIN users u ON r.user_id = u.user_id
      `;
      const pgResult = await pgClient.query(pgQuery);
      const pgRobots = pgResult.rows;

      const pgRobotMap = {};
      pgRobots.forEach(robot => {
        pgRobotMap[robot.device_id] = robot;
      });

      const apiUrl = `${API_SERVER_URL}/api/esp32-status`;
      const iotRes = await axios.get(apiUrl);
      const iotJson = iotRes.data;

      if (!iotJson.success || !Array.isArray(iotJson.data)) {
        return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลจาก IoT Server ได้" });
      }

      const now = new Date();
      const robotsWithStatus = iotJson.data.map((status) => {
        const robot = pgRobotMap[status.device_id];
        const lastUpdate = status?.last_update ? new Date(status.last_update) : null;
        const isOnline = lastUpdate ? (now - lastUpdate < 300000) : false;

        return {
          robot_id: robot?.robots_id || null,
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
          ...status,
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
// home page latest data
router.get('/robot-data/:robot_id/latest', authenticateToken, async (req, res) => {
  const { robot_id } = req.params;
  const user_id = req.userId;
  const isAdmin = req.isAdmin;

  if (isNaN(robot_id)) {
    return res.status(400).json({ success: false, message: "robot_id ต้องเป็นตัวเลข" });
  }

  try {
    const pgClient = await db.connect();
    try {
      const query = isAdmin
        ? `SELECT device_id, token FROM robots WHERE robots_id = $1`
        : `SELECT device_id, token FROM robots WHERE robots_id = $1 AND user_id = $2`;

      const values = isAdmin ? [robot_id] : [robot_id, user_id];
      const result = await pgClient.query(query, values);

      if (result.rows.length === 0) {
        return res.status(403).json({ success: false, message: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }

      const { device_id, token } = result.rows[0];

      if (!device_id || !token) {
        return res.status(400).json({ success: false, message: "ข้อมูลหุ่นยนต์ไม่สมบูรณ์" });
      }

      const response = await axios.get(`${API_SERVER_URL}/api/esp32-data/${device_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      const rawData = response.data.data;

      return res.json({
        success: true,
        data: rawData
      });

    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลเซ็นเซอร์ล่าสุด" });
    }
    return res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});
// Graph liquidType
router.get("/usage-liquidType-Graph", authenticateToken, async (req, res) => {
  const { device_id, startDate, endDate } = req.query;
  const userId = req.userId;
  const isAdmin = req.isAdmin;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: "Missing required parameters" });
  }

  function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  const typeMapping = {
    'น้ำ': 'water',
    'ปุ๋ย': 'fertilizer',
    'สารเคมี': 'pesticide',
  };

  try {
    const pgClient = await db.connect();
    try {
      const robotQuery = isAdmin
        ? `SELECT device_id FROM robots WHERE device_id = $1`
        : `SELECT device_id FROM robots WHERE device_id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [device_id])
        : await pgClient.query(robotQuery, [device_id, userId]);

      if (robotResult.rows.length === 0) {
        return res.status(403).json({ success: false, error: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }
    } finally {
      pgClient.release();
    }

    const mongoRes = await axios.get(`${API_SERVER_URL}/api/spray-logs`, {
      params: { device_id, startDate, endDate }
    });

    const dataLogs = mongoRes.data.data;
    const counts = {};
    const allTypes = ['water', 'fertilizer', 'pesticide'];

    dataLogs.forEach(log => {
      const dateKey = formatDate(log.timestamp);
      if (!counts[dateKey]) counts[dateKey] = { water: 0, fertilizer: 0, pesticide: 0 };

      const typeRaw = log.liquidType || 'unknown';
      const type = typeMapping[typeRaw.toLowerCase()] || 'unknown';

      if (allTypes.includes(type)) {
        counts[dateKey][type] += 1;
      }
    });

    const responseData = Object.entries(counts).map(([date, counts]) => ({
      date,
      water: counts.water,
      fertilizer: counts.fertilizer,
      pesticide: counts.pesticide,
    }));

    res.json({ success: true, data: responseData });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "Failed to fetch robot data" });
    }
    console.error("Error in PostgreSQL API:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});
// Graph liquidType
router.get("/usage-liquidType", authenticateToken, async (req, res) => {
  const { device_id, startDate, endDate } = req.query;
  const userId = req.userId;
  const isAdmin = req.isAdmin;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  try {
    const pgClient = await db.connect();
    try {
      const robotQuery = isAdmin
        ? `SELECT device_id FROM robots WHERE device_id = $1`
        : `SELECT device_id FROM robots WHERE device_id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [device_id])
        : await pgClient.query(robotQuery, [device_id, userId]);

      if (robotResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }
    } finally {
      pgClient.release();
    }

    const mongoRes = await axios.get(`${API_SERVER_URL}/api/usage-history`, {
      params: { device_id, startDate, endDate }
    });

    const usageHistory = mongoRes.data.data?.usageHistory || [];

    const typeMapping = {
      'น้ำ': 'water',
      'ปุ๋ย': 'fertilizer',
      'สารเคมี': 'pesticide',
    };

    const totals = { water: 0, fertilizer: 0, pesticide: 0 };

    usageHistory.forEach(log => {
      const typeRaw = (log.liquidType || '').trim();
      const type = typeMapping[typeRaw] || null;
      const volume = parseFloat(log.totalVolume) || 0;

      if (type && totals.hasOwnProperty(type)) {
        totals[type] += volume;
      }
    });

    res.json({ success: true, totals });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Failed to fetch robot data" });
    }
    console.error("เกิดข้อผิดพลาด :", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});
// History
router.get("/usage-history", authenticateToken, async (req, res) => {
  const { device_id, startDate, endDate } = req.query;
  const userId = req.userId;
  const isAdmin = req.isAdmin;

  if (!device_id || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  try {
    const pgClient = await db.connect();
    try {
      const robotQuery = isAdmin
        ? `SELECT device_id FROM robots WHERE device_id = $1`
        : `SELECT device_id FROM robots WHERE device_id = $1 AND user_id = $2`;

      const robotResult = isAdmin
        ? await pgClient.query(robotQuery, [device_id])
        : await pgClient.query(robotQuery, [device_id, userId]);

      if (robotResult.rows.length === 0) {
        return res.status(403).json({ success: false, message: "คุณไม่ได้เป็นเจ้าของหุ่นยนต์ตัวนี้" });
      }
    } finally {
      pgClient.release();
    }

    const HistoryData = await axios.get(`${API_SERVER_URL}/api/usage-history`, {
      params: { device_id, startDate, endDate }
    });

    const usageHistory = HistoryData.data.data?.usageHistory;

    res.json(
      (usageHistory || []).map(log => ({
        _id: log._id,
        date: log.timestamp,
        plantType: log.plantType,
        liquidType: log.liquidType,
        chemicalName: log.chemicalName,
        area: log.area,
        volume: log.totalVolume || 0,
        duration: log.usageTime || 0,
        other: log.other || "",
      }))
    );

  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: "Failed to fetch robot data" });
    }
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการโหลดข้อมูล" });
  }
});
// History edit
router.put("/edit-History/:id", authenticateToken, async (req, res) => {
  const historyId = req.params.id;
  const updateData = req.body;

  if (!historyId) {
    return res.status(400).json({ success: false, message: "Missing historyId" });
  }
  try {
    const pgClient = await db.connect();

    try {
      const iotResponse = await axios.put(`${API_SERVER_URL}/api/EditData-MongoDB/${historyId}`,
        updateData
      );

      res.json({ success: true, message: iotResponse.data });
    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error.message);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});
// Delete robot Admin
router.delete("/delete-robot/:device_id", authenticateToken, async (req, res) => {
  const { device_id } = req.params;
  const userId = req.userId;
  const isAdmin = req.isAdmin;

  if (!device_id) {
    return res.status(400).json({ success: false, message: "กรุณาระบุ device_id" });
  }

  try {
    const pgClient = await db.connect();
    let deletedRobot = null;

    try {
      const deleteQuery = isAdmin
        ? `DELETE FROM robots WHERE device_id = $1 RETURNING *`
        : `DELETE FROM robots WHERE device_id = $1 AND user_id = $2 RETURNING *`;

      const values = isAdmin ? [device_id] : [device_id, userId];
      const result = await pgClient.query(deleteQuery, values);

      if (result.rows.length > 0) {
        deletedRobot = result.rows[0];
      } else {
        console.error(`ไม่พบหุ่นยนต์ ${device_id} ในระบบหรือคุณไม่มีสิทธิ์ในการลบ`);
      }

      let mongoDeleted = false;

      if (isAdmin) {
        try {
          const deleteMongoRes = await axios.delete(`${API_SERVER_URL}/api/deleteDataRobot/${device_id}`);
          mongoDeleted = deleteMongoRes.data.success;

          if (!mongoDeleted) {
            console.error("ลบข้อมูลที่ IoT server ไม่สำเร็จ:", deleteMongoRes.data.message);
          }
        } catch (mongoErr) {
          console.error("Error calling IoT server:", mongoErr.message);
        }
      }

      if (!deletedRobot && !mongoDeleted) {
        return res.status(404).json({ success: false, message: "ไม่พบหุ่นยนต์ในระบบ" });
      }

      res.json({
        success: true,
        message: "ลบหุ่นยนต์สำเร็จ",
        robot: deletedRobot || { device_id }
      });
    } finally {
      pgClient.release();
    }
  } catch (error) {
    console.error("Error deleting robot:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

module.exports = router;