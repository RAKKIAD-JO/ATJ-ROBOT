"use client"; 

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import "@/styles/login.css";

export default function Home() {
  const router = useRouter(); 
  const [step, setStep] = useState<"login" | "register">("login"); 
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    passWord: '',
  });

  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showModal = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "register" && formData.passWord !== confirmPassword) {
      showModal("❌ รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (step === "register") {
      try {
        const res = await fetch("/api/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        console.log("📦 Response status:", res.status);
        console.log("📨 Response body:", data);

        if (!res.ok) {
          throw new Error(data.message || "Registration failed");
        }

        showModal("ลงทะเบียนสำเร็จ กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ");
        setStep("login"); 

      } catch (error) {
        if (error instanceof Error) {
          showModal("❌ " + error.message);
        } else {
          showModal("❌ Unknown error");
        }
      }
    } else {
      try {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            passWord: formData.passWord
          }),
          credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Login failed:", data.message);
          setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
          return;
        }

        if (!data.user || !data.user.firstName || !data.user.lastName) {
          setError("ข้อมูลผู้ใช้ไม่สมบูรณ์");
          return;
        }
        
        const userWithName = {
          ...data.user,
          name: `${data.user.firstName} ${data.user.lastName}` 
        };

        if (userWithName.isAdmin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/home";
        }

      } catch (error) {
        console.error("Errorlogin:", error);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    }
  };

  return (
    <div className="container-login">
      <div className="crad-login">
        <div className="form-box">
          <h2>{step === "register" ? "Register" : "Login"}</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            {step === "register" && (
              <>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
                <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
              </>
            )}
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input type="password" name="passWord" placeholder="Password" value={formData.passWord} onChange={handleChange} required />
            {step === "register" && (
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            )}
            <button type="submit">{step === "register" ? "Register" : "Login"}</button>
          </form>

          {/* ลิงก์สลับหน้า */}
          {step === "login" && (
            <>
              <p>
                Don’t have an account?{" "}
                <span className="toggle-link" onClick={() => setStep("register")}>Register here</span>
              </p>
              <p>
                <span className="toggle-link" onClick={() => router.push("/otp")}>Forgot password?</span>
              </p>
            </>
          )}
          {step === "register" && (
            <p>
              Already have an account?{" "}
              <span className="toggle-link" onClick={() => setStep("login")}>Login here</span>
            </p>
          )}
        </div>
        <div className="image-box">
          <h1>welcome ATJ robot</h1>
          <img src="/logomine1.png" alt="Login" />
        </div>

        {/* ✅ Modal Component */}
        {modalMessage && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="checkmark-animation">
              <svg viewBox="0 0 52 52" className="checkmark">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14 27l7 7 16-16" />
              </svg>
            </div>
            <p>{modalMessage}</p>
            <button className="modal-ok" onClick={closeModal}>ตกลง</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
