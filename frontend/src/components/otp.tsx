"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/otp.css";

export default function OtpPage() {
  const router = useRouter();

  const [otpSent, setOtpSent] = useState(false); // ส่ง OTP แล้วหรือยัง
  const [email, setEmail] = useState(""); // อีเมลสำหรับส่ง OTP
  const [enteredOtp, setEnteredOtp] = useState(""); // OTP ที่ผู้ใช้กรอก
  const [loading, setLoading] = useState(false); // แสดงสถานะ loading

  // 🔶 ส่ง OTP ไปยังอีเมลผ่าน API
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message); // "ส่ง OTP เรียบร้อยแล้ว..."
        setOtpSent(true);
      } else {
        alert(data.message); // เช่น "ไม่พบอีเมลนี้ในระบบ"
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("เกิดข้อผิดพลาดในการส่ง OTP");
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบ OTP ผ่าน API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message); 
        router.push("/reset-password?email=" + encodeURIComponent(email));
      } else {
        alert(data.message); 
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("เกิดข้อผิดพลาดในการตรวจสอบ OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-otp">
      <div className="crad-otp">
        <div className="form-box-otp">
          <h2>{otpSent ? "Enter OTP" : "Forgot Password"}</h2>

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <p>
                <span className="toggle-link" onClick={() => router.push("/login-registers")}>
                  Back to login
                </span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                placeholder="Enter OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
              <p className="toggle-link" onClick={() => router.push("/login-registers")}>
                Back to login
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
