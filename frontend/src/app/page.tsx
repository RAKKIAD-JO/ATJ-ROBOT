"use client";

import Link from "next/link";
import { useTheme } from "@/app/contexts/ThemeContext";

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full min-h-screen bg-[var(--bg)] text-[var(--text-hi)] flex flex-col items-center justify-center p-6 relative transition-colors duration-300">
      {/* Brand Header */}
      <div className="absolute top-6 left-8 flex items-center gap-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-hi)]">
          ATJ <span className="text-[var(--accent)]">Robot</span>
        </h2>
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-8 z-10">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-full bg-[var(--panel)] border border-[var(--border)] text-[var(--text-hi)] hover:bg-[var(--panel-raised)] transition-all shadow-lg flex items-center justify-center cursor-pointer"
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

      {/* Hero Card */}
      <div className="w-full max-w-5xl bg-[var(--panel)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10 mt-12 transition-colors duration-300">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-hi)] leading-tight tracking-tight">
            หุ่นยนต์ฉีดพ่นเพื่อการเกษตร
          </h1>
          <p className="text-[var(--text-mid)] text-base md:text-lg leading-relaxed">
            ลดการสัมผัสสารเคมีโดยตรง ช่วยลดความเสี่ยงต่อสุขภาพของเกษตรกร ควบคุมและติดตามสถานะแบบเรียลไทม์
          </p>
          <div className="pt-2">
            <Link href="/login-registers">
              <button className="px-8 py-3.5 bg-[var(--accent)] hover:opacity-90 text-[#04231F] font-bold rounded-2xl text-base transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer">
                Login เข้าสู่ระบบ
              </button>
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative p-6 rounded-3xl bg-[var(--panel-alt)] border border-[var(--border-soft)] shadow-inner">
            <img
              src="/logomine1.png"
              alt="Agriculture Robot"
              className="w-64 h-64 md:w-80 md:h-80 object-contain animate-pulse drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}