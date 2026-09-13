"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/app/contexts/ThemeContext";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  farmName: string;
  role: string;
  profileImage: string;
  isAdmin: boolean;
}

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    farmName: "ฟาร์มเกษตรอัจฉริยะ ATJ",
    role: "เกษตรกร",
    profileImage: "",
    isAdmin: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Password fields
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Alert settings
  const [lowBatteryAlert, setLowBatteryAlert] = useState(true);
  const [lowWaterAlert, setLowWaterAlert] = useState(true);
  const [dailyReportAlert, setDailyReportAlert] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ message: string; isError?: boolean } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    fetch("/api/users/profile", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfile({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            farmName: data.farmName || "ฟาร์มเกษตรอัจฉริยะ ATJ",
            role: data.isAdmin ? "ผู้ดูแลระบบฟาร์ม" : "เกษตรกร",
            profileImage: data.profileImage || "",
            isAdmin: data.isAdmin || false,
          });
        }
      })
      .catch((err) => {
        console.error("Profile load error:", err);
      });
  };

  useEffect(() => {
    const savedAlerts = localStorage.getItem("atj_alert_settings");
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        if (typeof parsed.lowBattery === "boolean") setLowBatteryAlert(parsed.lowBattery);
        if (typeof parsed.lowWater === "boolean") setLowWaterAlert(parsed.lowWater);
        if (typeof parsed.dailyReport === "boolean") setDailyReportAlert(parsed.dailyReport);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStatusMsg({ message: "ขนาดไฟล์ต้องไม่เกิน 5MB", isError: true });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Save alert settings
    localStorage.setItem(
      "atj_alert_settings",
      JSON.stringify({
        lowBattery: lowBatteryAlert,
        lowWater: lowWaterAlert,
        dailyReport: dailyReportAlert,
      })
    );

    // Validate passwords if changing
    if (showPasswordChange || newPassword || oldPassword) {
      if (!newPassword || newPassword.length < 8) {
        setStatusMsg({ message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร", isError: true });
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatusMsg({ message: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน", isError: true });
        setLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("phone", profile.phone);

      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }
      if (oldPassword) {
        formData.append("oldPassword", oldPassword);
      }
      if (newPassword) {
        formData.append("newPassword", newPassword);
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && (data.success !== false)) {
        setStatusMsg({ message: "✓ บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว" });
        if (data.user) {
          setProfile((prev) => ({
            ...prev,
            firstName: data.user.firstName || prev.firstName,
            lastName: data.user.lastName || prev.lastName,
            phone: data.user.phone || prev.phone,
            profileImage: data.user.profileImage || prev.profileImage,
          }));
        }
        // Reset password inputs & file state
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(false);
        setSelectedFile(null);
        setImagePreview(null);

        // Notify other components (Sidebar, Topbar)
        window.dispatchEvent(new Event("userChanged"));
      } else {
        setStatusMsg({ message: data.message || data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", isError: true });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setSendingEmail(true);
    setEmailStatus({ message: `กำลังส่งอีเมลทดสอบไปยัง ${profile.email}...` });
    try {
      const res = await fetch("/api/users/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailStatus({ message: data.message || `✓ ส่งอีเมลทดสอบสำเร็จไปยัง ${profile.email}` });
      } else {
        setEmailStatus({ message: data.error || "เกิดข้อผิดพลาดในการส่งอีเมล", isError: true });
      }
    } catch (e) {
      console.error(e);
      setEmailStatus({ message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อส่งอีเมลได้", isError: true });
    } finally {
      setSendingEmail(false);
    }
  };

  const initials = profile.firstName ? profile.firstName.substring(0, 2) : "รศ";
  const displayImage = imagePreview || profile.profileImage;

  return (
    <main className="content">
      <form onSubmit={handleSave} className="profile-grid">
        {/* Left Profile Summary Card */}
        <div className="panel profile-card">
          <div className="flex flex-col items-center">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--accent)] shadow-md mb-3"
              />
            ) : (
              <div className="profile-avatar mb-3">{initials}</div>
            )}

            <div className="profile-name text-center font-bold text-lg text-[var(--text-hi)]">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="profile-role text-xs text-[var(--text-low)] mb-4">{profile.role}</div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            <button
              type="button"
              className="btn secondary text-xs w-full justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 เปลี่ยนรูปโปรไฟล์
            </button>
            {selectedFile && (
              <div className="text-[11px] text-[var(--accent)] mt-1 font-medium">
                เลือกไฟล์แล้ว: {selectedFile.name}
              </div>
            )}
          </div>

          <div className="divider my-4"></div>

          <div className="info-row flex justify-between py-1 text-xs">
            <span className="k text-[var(--text-low)]">สถานะบัญชี</span>
            <span className="v text-[var(--good)] font-semibold">✓ ยืนยันตัวตนแล้ว</span>
          </div>
          <div className="info-row flex justify-between py-1 text-xs">
            <span className="k text-[var(--text-low)]">ประเภทผู้ใช้</span>
            <span className="v text-[var(--text-hi)] font-medium">
              {profile.isAdmin ? "ผู้ดูแลระบบ (Admin)" : "ผู้ใช้งานทั่วไป"}
            </span>
          </div>
        </div>

        {/* Right Form Section */}
        <div>
          {/* Section 1: Personal Details */}
          <div className="panel form-section mb-4">
            <div className="section-title text-base font-bold text-[var(--text-hi)] mb-4 flex items-center justify-between">
              <span>ข้อมูลส่วนตัว</span>
              {statusMsg && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    statusMsg.isError
                      ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                      : "bg-[var(--good-soft)] text-[var(--good)]"
                  }`}
                >
                  {statusMsg.message}
                </span>
              )}
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="field">
                <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">ชื่อ</label>
                <input
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="field">
                <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">นามสกุล</label>
                <input
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="field">
                <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">อีเมล (ไม่สามารถเปลี่ยนได้)</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-low)] text-sm cursor-not-allowed opacity-80"
                />
              </div>
              <div className="field">
                <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="form-row grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field">
                <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">ชื่อฟาร์ม / หน่วยงาน</label>
                <input
                  type="text"
                  value={profile.farmName}
                  onChange={(e) => setProfile({ ...profile, farmName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="field">
                <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">เขตเวลา</label>
                <select className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]">
                  <option>(GMT+7) กรุงเทพฯ (Asia/Bangkok)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Change Password Accordion */}
          <div className="panel form-section mb-4">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              <div>
                <div className="section-title text-base font-bold text-[var(--text-hi)]">
                  🔒 เปลี่ยนรหัสผ่าน (Security)
                </div>
                <div className="text-xs text-[var(--text-low)] mt-0.5">
                  เปลี่ยนรหัสผ่านเพื่อความปลอดภัยของบัญชีผู้ใช้
                </div>
              </div>
              <span className="text-sm font-semibold text-[var(--accent)] hover:underline">
                {showPasswordChange ? "ยกเลิกการเปลี่ยนรหัสผ่าน" : "เปลี่ยนรหัสผ่าน"}
              </span>
            </div>

            {showPasswordChange && (
              <div className="mt-4 pt-4 border-t border-[var(--border-soft)] space-y-4">
                <div className="field">
                  <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">รหัสผ่านปัจจุบัน</label>
                  <input
                    type="password"
                    placeholder="ป้อนรหัสผ่านเดิม"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="field">
                    <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</label>
                    <input
                      type="password"
                      placeholder="ป้อนรหัสผ่านใหม่"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="field">
                    <label className="block text-xs font-semibold text-[var(--text-mid)] mb-1">ยืนยันรหัสผ่านใหม่</label>
                    <input
                      type="password"
                      placeholder="ป้อนรหัสผ่านใหม่อีกครั้ง"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Appearance & Notifications */}
          <div className="panel form-section">
            <div className="section-title text-base font-bold text-[var(--text-hi)] mb-1">
              การแสดงผลและแจ้งเตือน
            </div>
            <div className="text-xs text-[var(--text-low)] mb-4">
              ปรับแต่งธีมการแสดงผลและเลือกช่องทางรับการแจ้งเตือน
            </div>

            {/* Dark / Light Theme Switch */}
            <div className="switch-row flex items-center justify-between py-2 border-b border-[var(--border-soft)]">
              <div className="switch-copy">
                <div className="sr-title text-sm font-semibold text-[var(--text-hi)]">โหมดการแสดงผล (Theme)</div>
                <div className="sr-sub text-xs text-[var(--text-low)]">
                  {theme === "dark" ? "โหมดมืด (Dark Mode) สบายตาในที่มืด" : "โหมดสว่าง (Light Mode) สำหรับใช้งานกลางแจ้ง"}
                </div>
              </div>
              <div
                className={`switch ${theme === "dark" ? "on" : ""}`}
                onClick={toggleTheme}
                title="สลับโหมดมืด/สว่าง"
              ></div>
            </div>

            {/* Switch 1: Low Battery */}
            <div className="switch-row flex items-center justify-between py-2 border-b border-[var(--border-soft)]">
              <div className="switch-copy">
                <div className="sr-title text-sm font-semibold text-[var(--text-hi)]">แจ้งเตือนแบตเตอรี่ต่ำ</div>
                <div className="sr-sub text-xs text-[var(--text-low)]">แจ้งเมื่อแบตเตอรี่ต่ำกว่า 20%</div>
              </div>
              <div
                className={`switch ${lowBatteryAlert ? "on" : ""}`}
                onClick={() => setLowBatteryAlert(!lowBatteryAlert)}
              ></div>
            </div>

            {/* Switch 2: Low Water */}
            <div className="switch-row flex items-center justify-between py-2 border-b border-[var(--border-soft)]">
              <div className="switch-copy">
                <div className="sr-title text-sm font-semibold text-[var(--text-hi)]">แจ้งเตือนน้ำ/สารเคมีใกล้หมด</div>
                <div className="sr-sub text-xs text-[var(--text-low)]">แจ้งเมื่อระดับของเหลวต่ำกว่า 15%</div>
              </div>
              <div
                className={`switch ${lowWaterAlert ? "on" : ""}`}
                onClick={() => setLowWaterAlert(!lowWaterAlert)}
              ></div>
            </div>

            {/* Switch 3: Daily Summary */}
            <div className="switch-row flex items-center justify-between py-2">
              <div className="switch-copy">
                <div className="sr-title text-sm font-semibold text-[var(--text-hi)]">สรุปผลประจำวันทางอีเมล</div>
                <div className="sr-sub text-xs text-[var(--text-low)]">
                  ส่งสรุปการทำงานทุกวันเวลา 18:00 ไปยัง {profile.email || "อีเมลของคุณ"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn secondary text-xs py-1 px-3"
                  onClick={handleTestEmail}
                  disabled={sendingEmail}
                  title="ทดสอบส่งอีเมลรายงานเข้าอีเมลนี้ตอนนี้"
                >
                  {sendingEmail ? "กำลังส่ง..." : "📧 ทดสอบส่งอีเมล"}
                </button>
                <div
                  className={`switch ${dailyReportAlert ? "on" : ""}`}
                  onClick={() => setDailyReportAlert(!dailyReportAlert)}
                ></div>
              </div>
            </div>

            {emailStatus && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 ${
                  emailStatus.isError
                    ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                    : "bg-[var(--good-soft)] text-[var(--good)]"
                }`}
              >
                <span>{emailStatus.message}</span>
                <button
                  type="button"
                  className="text-xs opacity-75 hover:opacity-100"
                  onClick={() => setEmailStatus(null)}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="form-actions mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn secondary"
                onClick={fetchProfile}
                disabled={loading}
              >
                รีเซ็ต
              </button>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}