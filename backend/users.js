const { Resend } = require('resend');
const express = require("express");
const router = express.Router();
const pool = require("./postgres");
const bcrypt = require("bcrypt");
//const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const authenticateToken = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const util = require('util');
const unlinkAsync = util.promisify(fs.unlink);
const crypto = require('crypto');
const resendreg = new Resend(process.env.RESEND_API_KEY);
const resendOTP = new Resend(process.env.RESEND_API_KEY_OTP);


// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/profile_Image'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.userId + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });


// REGISTER USER
router.post("/register", async (req, res) => {
  const { firstName, lastName, passWord, phoneNumber, email } = req.body;

  if (!firstName || !lastName || !passWord || !phoneNumber || !email) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const checkEmail = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    if (checkEmail.rows.length === 1) {
      return res.status(400).json({ success: false, message: "Email นี้มีผู้ใช้แล้ว" });
    }

    const hashedPassword = await bcrypt.hash(passWord, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, phone, email, password, is_verified)
       VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
      [firstName, lastName, phoneNumber, email, hashedPassword]
    );

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO email_verifications (email, token) VALUES ($1, $2)`,
      [email, token]
    );

    await resendreg.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
      to: email,
      subject: "ยืนยันอีเมลของคุณ",
      html: `
      <div style="font-family: 'Kanit', sans-serif; background: #f0f4f8; padding: 40px;">
        <div style="max-width: 600px; background: #ffffff; padding: 30px; margin: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://img.icons8.com/color/96/verified-account--v1.png" alt="verify icon" style="width: 60px; margin-bottom: 10px;">
            <h2 style="color: #333333; margin: 0;">ยืนยันอีเมลของคุณ</h2>
          </div>
          <p style="color: #555555; font-size: 16px; text-align: center;">
            ขอบคุณที่สมัครใช้งาน ATJRobot<br>
            กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.atj-robots.online/api/users/verify-email?email=${email}&token=${token}"
              style="display: inline-block; padding: 14px 28px; background-color: #17a2b8; color: white; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 50px; transition: background 0.3s;">
              ยืนยันอีเมล
            </a>
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #888888; text-align: center;">
            หากคุณไม่ได้ทำการสมัคร กรุณาละเว้นอีเมลนี้
          </p>
        </div>
      </div>
    `,
    });

    res.status(201).json({
      success: true,
      message: "ลงทะเบียนสำเร็จ กรุณายืนยันอีเมลของคุณ",
      user: {
        id: result.rows[0].user_id,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        isVerified: result.rows[0].is_verified,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาด" });
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, passWord } = req.body;
  try {
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = userResult.rows[0];
    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" });
    }
    const isMatch = await bcrypt.compare(passWord, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        isAdmin: user.is_admin || false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
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
        user_id: user.user_id,
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
// ส่ง OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: "ไม่พบอีเมลนี้ในระบบ" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000);

    await pool.query(
      `INSERT INTO otp_requests (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [email, otp, expiresAt]
    );

    await resendOTP.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
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
            <p style="font-size: 14px; color: #555;">รหัสนี้จะหมดอายุใน <strong>10 นาที</strong> นับจากเวลาที่ส่ง</p>
            <p style="font-size: 14px; color: #888;">หากคุณไม่ได้ร้องขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #aaa; text-align: center;">ระบบจัดการสมาชิก • ${new Date().getFullYear()}</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "ส่ง OTP สำเร็จ" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการส่ง OTP" });
  }
});
// Click OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM otp_requests WHERE email = $1 AND otp_code = $2 AND verified = false AND expires_at > NOW()`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "OTP ไม่ถูกต้องหรือหมดอายุ" });
    }

    await pool.query(`UPDATE otp_requests SET verified = true WHERE otp_id = $1`, [
      result.rows[0].otp_id,
    ]);

    res.status(200).json({ success: true, message: "OTP ถูกต้อง สามารถเปลี่ยนรหัสผ่านได้" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบ OTP" });
  }
});
// reset Password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const otpResetPassword = await pool.query(
      `SELECT * FROM otp_requests WHERE email = $1 AND verified = true 
       ORDER BY expires_at DESC LIMIT 1`,
      [email]
    );

    if (otpResetPassword.rows.length === 0) {
      return res.status(400).json({ success: false, message: "ยังไม่ได้ยืนยัน OTP หรือหมดอายุแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE email = $2`, [
      hashedPassword,
      email,
    ]);

    await pool.query(`DELETE FROM otp_requests WHERE email = $1`, [email]);

    res.status(200).json({ success: true, message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" });
  }
});
// profile
router.get("/profile", authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    const result = await pool.query(
      `SELECT user_id, first_name, last_name, phone, email, profile_image ,is_admin FROM users WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }
    const user = result.rows[0];
    res.json({
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      email: user.email,
      profileImage: user.profile_image,
      isAdmin: user.is_admin
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาด" });
  }
});
// editProfile
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

  try {
    if (req.file) {
      const oldImg = await pool.query(
        `SELECT profile_image FROM users WHERE user_id = $1`,
        [userId]
      );
      const oldPath = oldImg.rows[0]?.profile_image;
      if (oldPath && oldPath.startsWith('/uploads/profile_Image/')) {
        const fullPath = path.join(__dirname, oldPath);
        if (fs.existsSync(fullPath)) {
          await unlinkAsync(fullPath);
        }
      }
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (firstName !== undefined && firstName !== "") {
      fields.push(`first_name = $${idx++}`);
      params.push(firstName);
    }
    if (lastName !== undefined && lastName !== "") {
      fields.push(`last_name = $${idx++}`);
      params.push(lastName);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      params.push(phone);
    }
    if (profileImagePath !== undefined) {
      fields.push(`profile_image = $${idx++}`);
      params.push(profileImagePath);
    }
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      fields.push(`password = $${idx++}`);
      params.push(hashedPassword);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "ไม่มีข้อมูลที่ต้องการอัปเดต" });
    }

    params.push(userId);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE user_id = $${idx}`;
    await pool.query(sql, params);

    res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("EDIT PROFILE ERROR:", error);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" });
  }
});
// ยืนยัน email
router.get("/verify-email", async (req, res) => {
  const { email, token } = req.query;

  if (!email || !token) {
    return res.send(`
    <div style="font-family: 'Kanit', sans-serif; padding: 40px;">
      <div style="max-width: 600px; background: #ffffff; padding: 30px; margin: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
        <img src="https://img.icons8.com/fluency/96/error.png" alt="Error Icon" style="width: 60px; margin-bottom: 20px;" />
        <h2 style="color: #e74c3c; margin-bottom: 10px;">ลิงก์ไม่ถูกต้อง</h2>
        <p style="color: #555555; font-size: 16px;">กรุณาตรวจสอบลิงก์อีกครั้ง หรือลงทะเบียนใหม่</p>
      </div>
    </div>
    `);
  }

  try {
    const result = await pool.query(
      `SELECT * FROM email_verifications WHERE email = $1 AND token = $2`,
      [email, token]
    );

    const record = result.rows[0];

    if (!record) {
      return res.send(`
        <div style="font-family: 'Kanit', sans-serif; padding: 40px;">
          <div style="max-width: 600px; background: #ffffff; padding: 30px; margin: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
            <img src="https://img.icons8.com/color/96/cancel--v1.png" alt="Not Found Icon" style="width: 60px; margin-bottom: 20px;" />
            <h2 style="color: #e67e22; margin-bottom: 10px;">ไม่พบข้อมูลการยืนยัน</h2>
            <p style="color: #555555; font-size: 16px;">ลิงก์ไม่ถูกต้อง หรือคุณได้ยืนยันอีเมลไปแล้ว</p>
          </div>
        </div>
      `);
    }

    await pool.query(`UPDATE users SET is_verified = true WHERE email = $1`, [
      email,
    ]);

    await pool.query(`DELETE FROM email_verifications WHERE email = $1`, [
      email,
    ]);

    return res.send(`
      <div style="font-family: 'Kanit', sans-serif; padding: 40px;">
        <div style="max-width: 600px; background: #ffffff; padding: 30px; margin: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
          <img src="https://img.icons8.com/color/96/verified-account--v1.png" alt="Verified Icon" style="width: 60px; margin-bottom: 20px;" />
          <h2 style="color: #2c3e50; margin-bottom: 10px;">ยืนยันอีเมลสำเร็จ!</h2>
          <p style="color: #555555; font-size: 16px;">ขอบคุณที่ยืนยันอีเมลของคุณ<br>คุณสามารถใช้งานระบบได้ทันที</p>
        </div>
      </div>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send(`<h2>เกิดข้อผิดพลาด</h2><p>กรุณาลองใหม่ภายหลัง</p>`);
    res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
});

// logout
router.post("/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ message: "ออกจากระบบสำเร็จ" });
});

router.use('/uploads/profile_Image', express.static(path.join(__dirname, 'uploads/profile_Image')));
module.exports = router;