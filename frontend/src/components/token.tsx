"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignRobot() {
  const router = useRouter();
  const [robotToken, setRobotToken] = useState("");
  const [robotName, setRobotName] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robotToken || !robotName) {
      setFeedback({ message: "กรุณากรอก Token และตั้งชื่อหุ่นยนต์ให้ครบถ้วน", type: "error" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/robot/connect-robot", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: robotToken,
          robot_name: robotName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ message: data.message || "เชื่อมต่อหุ่นยนต์สำเร็จ!", type: "success" });
        setTimeout(() => {
          router.push("/home");
        }, 1200);
      } else {
        setFeedback({ message: data.message || "ไม่สามารถเชื่อมต่อหุ่นยนต์ได้", type: "error" });
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      setFeedback({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-center p-4 bg-[var(--bg)]">
      <div className="panel max-w-lg w-full p-8 shadow-2xl border border-[var(--border)] relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="4" y="8" width="16" height="12" rx="2" />
              <path d="M12 8V4M9 4h6" />
              <circle cx="9" cy="14" r="1" fill="currentColor" />
              <circle cx="15" cy="14" r="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-hi)]">Assign Robot (เพิ่มหุ่นยนต์)</h2>
            <p className="text-xs text-[var(--text-low)]">เชื่อมต่อหุ่นยนต์ตัวใหม่เข้ากับบัญชีของคุณ</p>
          </div>
        </div>

        <form onSubmit={handleAssign} className="flex flex-col gap-4">
          <div className="field">
            <label>Robot Token</label>
            <input
              type="text"
              placeholder="กรอก Token ของหุ่นยนต์"
              value={robotToken}
              onChange={(e) => setRobotToken(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Robot Name (ชื่อหุ่นยนต์)</label>
            <input
              type="text"
              placeholder="ตั้งชื่อหุ่นยนต์ เช่น Simulated Robo"
              value={robotName}
              onChange={(e) => setRobotName(e.target.value)}
              maxLength={20}
              required
            />
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-[var(--good-soft)] text-[var(--good)]"
                  : "bg-[var(--danger-soft)] text-[var(--danger)]"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {feedback.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="form-actions mt-2">
            <button
              type="button"
              className="btn secondary"
              onClick={() => router.push("/home")}
            >
              กลับหน้าหลัก
            </button>
            <button type="submit" disabled={loading} className="btn">
              {loading ? "กำลังเชื่อมต่อ..." : "Assign Robot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
