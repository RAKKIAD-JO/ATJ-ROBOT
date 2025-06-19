"use client"; // ใช้ client-side rendering

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import "@/styles/login.css";

export default function Home() {
  const router = useRouter(); // ใช้สำหรับเปลี่ยนหน้า
  const [step, setStep] = useState<"login" | "register">("login"); // login/register toggle
  const [error, setError] = useState('');
  // เก็บข้อมูลของฟอร์ม
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    passWord: '',
  });

  const [confirmPassword, setConfirmPassword] = useState(''); // สำหรับ confirm password

  // เมื่อกรอก input ใด ๆ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // เมื่อกดปุ่ม Login/Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "register" && formData.passWord !== confirmPassword) {
      alert("Passwords do not match!");
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

        alert("Register success ✅");
        setStep("login"); // เปลี่ยนกลับไป login หลังสมัครเสร็จ

      } catch (error) {
        if (error instanceof Error) {
          alert("❌ " + error.message);
        } else {
          alert("❌ Unknown error");
        }
      }
    } else {
      // เชื่อม API Login จริง
      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            passWord: formData.passWord, // ต้องใช้ชื่อ field ว่า passWord ให้ตรง backend
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          // เพิ่ม console.log เพื่อดูค่า token
          console.log("Login successful, token:", data.token);
          localStorage.setItem('token', data.token);
          
          // redirect ไปหน้า settings หรือหน้าอื่นๆ
          router.push('/home');
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
      </div>
    </div>
  );
}
