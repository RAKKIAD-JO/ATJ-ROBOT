"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    passWord: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const showModal = (message: string, type: "success" | "error" = "success") => {
    setModalType(type);
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage(null);
    if (modalType === "success") {
      window.location.reload();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "register" && formData.passWord.length < 8) {
      showModal("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
      return;
    }
    if (step === "register" && formData.passWord !== confirmPassword) {
      showModal("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }

    if (step === "register" && formData.phoneNumber.length !== 10) {
      showModal("หมายเลขโทรศัพท์ต้องมี 10 หลัก", "error");
      return;
    }

    if (step === "register") {
      try {
        const res = await fetch("/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (res.ok) {
          showModal("ลงทะเบียนสำเร็จ กรุณายืนยันอีเมลของคุณ", "success");
          setStep("login");
        } else {
          if (res.status === 409) {
            showModal(data.message || "อีเมลนี้ถูกใช้งานแล้ว", "error");
          } else {
            showModal(data.message || "การลงทะเบียนล้มเหลว", "error");
          }
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการลงทะเบียน", error);
        showModal("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
      }
    } else {
      try {
        const res = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            passWord: formData.passWord,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showModal(data.message || "เข้าสู่ระบบไม่สำเร็จ", "error");
          setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
          return;
        }

        if (!data.user || !data.user.firstName || !data.user.lastName) {
          showModal("ข้อมูลผู้ใช้ไม่สมบูรณ์", "error");
          setError("ข้อมูลผู้ใช้ไม่สมบูรณ์");
          return;
        }

        const userWithName = {
          ...data.user,
          name: `${data.user.firstName} ${data.user.lastName}`,
        };

        if (userWithName.isAdmin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/home";
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", error);
        showModal("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์", "error");
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
      }
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

      <div className="w-full max-w-4xl bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col-reverse md:flex-row overflow-hidden transition-colors duration-300">
        {/* Form Container */}
        <div className="p-8 w-full md:w-1/2 flex flex-col justify-center">
          <h2 className="text-center mb-6 text-2xl font-bold text-[var(--accent)]">
            {step === "register" ? "Register" : "Login"}
          </h2>

          {error && <p className="text-[var(--danger)] text-sm mb-4 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === "register" && (
              <>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                />
                <input
                  maxLength={10}
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
                />
              </>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
            />
            <input
              type="password"
              name="passWord"
              placeholder="Password"
              value={formData.passWord}
              onChange={handleChange}
              required
              className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
            />
            {step === "register" && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 bg-[var(--bg)] border border-[var(--border)] text-[var(--text-hi)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition-all"
              />
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[var(--accent)] hover:opacity-90 text-[#04231F] font-bold rounded-lg text-base transition-colors shadow-md mt-2 cursor-pointer"
            >
              {step === "register" ? "Register" : "Login"}
            </button>
          </form>

          {step === "login" ? (
            <div className="mt-6 text-center space-y-2 text-sm text-[var(--text-mid)]">
              <p>
                Don’t have an account?{" "}
                <span
                  className="text-[var(--accent)] cursor-pointer font-semibold hover:underline"
                  onClick={() => setStep("register")}
                >
                  Register here
                </span>
              </p>
              <p>
                <span
                  className="text-[var(--accent)] cursor-pointer font-semibold hover:underline"
                  onClick={() => router.push("/otp")}
                >
                  Forgot password?
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-[var(--text-mid)]">
              Already have an account?{" "}
              <span
                className="text-[var(--accent)] cursor-pointer font-semibold hover:underline"
                onClick={() => setStep("login")}
              >
                Login here
              </span>
            </p>
          )}
        </div>

        {/* Branding Image Container */}
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

        {/* Modal Overlay */}
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
    </div>
  );
}
