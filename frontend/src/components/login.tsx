"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/styles/login.css";

export default function Home() {
  const router = useRouter();
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
      } catch (err) {
        console.error("Network or unexpected error:", err);
        if (err instanceof Error) showModal(err.message, "error");
        else showModal("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      }
    } else {
      // login
      try {
        const res = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            passWord: formData.passWord,
          }),
          credentials: "include",
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
    <div className="container-login">
      <div className="crad-login">
        <div className="form-box">
          <h2>{step === "register" ? "Register" : "Login"}</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            {step === "register" && (
              <>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
                <input maxLength={10} type="text" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
              </>
            )}
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input type="password" name="passWord" placeholder="Password" value={formData.passWord} onChange={handleChange} required />
            {step === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />}
            <button type="submit">{step === "register" ? "Register" : "Login"}</button>
          </form>

          {step === "login" ? (
            <>
              <p>
                Don’t have an account? <span className="toggle-link" onClick={() => setStep("register")}>Register here</span>
              </p>
              <p>
                <span className="toggle-link" onClick={() => router.push("/otp")}>Forgot password?</span>
              </p>
            </>
          ) : (
            <p>
              Already have an account? <span className="toggle-link" onClick={() => setStep("login")}>Login here</span>
            </p>
          )}
        </div>

        <div className="image-box-login">
          <h1>welcome ATJ robot</h1>
          <img src="/logomine1.png" alt="Login" />
        </div>

        {modalMessage && (
          <div className="modal-overlay">
            <div className="modal-box">
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>

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
              <button className="modal-ok" onClick={closeModal}>
                ตกลง
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
