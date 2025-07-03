"use client";
import React, { useState, useEffect } from 'react';
import '@/styles/history.css';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Pagination,
} from '@mui/material';
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";

interface HistoryItem {
    id: number;
    date: string;
    plantType: string;
    category: string;
    chemicalName: string;
    area: number;
    volume: number;
    duration: string;
    note: string;
}

type EditableHistoryItem = Partial<HistoryItem & { id: number }>;

export default function HistoryPage() {
    const [data, setData] = useState<HistoryItem[]>([]);
    const [editItem, setEditItem] = useState<EditableHistoryItem | null>(null);
    const [filter, setFilter] = useState("ทั้งหมด");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const { selectedRobot } = useSelectedRobot();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ดึงข้อมูลจาก API เมื่อเลือก robot หรือช่วงวันที่เปลี่ยน
    useEffect(() => {
        if (!selectedRobot || !startDate || !endDate) return;

        const fetchData = async () => {
            try {
                const res = await fetch(
                `http://localhost:5000/devices/chemical-usage-history?device_id=${selectedRobot.device_id}&startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
                );
                const json: HistoryItem[] = await res.json();
                const withId: HistoryItem[] = json.map((item, index): HistoryItem => ({
                    ...item,
                    id: index + 1
                }));
                setData(withId);
                setCurrentPage(1);
            } catch (error) {
                console.error("โหลดข้อมูลล้มเหลว:", error);
            }
        };

        fetchData();
    }, [selectedRobot, startDate, endDate]);

    const filteredData = data.filter((row) => {
        const matchType = filter === "ทั้งหมด" || row.category === filter;
        const rowDate = new Date(row.date);
        const matchStart = !startDate || rowDate >= new Date(startDate);
        const matchEnd = !endDate || rowDate <= new Date(endDate);
        return matchType && matchStart && matchEnd;
    });

    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSave = () => {
        if (!editItem) return;
        const updatedData = data.map((item) =>
            item.id === editItem.id ? { ...item, ...editItem } : item
        );
        setData(updatedData);
        setEditItem(null);
    };

    const downloadCSV = () => {
        const headers = [
            "วันที่", "ชนิดพืช", "ประเภทของเหลว", "ชื่อสารเคมี",
            "พื้นที่ (ไร่)", "ปริมาณ (ลิตร)", "ระยะเวลา", "หมายเหตุ"
        ];
        const rows = filteredData.map(row => [
            row.date, row.plantType, row.category, row.chemicalName,
            row.area, row.volume, row.duration, row.note
        ]);

        const csvContent = [
            "\uFEFF",
            [headers, ...rows].map(r => r.join(",")).join("\n")
        ].join("");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "chemical_usage_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="main-history">
            <h2 className="title-history">ประวัติการทำงาน</h2>
            {selectedRobot ? (
                <div className="selected-robot-info">
                    <p>หุ่นยนต์ที่เลือก: {selectedRobot.robot_name}</p>
                </div>
            ) : (
                <p>โปรดเลือกหุ่นยนต์จากเมนูด้านข้าง</p>
            )}

            <div className="filter-section-date">
                <div className="filter-date">
                    <label htmlFor="start">วันที่เริ่ม</label>
                    <input
                        type="date"
                        id="start"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="filter-date">
                    <label htmlFor="end">ถึงวันที่</label>
                    <input
                        type="date"
                        id="end"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            <h3 className="subtitle">ประวัติที่แสดง: {filteredData.length} รายการ</h3>

            <div className="filter-section">
                {["ทั้งหมด", "สารเคมี", "ปุ๋ย", "น้ำ"].map((type) => (
                    <button
                        key={type}
                        className={`filter-tab ${filter === type ? "active" : ""}`}
                        onClick={() => {
                            setFilter(type);
                            setCurrentPage(1);
                        }}
                    >
                        {type}
                    </button>
                ))}
                <button className="btn-download-csv" onClick={downloadCSV}>
                    ดาวน์โหลด CSV
                </button>

            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>วันที่</th>
                            <th>ชนิดพืช</th>
                            <th>ประเภทของเหลว</th>
                            <th>ชื่อสารเคมี</th>
                            <th>พื้นที่ (ไร่)</th>
                            <th>ปริมาณ (ลิตร)</th>
                            <th>ระยะเวลา</th>
                            <th>หมายเหตุ</th>
                            <th>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row) => (
                            <tr key={row.id}>
                                <td>{row.date}</td>
                                <td>{row.plantType}</td>
                                <td>{row.category}</td>
                                <td>{row.chemicalName}</td>
                                <td>{row.area}</td>
                                <td>{row.volume}</td>
                                <td>{row.duration}</td>
                                <td>{row.note}</td>
                                <td>
                                    <button className="btn-editItem" onClick={() => setEditItem(row)}>
                                        <span className="material-symbols-outlined">edit</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredData.length > itemsPerPage && (
                <div className="pagination-container">
                    <Pagination
                        count={Math.ceil(filteredData.length / itemsPerPage)}
                        page={currentPage}
                        onChange={(e, page) => setCurrentPage(page)}
                        color="primary"
                    />
                </div>
            )}

            <Dialog className="edit-dialog" open={!!editItem} onClose={() => setEditItem(null)}>
                <DialogTitle>แก้ไขข้อมูล</DialogTitle>
                <DialogContent>
                    <TextField
                        label="วันที่"
                        type="date"
                        value={editItem?.date || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, date: e.target.value }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ชนิดพืช"
                        value={editItem?.plantType || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, plantType: e.target.value }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ประเภทของเหลว"
                        value={editItem?.category || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, category: e.target.value }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ชื่อสารเคมี"
                        value={editItem?.chemicalName || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, chemicalName: e.target.value }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="พื้นที่ (ไร่)"
                        type="number"
                        value={editItem?.area || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, area: Number(e.target.value) }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ปริมาณ (ลิตร)"
                        type="number"
                        value={editItem?.volume || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, volume: Number(e.target.value) }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ระยะเวลา"
                        value={editItem?.duration || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, duration: e.target.value }))
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="หมายเหตุ"
                        value={editItem?.note || ""}
                        onChange={(e) =>
                            setEditItem((prev) => ({ ...prev, note: e.target.value }))
                        }
                        fullWidth
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditItem(null)}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSave}>บันทึก</Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}