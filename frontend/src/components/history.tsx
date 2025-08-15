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

    // ฟังก์ตรวรสอบวัน
    const filterByDate = (rowDate: string, startDate: string, endDate: string): boolean => {
        const rowKey = toUTCDateKey(new Date(rowDate));
        const startKey = toUTCDateKey(new Date(startDate));
        const endKey = toUTCDateKey(new Date(endDate));

        return rowKey >= startKey && rowKey <= endKey;
    };


    useEffect(() => {
        // ดึงข้อมูลผู้ใช้
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

        // ตรวจสอบว่ามี selectedRobot และวันที่ครบหรือไม่
        if (!selectedRobot || !startDate || !endDate) return;

        setLoading(true);

        const fetchData = async () => {
            try {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                const startStr = start.toISOString();
                const endStr = end.toISOString();

                const res = await fetch(
                    `/robot/chemical-usage-history?device_id=${selectedRobot.device_id}&startDate=${startStr}&endDate=${endStr}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch robot data");
                }

                const json = await res.json();
                console.log("json API:", json);

                if (json.length === 0) {
                    setData([]);
                    setErrorMessage("ไม่พบข้อมูลในช่วงเวลาที่เลือก");
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

        fetchData();
    }, [router, selectedRobot, startDate, endDate]);

    const toUTCDateKey = (date: Date): string => {
        return date.toISOString().split('T')[0]; // ได้ 'YYYY-MM-DD'
    };

    // กรองข้อมูลตาม liquidType และช่วงวันที่
    const filteredData = data.filter((row) => {
        const matchType = filter === "ทั้งหมด" || row.liquidType === filter;
        const matchDate = filterByDate(row.date, startDate, endDate);
        return matchType && matchDate;
    });

    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
            const response = await fetch(`/robot/history/${_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                throw new Error("บันทึกข้อมูลล้มเหลว");
            }

            const result = await response.json();
            const updatedItem = result.iotData?.data;

            if (!updatedItem || !updatedItem._id) {
                throw new Error("ข้อมูลอัปเดตไม่ถูกต้อง");
            }

            const updatedData = data.map((item) =>
                item._id === updatedItem._id ? updatedItem : item
            );

            setData(updatedData);
            setEditItem(null);
        } catch (error) {
            console.error("เกิดข้อผิดพลาดในการอัปเดต:", error);
            alert(error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลได้");
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

    return (
        <main className="main-history">
            <div className="title-history">
                <h2>ประวัติการทำงาน</h2>

                {!selectedRobot ? (
                    <p>โปรดเลือกหุ่นยนต์จากเมนูด้านข้าง</p>
                ) : loading ? (
                    <Loading />
                ) : errorMessage ? (
                    <p style={{ color: 'red' }}>{errorMessage}</p>
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
                                    {paginatedData.map((row) => (
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
                                    ))}
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
                                    label="ประเภทของเหลว"
                                    value={editItem?.liquidType || ""}
                                    onChange={(e) =>
                                        setEditItem((prev) => ({ ...prev, liquidType: e.target.value }))
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
                                <Button onClick={() => setEditItem(null)}>ยกเลิก</Button>
                                <Button variant="contained" onClick={handleSave}>บันทึก</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </div>
        </main>
    );
}