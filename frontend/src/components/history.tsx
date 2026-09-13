"use client";

import { useEffect, useState } from "react";
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";

interface HistoryItem {
  id: string;
  datetime: string;
  robotName: string;
  area: string;
  plantType: string;
  chemicalName: string;
  volume: string;
  badgeClass: "done" | "progress" | "cancel";
  statusText: string;
}

export default function History() {
  const { selectedRobot } = useSelectedRobot();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // Modal State for Edit / Add History
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [formData, setFormData] = useState<HistoryItem>({
    id: "",
    datetime: "",
    robotName: "",
    area: "",
    plantType: "",
    chemicalName: "",
    volume: "",
    badgeClass: "done",
    statusText: "เสร็จสิ้น",
  });

  // Load saved history or fall back to default
  useEffect(() => {
    const saved = localStorage.getItem("atj_robot_history");
    if (saved) {
      try {
        setHistoryList(JSON.parse(saved));
        return;
      } catch (e) {
        console.error(e);
      }
    }
    setHistoryList([
      {
        id: "1",
        datetime: "13/09/2569 · 01:01",
        robotName: selectedRobot ? selectedRobot.robot_name : "Simulated Robo",
        area: "แปลง B2 (ริมห้วย)",
        plantType: "ข้าวโพด",
        chemicalName: "ปุ๋ยน้ำอินทรีย์ สูตรเร่งโต",
        volume: "3.98 ล.",
        badgeClass: "progress",
        statusText: "กำลังทำงาน",
      },
      {
        id: "2",
        datetime: "12/09/2569 · 06:40",
        robotName: selectedRobot ? selectedRobot.robot_name : "Simulated Robo",
        area: "แปลง B2 (ริมห้วย)",
        plantType: "ข้าวโพด",
        chemicalName: "ปุ๋ยน้ำอินทรีย์ สูตรเร่งโต",
        volume: "18.20 ล.",
        badgeClass: "done",
        statusText: "เสร็จสิ้น",
      },
      {
        id: "3",
        datetime: "12/09/2569 · 06:10",
        robotName: "Robo Field-02",
        area: "แปลง A1 (หน้าโรงเก็บ)",
        plantType: "ข้าวโพด",
        chemicalName: "ยาป้องกันเชื้อรา",
        volume: "12.50 ล.",
        badgeClass: "done",
        statusText: "เสร็จสิ้น",
      },
      {
        id: "4",
        datetime: "11/09/2569 · 15:32",
        robotName: "Robo Field-03",
        area: "แปลง C4 (สวนหลัง)",
        plantType: "มันสำปะหลัง",
        chemicalName: "ปุ๋ยเคมีสูตร 15-15-15",
        volume: "9.10 ล.",
        badgeClass: "cancel",
        statusText: "ยกเลิก",
      },
      {
        id: "5",
        datetime: "11/09/2569 · 07:05",
        robotName: selectedRobot ? selectedRobot.robot_name : "Simulated Robo",
        area: "แปลง B2 (ริมห้วย)",
        plantType: "ข้าวโพด",
        chemicalName: "สารกำจัดวัชพืช",
        volume: "15.80 ล.",
        badgeClass: "done",
        statusText: "เสร็จสิ้น",
      },
      {
        id: "6",
        datetime: "10/09/2569 · 06:55",
        robotName: "Robo Field-02",
        area: "แปลง A1 (หน้าโรงเก็บ)",
        plantType: "ข้าวโพด",
        chemicalName: "ปุ๋ยน้ำอินทรีย์ สูตรเร่งโต",
        volume: "16.40 ล.",
        badgeClass: "done",
        statusText: "เสร็จสิ้น",
      },
    ]);
  }, [selectedRobot]);

  const saveHistoryList = (newList: HistoryItem[]) => {
    setHistoryList(newList);
    localStorage.setItem("atj_robot_history", JSON.stringify(newList));
  };

  const handleOpenAdd = () => {
    const nowStr = new Date().toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).replace(",", " ·");

    setEditingItem(null);
    setFormData({
      id: Date.now().toString(),
      datetime: nowStr,
      robotName: selectedRobot ? selectedRobot.robot_name : "Simulated Robo",
      area: "แปลง A1 (หน้าโรงเก็บ)",
      plantType: "ข้าวโพด",
      chemicalName: "ปุ๋ยน้ำอินทรีย์",
      volume: "10.00 ล.",
      badgeClass: "done",
      statusText: "เสร็จสิ้น",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: HistoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleStatusChange = (statusValue: "done" | "progress" | "cancel") => {
    const statusTextMap = {
      done: "เสร็จสิ้น",
      progress: "กำลังทำงาน",
      cancel: "ยกเลิก",
    };
    setFormData((prev) => ({
      ...prev,
      badgeClass: statusValue,
      statusText: statusTextMap[statusValue],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const updated = historyList.map((item) =>
        item.id === editingItem.id ? formData : item
      );
      saveHistoryList(updated);
    } else {
      saveHistoryList([formData, ...historyList]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการประวัตินี้?")) {
      const updated = historyList.filter((item) => item.id !== id);
      saveHistoryList(updated);
      setShowModal(false);
    }
  };

  const exportCSV = () => {
    const headers = ["วันที่/เวลา", "หุ่นยนต์", "พื้นที่", "ชนิดพืช", "สารเคมี", "ปริมาณน้ำ", "สถานะ"];
    const rows = filteredHistory.map((item) => [
      `"${item.datetime}"`,
      `"${item.robotName}"`,
      `"${item.area}"`,
      `"${item.plantType}"`,
      `"${item.chemicalName}"`,
      `"${item.volume}"`,
      `"${item.statusText}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `history_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = historyList.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.plantType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chemicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.robotName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "done" && item.badgeClass === "done") ||
      (statusFilter === "progress" && item.badgeClass === "progress") ||
      (statusFilter === "cancel" && item.badgeClass === "cancel");

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="content">
      {/* Section Head with Add Record button */}
      <div className="section-head mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-title">ประวัติการทำงาน</div>
          <div className="section-sub">บันทึกและจัดการประวัติการฉีดพ่นยาลดและปุ๋ยของหุ่นยนต์</div>
        </div>
        <button className="btn" onClick={handleOpenAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#04231F" strokeWidth="2.4" className="w-4 h-4 mr-1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          เพิ่มประวัติการทำงาน
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className="text-field"
            placeholder="ค้นหาแปลง, ชนิดพืช, สารเคมี..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="done">เสร็จสิ้น</option>
          <option value="progress">กำลังทำงาน</option>
          <option value="cancel">ยกเลิก</option>
        </select>

        <input
          type="date"
          className="select-field"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <button className="btn secondary" style={{ marginLeft: "auto" }} onClick={exportCSV}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v13m0 0l-4-4m4 4l4-4M4 21h16" />
          </svg>
          ส่งออก CSV
        </button>
      </div>

      {/* History Table Panel */}
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>วันที่ / เวลาเริ่ม</th>
              <th>หุ่นยนต์</th>
              <th>พื้นที่</th>
              <th>ชนิดพืช</th>
              <th>สารเคมี</th>
              <th>ปริมาณน้ำ</th>
              <th>สถานะ</th>
              <th className="text-right pr-4">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-[var(--text-low)]">
                  ไม่พบประวัติการทำงานตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            ) : (
              filteredHistory.map((row) => (
                <tr key={row.id}>
                  <td className="num">{row.datetime}</td>
                  <td>{row.robotName}</td>
                  <td>{row.area}</td>
                  <td>{row.plantType}</td>
                  <td>{row.chemicalName}</td>
                  <td className="num">{row.volume}</td>
                  <td>
                    <span className={`badge ${row.badgeClass}`}>{row.statusText}</span>
                  </td>
                  <td className="text-right pr-4">
                    <button
                      className="btn ghost text-xs py-1 px-2.5"
                      onClick={() => handleOpenEdit(row)}
                      title="แก้ไขประวัตินี้"
                    >
                      <svg className="w-3.5 h-3.5 mr-1 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Add History Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="panel max-w-lg w-full p-6 relative shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-[var(--text-low)] hover:text-[var(--text-hi)] transition-colors p-1"
              onClick={() => setShowModal(false)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-hi)]">
                  {editingItem ? "แก้ไขประวัติการทำงาน" : "เพิ่มประวัติการทำงานใหม่"}
                </h3>
                <p className="text-xs text-[var(--text-low)]">
                  กรอกรายละเอียดข้อมูลการฉีดพ่นและสภาวะการทำงาน
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="field">
                  <label>วันที่ / เวลาเริ่ม</label>
                  <input
                    type="text"
                    className="text-field"
                    value={formData.datetime}
                    onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>ชื่อหุ่นยนต์</label>
                  <input
                    type="text"
                    className="text-field"
                    value={formData.robotName}
                    onChange={(e) => setFormData({ ...formData, robotName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="field">
                  <label>พื้นที่ / แปลง</label>
                  <input
                    type="text"
                    className="text-field"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>ชนิดพืช</label>
                  <input
                    type="text"
                    className="text-field"
                    value={formData.plantType}
                    onChange={(e) => setFormData({ ...formData, plantType: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="field">
                  <label>สารเคมี / ปุ๋ย</label>
                  <input
                    type="text"
                    className="text-field"
                    value={formData.chemicalName}
                    onChange={(e) => setFormData({ ...formData, chemicalName: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>ปริมาณน้ำที่ใช้</label>
                  <input
                    type="text"
                    className="text-field"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>สถานะการทำงาน</label>
                <select
                  className="select-field w-full"
                  value={formData.badgeClass}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as "done" | "progress" | "cancel")
                  }
                >
                  <option value="done">เสร็จสิ้น (done)</option>
                  <option value="progress">กำลังทำงาน (progress)</option>
                  <option value="cancel">ยกเลิก (cancel)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--border-soft)]">
                {editingItem ? (
                  <button
                    type="button"
                    className="btn ghost text-[var(--danger)] hover:bg-[var(--danger-soft)] text-xs"
                    onClick={() => handleDelete(editingItem.id)}
                  >
                    ลบประวัตินี้
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn secondary text-xs"
                    onClick={() => setShowModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn text-xs">
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
