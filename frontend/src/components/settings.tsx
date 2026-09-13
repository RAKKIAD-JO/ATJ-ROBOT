"use client";

import { useEffect, useState } from "react";
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
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "รักเกียรติ",
    lastName: "โพธิ์ศรี",
    email: "rakkiat.p@atjfarm.co.th",
    phone: "081-234-5678",
    farmName: "ฟาร์มข้าวโพด ริมห้วย",
    role: "ผู้ดูแลระบบฟาร์ม",
    profileImage: "",
    isAdmin: false,
  });
  const [lowBatteryAlert, setLowBatteryAlert] = useState(true);
  const [lowWaterAlert, setLowWaterAlert] = useState(true);
  const [dailyReportAlert, setDailyReportAlert] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetch("/api/users/profile", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.email) {
          setProfile((prev) => ({
            ...prev,
            firstName: data.firstName || prev.firstName,
            lastName: data.lastName || prev.lastName,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            farmName: data.farmName || prev.farmName,
            role: data.isAdmin ? "ผู้ดูแลระบบฟาร์ม" : "เกษตรกร",
            profileImage: data.profileImage || "",
            isAdmin: data.isAdmin || false,
          }));
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSave = () => {
    localStorage.setItem(
      "atj_alert_settings",
      JSON.stringify({
        lowBattery: lowBatteryAlert,
        lowWater: lowWaterAlert,
        dailyReport: dailyReportAlert,
      })
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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

  return (
    <main className="content">
      <div className="profile-grid">
        {/* Left Profile Summary Card */}
        <div className="panel profile-card">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-name">
            {profile.firstName} {profile.lastName}
          </div>
          <div className="profile-role">{profile.role}</div>
          <button className="btn secondary" style={{ width: "100%", justifyContent: "center" }}>
            เปลี่ยนรูปโปรไฟล์
          </button>
          <div className="divider"></div>
          <div className="info-row">
            <span className="k">หุ่นยนต์ในความดูแล</span>
            <span className="v">2 เครื่อง</span>
          </div>
          <div className="info-row">
            <span className="k">เข้าสู่ระบบล่าสุด</span>
            <span className="v num">13/09/2569 00:52</span>
          </div>
        </div>

        {/* Right Form Section */}
        <div>
          {/* Section 1: Personal Details */}
          <div className="panel form-section" style={{ marginBottom: "16px" }}>
            <div className="section-title" style={{ marginBottom: "16px" }}>
              ข้อมูลส่วนตัว
            </div>
            <div className="form-row">
              <div className="field">
                <label>ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  value={`${profile.firstName} ${profile.lastName}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(" ");
                    setProfile({ ...profile, firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" });
                  }}
                />
              </div>
              <div className="field">
                <label>ตำแหน่ง</label>
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>อีเมล</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>ชื่อฟาร์ม / หน่วยงาน</label>
                <input
                  type="text"
                  value={profile.farmName}
                  onChange={(e) => setProfile({ ...profile, farmName: e.target.value })}
                />
              </div>
              <div className="field">
                <label>เขตเวลา</label>
                <select>
                  <option>(GMT+7) กรุงเทพฯ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Appearance & Notifications */}
          <div className="panel form-section">
            <div className="section-title" style={{ marginBottom: "4px" }}>
              การแสดงผลและแจ้งเตือน
            </div>
            <div className="section-sub" style={{ marginBottom: "12px" }}>
              ปรับแต่งธีมการแสดงผลและเลือกช่องทางรับการแจ้งเตือน
            </div>

            {/* Dark / Light Theme Switch */}
            <div className="switch-row">
              <div className="switch-copy">
                <div className="sr-title">โหมดการแสดงผล (Theme)</div>
                <div className="sr-sub">
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
            <div className="switch-row">
              <div className="switch-copy">
                <div className="sr-title">แจ้งเตือนแบตเตอรี่ต่ำ</div>
                <div className="sr-sub">แจ้งเมื่อแบตเตอรี่ต่ำกว่า 20%</div>
              </div>
              <div
                className={`switch ${lowBatteryAlert ? "on" : ""}`}
                onClick={() => setLowBatteryAlert(!lowBatteryAlert)}
              ></div>
            </div>

            {/* Switch 2: Low Water */}
            <div className="switch-row">
              <div className="switch-copy">
                <div className="sr-title">แจ้งเตือนน้ำใกล้หมด</div>
                <div className="sr-sub">แจ้งเมื่อระดับน้ำต่ำกว่า 15%</div>
              </div>
              <div
                className={`switch ${lowWaterAlert ? "on" : ""}`}
                onClick={() => setLowWaterAlert(!lowWaterAlert)}
              ></div>
            </div>

            {/* Switch 3: Daily Summary */}
            <div className="switch-row">
              <div className="switch-copy">
                <div className="sr-title">สรุปผลประจำวันทางอีเมล</div>
                <div className="sr-sub">ส่งสรุปการทำงานทุกวันเวลา 18:00 ไปยัง {profile.email}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn ghost text-xs py-1 px-2.5"
                  onClick={handleTestEmail}
                  disabled={sendingEmail}
                  title="ทดสอบส่งอีเมลรายงานเข้าอีเมลนี้ตอนนี้"
                >
                  {sendingEmail ? "กำลังส่ง..." : "ทดสอบส่งอีเมล"}
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

            {saveSuccess && (
              <div className="mt-4 p-3 rounded-lg bg-[var(--good-soft)] text-[var(--good)] text-xs font-semibold">
                ✓ บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว
              </div>
            )}

            <div className="form-actions">
              <button className="btn secondary">ยกเลิก</button>
              <button className="btn" onClick={handleSave}>
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}