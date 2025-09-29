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
    MenuItem,
} from '@mui/material';
import { useSelectedRobot } from "@/app/contexts/SelectedRobotContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/loading";

interface HistoryItem {
    _id?: string;
    date: string;
    plantType: string;
    liquidType: string;
    chemicalName: string;
    area: number | string;
    volume: number | string;
    duration: string;
    other: string;
}

interface User {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    profileImage: string;
    isAdmin: boolean;
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
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalMessage, setModalMessage] = useState<string | null>(null);
    const [modalType, setModalType] = useState<"success" | "error">("success");

    const isValidDate = (d: Date) => d instanceof Date && !isNaN(d.getTime());

    // แปลงเป็น key ของวัน (UTC)
    const toUTCDateKey = (date: Date): string => {
        if (!isValidDate(date)) return "";
        return date.toISOString().split('T')[0];
    };

    // ฟังก์ชันกรองวันที่
    const filterByDate = (rowDate: string, startDate: string, endDate: string): boolean => {
        const row = new Date(rowDate);
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!isValidDate(row)) return false;
        if (!startDate || !endDate) return true; // ถ้ายังไม่เลือกช่วงวันที่ ให้ผ่านทั้งหมด

        const rowKey = toUTCDateKey(row);
        const startKey = toUTCDateKey(start);
        const endKey = toUTCDateKey(end);

        return rowKey >= startKey && rowKey <= endKey;
    };

    useEffect(() => {
        const now = new Date();
        now.setHours(now.getHours() + 7);

        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        const startY = start.getFullYear();
        const startM = String(start.getMonth() + 1).padStart(2, "0");
        const startD = String(start.getDate()).padStart(2, "0");
        const startStr = `${startY}-${startM}-${startD}`;

        setStartDate(startStr);
        setEndDate(todayStr);
    }, [selectedRobot]);

    // ฟังก์ชันโหลดข้อมูล
    const reloadData = async () => {
        if (!selectedRobot) return;
        setLoading(true);

        try {
            if (!selectedRobot || !startDate || !endDate) return;
            const startStr = startDate;
            const endStr = endDate;
            const res = await fetch(
                `/robot/usage-history?device_id=${selectedRobot.device_id}&startDate=${startStr}&endDate=${endStr}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                throw new Error("ไม่พบข้อมูลของหุ่นยนต์ในวันที่เลือก");
            }

            const json = await res.json();

            if (json.length === 0) {
                setData([]);
                setErrorMessage("ไม่พบข้อมูลของหุ่นยนต์ในวันที่เลือก");
                return;
            }

            setData(json);
            setCurrentPage(1);
            setErrorMessage("");
        } catch (error) {
            console.error("โหลดข้อมูลล้มเหลว:", error);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "เกิดข้อผิดพลาดในการโหลดข้อมูล"
            );
        } finally {
            setLoading(false);
        }
    };

    // โหลดข้อมูลเมื่อเข้า หรือเมื่อเปลี่ยน robot / วันที่
    useEffect(() => {
        // โหลดข้อมูลผู้ใช้
        fetch("/api/users/profile", {
            method: "GET",
            credentials: "include",
        })
            .then(async (res) => {
                if (res.status === 403 || res.status === 401) {
                    setErrorMessage("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    router.replace("/");
                    return;
                }
                const data = await res.json();
                setUser(data);
            })
            .catch((error) => {
                setErrorMessage("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
            });
        reloadData();
    }, [router]);

    useEffect(() => {
        reloadData();
        if (!selectedRobot) return;
    }, [selectedRobot, startDate, endDate]);

    // ฟังก์ชันบันทึกข้อมูลแก้ไข
    const handleSave = async () => {
        if (!editItem || !editItem._id) return;

        const { _id, plantType, liquidType, chemicalName, area, other } = editItem;

        const updatePayload = {
            _id,
            plantType,
            liquidType,
            chemicalName,
            area,
            other,
        };

        try {
            const response = await fetch(`/robot/edit-History/${_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                throw new Error("บันทึกข้อมูลล้มเหลว");
            }

            showModal("บันทึกข้อมูลเรียบร้อย", "success");

            // 🔄 โหลดข้อมูลใหม่
            await reloadData();

            setEditItem(null);
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการอัปเดต:", error);
            showModal(error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้");
        }
    };

    // ดาวน์โหลด CSV
    const downloadCSV = () => {
        const headers = [
            "วันที่", "ชนิดพืช", "ประเภทของเหลว", "ชื่อสารเคมี",
            "พื้นที่ (ไร่)", "ปริมาณ (ลิตร)", "ระยะเวลา", "หมายเหตุ"
        ];
        const rows = filteredData.map(row => [
            row.date, row.plantType, row.liquidType, row.chemicalName,
            row.area, row.volume, row.duration, row.other
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

    function toThaiDatetimeString(dateStr: string) {
        const date = new Date(dateStr);
        return date.toLocaleString('th-TH', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    const showModal = (message: string, type: "success" | "error" = "success") => {
        setModalMessage(message);
        setModalType(type);
    };

    const closeModal = () => {
        setModalMessage(null);
    };

    useEffect(() => {
        if (errorMessage) {
            showModal(errorMessage, "error");
        } else {
            setModalMessage(null);
        }
    }, [errorMessage]);

    // กรองข้อมูล
    const filteredData = data.filter((row) => {
        const matchType = filter === "ทั้งหมด" || row.liquidType === filter;
        const matchDate = filterByDate(row.date, startDate, endDate);
        return matchType && matchDate;
    });

    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) {
        return <Loading />;
    }

    return (
        <main className="main-history">
            <div className="title-history">
                <h2>ประวัติการทำงาน</h2>

                {!selectedRobot ? (
                    <p>โปรดเลือกหุ่นยนต์จากเมนูด้านข้าง</p>
                ) : (
                    <>
                        <div className="selected-robot-info">
                            <p>หุ่นยนต์ที่เลือก:{" "}
                                {user?.isAdmin
                                    ? selectedRobot.device_id
                                    : selectedRobot.robot_name}
                            </p>
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
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} style={{ textAlign: "center", color: "red" }}>
                                                {errorMessage || "ไม่พบข้อมูล"}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row) => (
                                            <tr key={row._id}>
                                                <td>{toThaiDatetimeString(row.date)}</td>
                                                <td>{row.plantType}</td>
                                                <td>{row.liquidType}</td>
                                                <td>{row.chemicalName}</td>
                                                <td>{row.area}</td>
                                                <td>{row.volume}</td>
                                                <td>{row.duration}</td>
                                                <td>{row.other}</td>
                                                <td>
                                                    <button className="btn-editItem" onClick={() => setEditItem(row)}>
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {filteredData.length >= itemsPerPage && (
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
                                    label="ชนิดพืช"
                                    value={editItem?.plantType || ""}
                                    onChange={(e) =>
                                        setEditItem((prev) => ({ ...prev, plantType: e.target.value }))
                                    }
                                    fullWidth
                                    margin="dense"
                                />
                                <TextField
                                    select
                                    label="ประเภทของเหลว"
                                    value={editItem?.liquidType || ""}
                                    onChange={(e) =>
                                        setEditItem((prev) => ({ ...prev, liquidType: e.target.value }))
                                    }
                                    fullWidth
                                    margin="dense"
                                >
                                    <MenuItem value="น้ำ">น้ำ</MenuItem>
                                    <MenuItem value="สารเคมี">สารเคมี</MenuItem>
                                    <MenuItem value="ปุ๋ย">ปุ๋ย</MenuItem>
                                </TextField>

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
                                    label="หมายเหตุ"
                                    value={editItem?.other || ""}
                                    onChange={(e) =>
                                        setEditItem((prev) => ({ ...prev, other: e.target.value }))
                                    }
                                    fullWidth
                                    margin="dense"
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button type="button" onClick={() => setEditItem(null)}>ยกเลิก</Button>
                                <Button type="button" variant="contained" onClick={handleSave}>บันทึก</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </div>
            {modalMessage && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <button className="modal-close" onClick={closeModal}>×</button>
                        {modalType === "success" ? (
                            <div className="checkmark-animation">
                                <svg viewBox="0 0 52 52" className="checkmark">
                                    <circle className="checkmark-circle-ok" cx="26" cy="26" r="25" fill="none" />
                                    <path className="checkmark-check-ok" fill="none" d="M14 27l7 7 16-16" />
                                </svg>
                            </div>
                        ) : (
                            <div className="crossmark-animation">
                                <svg viewBox="0 0 52 52" className="crossmark">
                                    <circle className="crossmark-circle-error" cx="26" cy="26" r="25" fill="none" />
                                    <path className="crossmark-line1" d="M16 16 L36 36" />
                                    <path className="crossmark-line2" d="M36 16 L16 36" />
                                </svg>
                            </div>
                        )}
                        <p>{modalMessage}</p>
                        <button className="modal-ok" onClick={closeModal}>ตกลง</button>
                    </div>
                </div>
            )}
        </main>
    );
}
