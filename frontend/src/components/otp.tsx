"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function OtpPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

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
      } else {
        showModal(data.message, "error");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      showModal("เกิดข้อผิดพลาดในการส่ง OTP", "error");
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
      showModal("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlerResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showModal("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }
    if (!email) {
      showModal("ไม่พบอีเมล", "error");
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
        showModal("รีเซ็ตรหัสผ่านสำเร็จ!", "success");
        router.push("/login-registers");
      } else {
        showModal(data.message || "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน", "error");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      showModal("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-[var(--bg)] text-[var(--text-hi)] p-4 relative transition-colors duration-300">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-8 z-10">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--text-hi)] hover:bg-[var(--panel-raised)] transition-all shadow-md flex items-center justify-center cursor-pointer"
          title={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <svg className="w-5 h-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="1.8" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>

      {!otpSent && !otpVerified ? (
        <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 transition-colors duration-300">
          <h2 className="text-center text-2xl font-bold text-[var(--accent)] mb-6">
            Forgot Password
          </h2>
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--accent)] hover:opacity-90 text-[#04231F] font-bold rounded-lg text-base transition-colors shadow-md disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <p className="text-center mt-2 text-sm text-[var(--text-mid)]">
              <span
                className="text-[var(--accent)] cursor-pointer font-semibold hover:underline"
                onClick={() => router.push("/login-registers")}
              >
                Back to login
              </span>
            </p>
          </form>
        </div>
      ) : !otpVerified ? (
        <div className="w-full max-w-md bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 transition-colors duration-300">
          <h2 className="text-center text-2xl font-bold text-[var(--accent)] mb-6">Enter OTP</h2>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              maxLength={6}
              type="text"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              required
              className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-center tracking-widest text-lg focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[var(--accent)] hover:opacity-90 text-[#04231F] font-bold rounded-lg text-sm transition-colors shadow-md disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                className="px-4 py-3 bg-[var(--panel-raised)] text-[var(--text-hi)] hover:opacity-80 font-medium rounded-lg text-sm transition-colors cursor-pointer"
                onClick={handleSendOtp}
              >
                Send Again
              </button>
            </div>
            <p className="text-center mt-2 text-sm text-[var(--text-mid)]">
              <span
                className="text-[var(--accent)] cursor-pointer font-semibold hover:underline"
                onClick={() => router.push("/login-registers")}
              >
                Back to login
              </span>
            </p>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col-reverse md:flex-row overflow-hidden transition-colors duration-300">
          <div className="p-8 w-full md:w-1/2 flex flex-col justify-center">
            <h2 className="text-center text-2xl font-bold text-[var(--accent)] mb-6">Reset Password</h2>
            <form onSubmit={handlerResetPassword} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                readOnly
                className="w-full p-3 border border-[var(--border)] bg-[var(--bg)] rounded-lg text-sm text-[var(--text-low)] cursor-not-allowed"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[var(--accent)] hover:opacity-90 text-[#04231F] font-bold rounded-lg text-base transition-colors shadow-md mt-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Processing..." : "Reset Password"}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-[var(--text-mid)]">
              <span
                className="text-[var(--accent)] cursor-pointer font-semibold hover:underline"
                onClick={() => router.push("/login-registers")}
              >
                Back to Login
              </span>
            </p>
          </div>

          <div className="w-full md:w-1/2 bg-[var(--panel-alt)] p-8 flex flex-col justify-center items-center border-b md:border-b-0 md:border-l border-[var(--border)]">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-hi)] text-center mb-6 capitalize tracking-tight">
              welcome ATJ robot
            </h1>
            <img
              src="/logomine1.png"
              alt="Login"
              className="w-48 h-48 md:w-64 md:h-64 object-contain rounded-xl drop-shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-[var(--panel)] border border-[var(--border)] p-8 rounded-3xl w-80 text-center relative shadow-2xl animate-fade-in">
            <button
              className="absolute top-4 right-4 text-[var(--text-mid)] hover:text-[var(--danger)] text-2xl font-bold transition-colors cursor-pointer"
              onClick={closeModal}
            >
              ×
            </button>
            <div className="flex justify-center items-center mb-4">
              <span
                className={`material-symbols-outlined text-5xl ${
                  modalType === "success" ? "text-[var(--good)]" : "text-[var(--danger)]"
                }`}
              >
                {modalType === "success" ? "check_circle" : "cancel"}
              </span>
            </div>
            <p className="text-[var(--text-hi)] text-sm mb-6">{modalMessage}</p>
            <button
              className="w-full py-2 bg-[var(--accent)] hover:opacity-90 text-[#04231F] font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
              onClick={closeModal}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
