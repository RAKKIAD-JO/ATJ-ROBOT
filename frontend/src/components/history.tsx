"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import '@/styles/history.css';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Button,
    TextField,
    Pagination,
} from '@mui/material';
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";

const dummyData = [
    {
        id: 1,
        date: '2023-10-01',
        plantType: 'ผักสวนครัว',
        category: 'สารเคมี',
        chemicalName: 'ออร์กาโนฟอสเฟต',
        area: '1',
        volume: '5',
        duration: '40',
        note: 'โรงเรือนที่1',
    },
];

type HistoryItem = {
    id: number;
    date: string;
    plantType: string;
    category: string;
    chemicalName: string;
    area: string;
    volume: string;
    duration: string;
    note: string;
};

export default function HistoryPage() {
    const router = useRouter();
    const [data, setData] = useState<HistoryItem[]>(dummyData);
    const [editItem, setEditItem] = useState<HistoryItem | null>(null);
    const [filter, setFilter] = useState("ทั้งหมด");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const { selectedRobot } = useSelectedRobot();

    // เช็ค session
    React.useEffect(() => {
        fetch("/api/users/profile", {
            credentials: "include"
        })
        .then(res => {
            if (res.status === 401 || res.status === 403) {
                router.replace("/");
                return;
            }
            return res.json();
        })
        .catch(() => {
            router.replace("/");
        });
    }, [router]);

    const filteredData = data.filter((row) => {
        const matchType = filter === "ทั้งหมด" || row.category === filter;
        const rowDate = new Date(row.date);
        const matchStart = !startDate || rowDate >= new Date(startDate);
        const matchEnd = !endDate || rowDate <= new Date(endDate);
        return matchType && matchStart && matchEnd;
    });

    const handleSave = () => {
        if (!editItem) return;
        const updatedData = data.map((item) =>
            item.id === editItem.id ? { ...item, ...editItem } : item
        );
        setData(updatedData);
        setEditItem(null);
    };

    return (
        <main className="main-history">
            <h2 className="title">ประวัติการทำงาน</h2>
            {selectedRobot ? (
                <div className="selected-robot-info">
                    <p>หุ่นยนต์ที่เลือก: {selectedRobot.robot_name}</p>
                </div>
            ) : (
                <p>โปรดเลือกหุ่นยนต์จากเมนูด้านข้าง</p>
            )}
            <h3 className="subtitle">ประวัติการใช้งานทั้งหมด: {filteredData.length} รายการ</h3>

            <div className="filter-section">
                {["ทั้งหมด", "สารเคมี", "ปุ๋ย", "น้ำ"].map((type) => (
                    <button
                        key={type}
                        className={`filter-tab ${filter === type ? "active" : ""}`}
                        onClick={() => setFilter(type)}

                    >
                        {type}
                    </button>
                ))}
            </div>

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
                        {filteredData.map((row) => (
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

            <div className="pagination-container">
                <Pagination count={1} page={1} />
            </div>

            <Dialog className="edit-dialog" open={!!editItem} onClose={() => setEditItem(null)}>
                <DialogTitle>แก้ไขข้อมูล</DialogTitle>
                <DialogContent>
                    <TextField
                        label="วันที่"
                        type="date"
                        value={editItem?.date || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, date: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="ชนิดพืช"
                        select
                        value={editItem?.plantType || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, plantType: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    >
                        {["ผักสวนครัว", "ไม้พุ่มเตี้ย", "ไม้เลื้อย"].map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="ประเภทของเหลว"
                        value={editItem?.category || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, date: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ชื่อสารเคมี"
                        value={editItem?.chemicalName || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, chemicalName: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="พื้นที่ (ไร่)"
                        type="number"
                        value={editItem?.area || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, area: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ปริมาณ (ลิตร)"
                        type="number"
                        value={editItem?.volume || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, volume: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="ระยะเวลา"
                        value={editItem?.duration || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, duration: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    />
                    <TextField
                        label="หมายเหตุ"
                        value={editItem?.note || ""}
                        onChange={(e) =>
                            setEditItem((prev) => prev ? ({ ...prev, note: e.target.value }): prev)
                        }
                        fullWidth
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditItem(null)}>ยกเลิก</Button>
                    <Button variant="contained" onClick={handleSave}>
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}
