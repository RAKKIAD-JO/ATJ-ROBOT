"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="w-full min-h-screen flex justify-center items-center bg-gray-100 p-4">
      {!otpSent && !otpVerified ? (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-center text-2xl font-bold text-[#3583a4] mb-6">
            Forgot Password
          </h2>
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3583a4] hover:bg-[#60afd0] text-white font-medium rounded-lg text-base transition-colors shadow-md disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <p className="text-center mt-2 text-sm">
              <span
                className="text-[#3583a4] cursor-pointer font-semibold hover:underline"
                onClick={() => router.push("/login-registers")}
              >
                Back to login
              </span>
            </p>
          </form>
        </div>
      ) : !otpVerified ? (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-center text-2xl font-bold text-[#3583a4] mb-6">Enter OTP</h2>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <input
              maxLength={6}
              type="text"
              placeholder="Enter OTP"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm text-center tracking-widest text-lg focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#3583a4] hover:bg-[#60afd0] text-white font-medium rounded-lg text-sm transition-colors shadow-md disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                onClick={handleSendOtp}
              >
                Send Again
              </button>
            </div>
            <p className="text-center mt-2 text-sm">
              <span
                className="text-[#3583a4] cursor-pointer font-semibold hover:underline"
                onClick={() => router.push("/login-registers")}
              >
                Back to login
              </span>
            </p>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl flex flex-col-reverse md:flex-row overflow-hidden">
          <div className="p-8 w-full md:w-1/2 flex flex-col justify-center">
            <h2 className="text-center text-2xl font-bold text-[#3583a4] mb-6">Reset Password</h2>
            <form onSubmit={handlerResetPassword} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                readOnly
                className="w-full p-3 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#3583a4] hover:bg-[#60afd0] text-white font-medium rounded-lg text-base transition-colors shadow-md mt-2 disabled:opacity-60"
              >
                {loading ? "Processing..." : "Reset Password"}
              </button>
            </form>

            <p className="text-center mt-6 text-sm">
              <span
                className="text-[#3583a4] cursor-pointer font-semibold hover:underline"
                onClick={() => router.push("/login-registers")}
              >
                Back to Login
              </span>
            </p>
          </div>

          <div className="w-full md:w-1/2 bg-slate-50 p-8 flex flex-col justify-center items-center border-b md:border-b-0 md:border-l border-gray-100">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#3583a4] text-center mb-6 capitalize">
              welcome ATJ robot
            </h1>
            <img
              src="/logomine1.png"
              alt="Login"
              className="w-48 h-48 md:w-64 md:h-64 object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {modalMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-3xl w-80 text-center relative shadow-2xl animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
              onClick={closeModal}
            >
              ×
            </button>
            <div className="flex justify-center items-center mb-4">
              <span
                className={`material-symbols-outlined text-5xl ${
                  modalType === "success" ? "text-[#17a2b8]" : "text-red-500"
                }`}
              >
                {modalType === "success" ? "check_circle" : "cancel"}
              </span>
            </div>
            <p className="text-gray-700 text-sm mb-6">{modalMessage}</p>
            <button
              className="w-full py-2 bg-[#88b7b9] hover:bg-[#17a2b8] text-white font-medium rounded-xl text-sm transition-colors shadow-md"
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
