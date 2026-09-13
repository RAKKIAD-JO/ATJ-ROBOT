"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelectedRobot, RobotInfo } from "@/app/contexts/SelectedRobotContext";
import { useTheme } from "@/app/contexts/ThemeContext";

const titles: Record<string, [string, string]> = {
  "/home": ["Dashboard", "ภาพรวมสถานะหุ่นยนต์แบบเรียลไทม์"],
  "/graph": ["แสดงกราฟ", "วิเคราะห์แนวโน้มค่าตัวชี้วัดย้อนหลัง"],
  "/history": ["ประวัติการทำงาน", "บันทึกรอบการฉีดพ่นทั้งหมด"],
  "/settings": ["ตั้งค่าโปรไฟล์", "จัดการข้อมูลบัญชีและการแจ้งเตือน"],
  "/robotState": ["หุ่นยนต์ของฉัน", "จัดการฟลีตหุ่นยนต์ในฟาร์ม"],
  "/admin": ["จัดการ Token", "จัดการระบบสิทธิ์และ Token ของหุ่นยนต์"],
};

export default function Topbar() {
  const pathname = usePathname();
  const { selectedRobot, setSelectedRobot } = useSelectedRobot();
  const { theme, toggleTheme } = useTheme();
  const [robots, setRobots] = useState<RobotInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [clockTime, setClockTime] = useState("");
  const [clockDate, setClockDate] = useState("");

  const pageInfo = titles[pathname] || ["Dashboard", "ภาพรวมระบบ"];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setClockDate(
        now.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/robot/my_robot", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.robots)) {
          setRobots(data.robots);
        }
      })
      .catch(() => {});
  }, []);

  const openNav = () => {
    const appEl = document.getElementById("app");
    if (appEl) {
      appEl.classList.toggle("nav-open");
    }
  };

  return (
    <header className="topbar">
      <button className="hamburger" onClick={openNav} aria-label="เปิดเมนู">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div className="page-title-block">
        <div className="page-title">{pageInfo[0]}</div>
        <div className="page-crumb">{pageInfo[1]}</div>
      </div>

      {/* Robot Selection Dropdown */}
      <div className="relative">
        <div
          className="robot-select"
          onClick={() => setShowDropdown(!showDropdown)}
          title="เลือกหุ่นยนต์"
        >
          <span className="dot-live"></span>
          <span className="rs-label">หุ่นยนต์ที่เลือก</span>
          <span className="rs-name">
            {selectedRobot ? selectedRobot.robot_name : "ยังไม่ได้เลือก"}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[var(--panel)] border border-[var(--border)] shadow-xl z-50 py-1">
            <div className="px-3 py-2 text-xs font-semibold text-[var(--text-low)] border-b border-[var(--border-soft)]">
              รายการหุ่นยนต์ของคุณ
            </div>
            {robots.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[var(--text-mid)]">ไม่พบหุ่นยนต์</div>
            ) : (
              robots.map((robot) => (
                <div
                  key={robot.robot_id}
                  className={`px-3 py-2.5 text-xs font-medium cursor-pointer hover:bg-[var(--panel-alt)] flex items-center justify-between ${
                    selectedRobot?.robot_id === robot.robot_id
                      ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                      : "text-[var(--text-hi)]"
                  }`}
                  onClick={() => {
                    setSelectedRobot(robot);
                    setShowDropdown(false);
                  }}
                >
                  <span>{robot.robot_name}</span>
                  <span className="text-[10px] text-[var(--text-low)]">{robot.device_id}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Theme Toggle Button (Dark / Light Mode) */}
      <button
        className="topbar-icon-btn"
        onClick={toggleTheme}
        title={theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)"}
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {/* Sun Icon */}
            <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="1.8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {/* Moon Icon */}
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="1.8" />
          </svg>
        )}
      </button>

      {/* Live Clock */}
      <div className="clock">
        <div className="c-time">{clockTime || "00:00:00"}</div>
        <div>{clockDate || "13 ก.ย. 2569"}</div>
      </div>
    </header>
  );
}
