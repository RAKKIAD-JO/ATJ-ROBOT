const express = require("express");
const router = express.Router();
const pool = require("./postgres");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken"); // ติดตั้ง jsonwebtoken ก่อน: npm install jsonwebtoken
const authenticateToken = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const axios = require("axios"); // เพิ่มบนสุดถ้ายังไม่มี
const fs = require('fs');
const util = require('util');
const unlinkAsync = util.promisify(fs.unlink);


// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/profile_Image')); // เปลี่ยนตรงนี้
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.userId + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// ✅ REGISTER USER
router.post("/register", async (req, res) => {
  const { firstName, lastName, passWord, phoneNumber, email } = req.body;
  try {
    const checkEmail = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email นี้มีผู้ใช้แล้ว" });
    }

    const hashedPassword = await bcrypt.hash(passWord, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, phone, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [firstName, lastName, phoneNumber, email, hashedPassword]
    );

    res.status(201).json({
      message: "ลงทะเบียนสำเร็จ",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// ✅ LOGIN USER
router.post("/login", async (req, res) => {
  const { email, passWord } = req.body;
  try {
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(passWord, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await pool.query(
      `INSERT INTO login_history (user_id, is_admin) VALUES ($1, $2)`,
      [user.id, user.is_admin || false]
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.is_admin || false,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ", error: error.message });
  }
});

// ✅ FORGOT PASSWORD - ส่ง OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60000);

    await pool.query(
      `INSERT INTO otp_requests (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [email, otp, expiresAt]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"ATJRobot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "OTP สำหรับรีเซ็ตรหัสผ่าน",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #f2f4f8; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px;">
            <h2 style="color: #2c3e50; margin-bottom: 10px; text-align: center;">รีเซ็ตรหัสผ่านของคุณ</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">คุณได้รับรหัส OTP สำหรับการรีเซ็ตรหัสผ่านบัญชีของคุณ</p>
            <div style="text-align: center; font-size: 36px; font-weight: bold; color: #1a73e8; letter-spacing: 4px; background: #e8f0fe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #555;">รหัสนี้จะหมดอายุใน <strong>1 นาที</strong> นับจากเวลาที่ส่ง</p>
            <p style="font-size: 14px; color: #888;">หากคุณไม่ได้ร้องขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #aaa; text-align: center;">ระบบจัดการสมาชิก • ${new Date().getFullYear()}</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ message: "ส่ง OTP สำเร็จ" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการส่ง OTP" });
  }
});

// ✅ VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM otp_requests 
       WHERE email = $1 AND otp_code = $2 AND verified = false AND expires_at > NOW()`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "OTP ไม่ถูกต้องหรือหมดอายุ" });
    }

    await pool.query(`UPDATE otp_requests SET verified = true WHERE id = $1`, [
      result.rows[0].id,
    ]);

    res.status(200).json({ message: "OTP ถูกต้อง สามารถเปลี่ยนรหัสผ่านได้" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบ OTP" });
  }
});

// ✅ RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const otpVerified = await pool.query(
      `SELECT * FROM otp_requests 
       WHERE email = $1 AND verified = true 
       ORDER BY expires_at DESC LIMIT 1`,
      [email]
    );

    if (otpVerified.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "ยังไม่ได้ยืนยัน OTP หรือหมดอายุแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE email = $2`, [
      hashedPassword,
      email,
    ]);

    res.status(200).json({ message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" });
  }
});

// ✅ GET PROFILE
router.get("/profile", authenticateToken, async (req, res) => {
  const userId = req.userId; // ได้ userId จาก JWT
  console.log("GET /profile - userId:", userId); // ดู userId จาก token
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, phone, email, profile_image FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }
    const user = result.rows[0];
    res.json({
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      email: user.email,
      profileImage: user.profile_image
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// ✅ PUT PROFILE (รับไฟล์)
router.put("/profile", authenticateToken, upload.single('profileImage'), async (req, res) => {
  const userId = req.userId;
  const { fullName, phone, newPassword } = req.body;
  let firstName = "";
  let lastName = "";
  if (fullName) {
    const arr = fullName.split(" ");
    firstName = arr[0] || "";
    lastName = arr.slice(1).join(" ") || "";
  }
  let profileImagePath = req.file ? `/uploads/profile_Image/${req.file.filename}` : undefined;

  console.log('req.file:', req.file);

  try {
    // ถ้ามีไฟล์ใหม่ ให้ลบไฟล์เดิมก่อน
    if (req.file) {
      // ดึง path รูปเดิมจากฐานข้อมูล
      const oldImg = await pool.query(
        `SELECT profile_image FROM users WHERE id = $1`,
        [userId]
      );
      const oldPath = oldImg.rows[0]?.profile_image;
      if (oldPath && oldPath.startsWith('/uploads/profile_Image/')) {
        const fullPath = path.join(__dirname, oldPath);
        // ลบไฟล์เดิม (ถ้ามี)
        if (fs.existsSync(fullPath)) {
          await unlinkAsync(fullPath);
        }
      }
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        `UPDATE users SET first_name = $1, last_name = $2, phone = $3, password = $4, profile_image = $5 WHERE id = $6`,
        [firstName, lastName, phone, hashedPassword, profileImagePath, userId]
      );
    } else if (profileImagePath) {
      await pool.query(
        `UPDATE users SET first_name = $1, last_name = $2, phone = $3, profile_image = $4 WHERE id = $5`,
        [firstName, lastName, phone, profileImagePath, userId]
      );
    } else {
      await pool.query(
        `UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4`,
        [firstName, lastName, phone, userId]
      );
    }
    res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
});

// ✅ ADD TOKER TO USER
router.post("/add-toker", authenticateToken, async (req, res) => {
  const userId = req.userId; // ดึงจาก token
  const { toker } = req.body;

  try {
    // ตรวจสอบกับ MongoDB API
    const response = await axios.get(`http://iot-server:3000/token/${toker}`);
    if (!response.data || response.status !== 200) {
      return res.status(404).json({ error: "Toker not found in MongoDB" });
    }

    // บันทึกลง PostgreSQL
    const result = await pool.query(
      'UPDATE users SET toker = $1 WHERE id = $2 RETURNING *',
      [toker, userId]
    );

    return res.json({ message: "Toker saved", user: result.rows[0] });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Toker not found in MongoDB" });
    }
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ LOGOUT USER
router.post("/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ message: "ออกจากระบบสำเร็จ" });
});

// ให้ express เสิร์ฟไฟล์ static จาก /uploads
router.use('/uploads/profile_Image', express.static(path.join(__dirname, 'uploads/profile_Image')));

module.exports = router;