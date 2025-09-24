"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/otp.css";

export default function OtpPage() {
  const router = useRouter();

  const [otpSent, setOtpSent] = useState(false); 
  const [otpVerified, setOtpVerified] = useState(false);
  const [email, setEmail] = useState(""); 
  const [enteredOtp, setEnteredOtp] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showModal = (message: string, type: "success" | "error" = "success") => {
    setModalMessage(message);
    setModalType(type);
  };

  const closeModal = () => {
    setModalMessage(null);
  };
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        showModal(data.message, "success");
        setOtpSent(true);
      } else if (!res.ok) {
        showModal(data.message, "error");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      showModal("เกิดข้อผิดพลาดในการส่ง OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpVerified(true);
        showModal("ยืนยัน OTP สำเร็จ!", "success");
      } else {
        showModal(data.message || "OTP ไม่ถูกต้อง", "error");
      }
    } catch {
      showModal("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้","error");
    } finally {
      setLoading(false);
    }
  };

  const handlerResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showModal("รหัสผ่านไม่ตรงกัน", 'error');
      return;
    }
    if (!email) {
      showModal("ไม่พบอีเมล", 'error');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        showModal("รีเซ็ตรหัสผ่านสำเร็จ!", 'success');
        router.push("/login-registers");
      } else {
        showModal(data.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      showModal("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-otp">
      {!otpSent && !otpVerified ? (
        <div className="crad-otp">
          <div className="form-box-otp">
            <h2>{otpSent ? "Enter OTP" : "Forgot Password"}</h2>
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
          </div>
        </div>
      ) : !otpVerified ? (
        <div className="crad-otp">
          <div className="form-box-otp">
            <h2>Enter OTP</h2>
            <form onSubmit={handleVerifyOtp}>
              <input maxLength={6}
                type="text"
                placeholder="Enter OTP"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                required
              />
              <div className="button">
                <button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify"}
                </button>
                <button className="sendOTP-again" onClick={handleSendOtp}>Send Again</button>
              </div>
              <p className="toggle-link" onClick={() => router.push("/login-registers")}>
                Back to login
              </p>
            </form>
          </div>
        </div>
      ) : (
        <div className="reset-password-container">
          <div className="crad-reset-password">
            <div className="form-box-reset-password">
              <h2>Reset Password</h2>
              <form onSubmit={handlerResetPassword}>
                <input type="email" placeholder="Email" value={email} readOnly />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? "..." : "Reset Password"}
                </button>
              </form>

              <p className="toggle-link" onClick={() => router.push("/login-registers")}>
                Back to Login
              </p>
            </div>
            <div className="image-box">
              <h1>welcome ATJ robot</h1>
              <img src="/logomine1.png" alt="Login" />
            </div>
          </div>
        </div>
      )}

      {/* </div> */}
      {modalMessage && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close" onClick={closeModal}>×</button>
            {modalType === "success" ? (
              <div className="checkmark-animation">
                <svg viewBox="0 0 52 52" className="checkmark">
                  <circle className="checkmark-circle-ok" cx="26" cy="26" r="25" fill="none" />
                  <path className="checkmark-check-ok" fill="none" d="M14 27l7 7 16-16" />
                </svg>
              </div>
            ) : (
              <div className="crossmark-animation">
                <svg viewBox="0 0 52 52" className="crossmark">
                  <circle className="crossmark-circle-error" cx="26" cy="26" r="25" fill="none" />
                  <path className="crossmark-line1" d="M16 16 L36 36" />
                  <path className="crossmark-line2" d="M36 16 L16 36" />
                </svg>
              </div>
            )}
            <p>{modalMessage}</p>
            <button className="modal-ok" onClick={closeModal}>ตกลง</button>
          </div>
        </div>
      )}
    </div>
  );
}
