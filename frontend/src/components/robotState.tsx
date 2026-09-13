"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";

interface RobotItem {
  robot_id: number;
  robot_name: string;
  device_id: string;
  area: string;
  status: "online" | "offline" | "charging";
  statusText: string;
  badgeClass: "done" | "cancel" | "progress";
  battery: number | null;
  lastActive: string;
}

export default function RobotState() {
  const router = useRouter();
  const { setSelectedRobot } = useSelectedRobot();

  const [robots, setRobots] = useState<RobotItem[]>([
    {
      robot_id: 2,
      robot_name: "Simulated Robo",
      device_id: "device_sim_01",
      area: "แปลง B2 (ริมห้วย)",
      status: "online",
      statusText: "ออนไลน์",
      badgeClass: "done",
      battery: 86,
      lastActive: "กำลังทำงาน",
    },
    {
      robot_id: 3,
      robot_name: "Robo Field-02",
      device_id: "ATJ001",
      area: "แปลง A1 (หน้าโรงเก็บ)",
      status: "offline",
      statusText: "ออฟไลน์",
      badgeClass: "cancel",
      battery: null,
      lastActive: "เมื่อวาน 17:20",
    },
    {
      robot_id: 4,
      robot_name: "Robo Field-03",
      device_id: "ATJ002",
      area: "แปลง C4 (สวนหลัง)",
      status: "charging",
      statusText: "ชาร์จไฟ",
      badgeClass: "progress",
      battery: 41,
      lastActive: "วันนี้ 06:15",
    },
  ]);

  // Modal State for Assign Robot
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [robotToken, setRobotToken] = useState("");
  const [robotName, setRobotName] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchMyRobots = async () => {
    try {
      const res = await fetch("/robot/my_robot", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.robots)) {
        const mapped: RobotItem[] = data.robots.map((r: { robot_id: number; robot_name: string; device_id: string }, idx: number) => ({
          robot_id: r.robot_id,
          robot_name: r.robot_name,
          device_id: r.device_id,
          area: `แปลง ${String.fromCharCode(65 + idx)}${idx + 1}`,
          status: "online",
          statusText: "ออนไลน์",
          badgeClass: "done",
          battery: 86,
          lastActive: "กำลังทำงาน",
        }));
        setRobots(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMyRobots();
  }, []);

  const handleSelect = (robot: RobotItem) => {
    setSelectedRobot({
      robot_id: robot.robot_id,
      robot_name: robot.robot_name,
      device_id: robot.device_id,
    });
    router.push("/home");
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robotToken || !robotName) {
      setFeedback({ message: "กรุณากรอก Token และตั้งชื่อหุ่นยนต์ให้ครบถ้วน", type: "error" });
      return;
    }

    setAssignLoading(true);
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
        setRobotToken("");
        setRobotName("");
        fetchMyRobots();
        setTimeout(() => {
          setShowAssignModal(false);
          setFeedback(null);
        }, 1500);
      } else {
        setFeedback({ message: data.message || "ไม่สามารถเชื่อมต่อหุ่นยนต์ได้", type: "error" });
      }
    } catch (error) {
      console.error("Assign robot error:", error);
      setFeedback({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", type: "error" });
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <main className="content">
      {/* Section Head */}
      <div className="section-head">
        <div>
          <div className="section-title">หุ่นยนต์ของฉัน</div>
          <div className="section-sub">จัดการและตรวจสอบหุ่นยนต์ทั้งหมดในฟาร์ม</div>
        </div>
        <button className="btn" onClick={() => setShowAssignModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#04231F" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          เพิ่มหุ่นยนต์ (Assign Robot)
        </button>
      </div>

      {/* Robot Cards Grid */}
      <div className="robot-grid">
        {robots.map((robot) => (
          <div className="robot-card" key={robot.robot_id}>
            <div className="robot-card-head">
              <div style={{ display: "flex", gap: "11px" }}>
                <div
                  className="robot-card-icon"
                  style={
                    robot.status === "offline"
                      ? { color: "var(--text-mid)", background: "var(--panel-raised)" }
                      : {}
                  }
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="4" y="8" width="16" height="12" rx="2" />
                    <path d="M12 8V4M9 4h6" />
                    <circle cx="9" cy="14" r="1.1" />
                    <circle cx="15" cy="14" r="1.1" />
                  </svg>
                </div>
                <div>
                  <div className="robot-name">{robot.robot_name}</div>
                  <div className="robot-meta">{robot.area}</div>
                </div>
              </div>
              <span className={`badge ${robot.badgeClass}`}>{robot.statusText}</span>
            </div>

            <div className="mini-battery">
              <span className="num" style={{ width: "30px" }}>
                {robot.battery !== null ? `${robot.battery}%` : "—"}
              </span>
              <div className="mini-bar">
                <div
                  className="mini-bar-fill"
                  style={{
                    width: robot.battery !== null ? `${robot.battery}%` : "0%",
                    background:
                      robot.battery === null
                        ? "var(--text-low)"
                        : robot.battery < 50
                        ? "var(--warn)"
                        : "var(--good)",
                  }}
                ></div>
              </div>
            </div>

            <div className="robot-card-foot">
              <span className="section-sub">ใช้งานล่าสุด: {robot.lastActive}</span>
              <button className="btn ghost" onClick={() => handleSelect(robot)}>
                ดูรายละเอียด
              </button>
            </div>
          </div>
        ))}

        {/* Add Robot Card */}
        <div className="add-robot-card" onClick={() => setShowAssignModal(true)}>
          <div className="arc-plus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600" }}>เพิ่มหุ่นยนต์ใหม่ (Assign Robot)</span>
        </div>
      </div>

      {/* Assign Robot Modal Popup */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="panel max-w-md w-full p-6 relative shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-[var(--text-low)] hover:text-[var(--text-hi)] transition-colors p-1"
              onClick={() => {
                setShowAssignModal(false);
                setFeedback(null);
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="4" y="8" width="16" height="12" rx="2" />
                  <path d="M12 8V4M9 4h6" />
                  <circle cx="9" cy="14" r="1" fill="currentColor" />
                  <circle cx="15" cy="14" r="1" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-hi)]">Assign Robot (เพิ่มหุ่นยนต์)</h3>
                <p className="text-xs text-[var(--text-low)]">เชื่อมต่อหุ่นยนต์ตัวใหม่เข้ากับบัญชีของคุณ</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4 mt-2">
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

              {/* Feedback Message */}
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

              {/* Actions */}
              <div className="form-actions" style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setFeedback(null);
                  }}
                >
                  ยกเลิก
                </button>
                <button type="submit" disabled={assignLoading} className="btn">
                  {assignLoading ? "กำลังเชื่อมต่อ..." : "Assign Robot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
