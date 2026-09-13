"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      } catch (err) {
        console.error("Network or unexpected error:", err);
        if (err instanceof Error) showModal(err.message, "error");
        else showModal("เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
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
    <div className="w-full min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl flex flex-col-reverse md:flex-row overflow-hidden">
        {/* Form Container */}
        <div className="p-8 w-full md:w-1/2 flex flex-col justify-center">
          <h2 className="text-center mb-6 text-2xl font-bold text-[#3583a4]">
            {step === "register" ? "Register" : "Login"}
          </h2>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

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
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
                />
                <input
                  maxLength={10}
                  type="text"
                  name="phoneNumber"
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
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
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
            />
            <input
              type="password"
              name="passWord"
              placeholder="Password"
              value={formData.passWord}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
            />
            {step === "register" && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3583a4] focus:ring-2 focus:ring-[#3583a4]/40"
              />
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[#3583a4] hover:bg-[#60afd0] text-white font-medium rounded-lg text-base transition-colors shadow-md mt-2"
            >
              {step === "register" ? "Register" : "Login"}
            </button>
          </form>

          {step === "login" ? (
            <div className="mt-6 text-center space-y-2 text-sm text-gray-600">
              <p>
                Don’t have an account?{" "}
                <span
                  className="text-[#3583a4] cursor-pointer font-semibold hover:underline"
                  onClick={() => setStep("register")}
                >
                  Register here
                </span>
              </p>
              <p>
                <span
                  className="text-[#3583a4] cursor-pointer font-semibold hover:underline"
                  onClick={() => router.push("/otp")}
                >
                  Forgot password?
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <span
                className="text-[#3583a4] cursor-pointer font-semibold hover:underline"
                onClick={() => setStep("login")}
              >
                Login here
              </span>
            </p>
          )}
        </div>

        {/* Branding Image Container */}
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

        {/* Modal Overlay */}
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
    </div>
  );
}
