const express = require('express');
const router = express.Router();
const pool = require('./postgres');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

const IOT_SERVER_URL = process.env.IOT_SERVER_URL || 'http://localhost:3000';

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุคำถาม (message)' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({ 
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน backend/.env' 
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. ดึงข้อมูลจาก PostgreSQL (Postgres DB)
    let postgresData = [];
    try {
      const robotsResult = await pool.query('SELECT robots_id, robot_name, device_id, user_id FROM robots');
      postgresData = robotsResult.rows;
    } catch (pgErr) {
      console.error('PostgreSQL Fetch Error:', pgErr.message);
    }

    // 2. ดึงข้อมูลจาก IoT Server / MongoDB
    let iotData = [];
    try {
      const iotResponse = await axios.get(`${IOT_SERVER_URL}/robot-iot-api/esp32-status`, { timeout: 3000 });
      if (iotResponse.data && iotResponse.data.success) {
        iotData = iotResponse.data.data;
      }
    } catch (iotErr) {
      console.error('IoT Server Fetch Error:', iotErr.message);
    }

    // 3. รวมเป็น Context
    const systemContext = `
คุณคือ "ATJ BOT" ผู้ช่วยอัจฉริยะประจำระบบควบคุมหุ่นยนต์ ATJ Robot
ให้ตอบคำถามผู้ใช้โดยอ้างอิงจากข้อมูลล่าสุดในระบบต่อไปนี้:

[ข้อมูลรายการหุ่นยนต์ที่ลงทะเบียนในระบบ (PostgreSQL Database)]:
${JSON.stringify(postgresData, null, 2)}

[ข้อมูลสถานะออนไลน์/ออฟไลน์และอุปกรณ์ IoT (MongoDB / IoT Server)]:
${JSON.stringify(iotData, null, 2)}

ข้อแนะนำในการตอบ:
1. ตอบเป็นภาษาไทยอย่างสุภาพ เป็นกันเอง กระชับ และชัดเจน
2. หากผู้ใช้ถามถึงหุ่นยนต์, สถานะเครื่อง หรือข้อมูลในระบบ ให้ใช้ข้อมูลข้างต้นในการตอบ
3. หากคำถามไม่เกี่ยวข้องกับข้อมูลที่มี หรือไม่พบข้อมูลในระบบ ให้ตอบตามความเป็นจริงอย่างสุภาพ
`;

    // 4. เรียกใช้งาน Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        { role: 'user', parts: [{ text: systemContext + `\n\nคำถามจากผู้ใช้: ${message}` }] }
      ]
    });

    const replyText = response.text || 'ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้';
    res.json({ reply: replyText });

  } catch (error) {
    console.error('Chatbot Controller Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลคำตอบ AI' });
  }
});

module.exports = router;
