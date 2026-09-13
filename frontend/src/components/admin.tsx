'use client'

import { useEffect, useState, useCallback } from 'react';
import { useSelectedRobot } from '@/app/contexts/SelectedRobotContext';
import { useRouter } from 'next/navigation';

interface Robot {
    robot_id: number;
    device_id: string;
    token: string;
    status: 'online' | 'offline';
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: number;
}

interface User {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    profileImage: string;
    isAdmin: boolean;
}

export default function AdminPage() {
    const [deviceId, setDeviceId] = useState('');
    const [token, setToken] = useState('');
    const [searchRobot, setSearchRobot] = useState('');
    const [robots, setRobots] = useState<Robot[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const { setSelectedRobot } = useSelectedRobot();
    const router = useRouter();
    const [modalMessage, setModalMessage] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Robot | null>(null);
    const [modalType, setModalType] = useState<"success" | "error">("success");

    useEffect(() => {
        fetch("/api/users/profile", {
            method: "GET",
            credentials: "include",
        })
            .then(async (res) => {
                if (res.status === 403 || res.status === 401) {
                    alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    router.replace("/");
                    return;
                }
                const data = await res.json();
                setUser(data);
            })
            .catch((error) => {
                alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
            });
    }, [router]);

    const handleGenerateToken = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!deviceId.trim()) {
            showModal('กรุณากรอก Device ID', "error");
            return;
        }

        try {
            const res = await fetch('/iot-api/api/generate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id: deviceId }),
            });

            const data = await res.json();

            if (data.success) {
                setToken(data.token);
                setDeviceId('');
                fetchRobots();
            } else {
                showModal(data.message || 'เกิดข้อผิดพลาด', "error");
            }
        } catch (error) {
            console.error('Error:', error);
            showModal('เกิดข้อผิดพลาดในการเชื่อมต่อ', "error");
        }
    };

    const fetchRobots = useCallback(async () => {
        try {
            const res = await fetch('/robot/all-robot', {
                method: 'GET',
                credentials: 'include',
            });

            if (res.status === 401) {
                alert('คุณยังไม่เข้าสู่ระบบ หรือสิทธิ์ไม่เพียงพอ');
                return;
            }

            const data = await res.json();
            if (Array.isArray(data.robots)) {
                setRobots(data.robots);
            }
        } catch (error) {
            console.error('Error fetching robots:', error);
        }
    }, []);

    useEffect(() => {
        fetchRobots();
    }, [fetchRobots]);

    const filteredRobots = robots.filter((robot) => {
        const statusMatches = statusFilter === 'all' || robot.status === statusFilter;
        const fullName = `${robot.firstName || ''} ${robot.lastName || ''}`.toLowerCase();
        const searchMatch =
            robot.device_id.toLowerCase().includes(searchRobot.toLowerCase()) ||
            fullName.includes(searchRobot.toLowerCase()) ||
            (robot.email || '').toLowerCase().includes(searchRobot.toLowerCase());

        return statusMatches && searchMatch;
    });

    const handleSelectRobot = (robot: Robot) => {
        setSelectedRobot({
            robot_id: robot.robot_id,
            robot_name: robot.firstName ? `${robot.firstName} ${robot.lastName || ''}` : 'ไม่มีชื่อ',
            device_id: robot.device_id,
        });

        router.push('/home');
    };

    useEffect(() => {
        if (user && user.isAdmin === false) {
            router.replace("/home");
        }
    }, [user, router]);

    const handleDeleteRobot = (robot: Robot) => {
        setDeleteConfirm(robot);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const res = await fetch(`/robot/delete-robot/${deleteConfirm.device_id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showModal("ลบหุ่นยนต์สำเร็จ");
                setRobots((prev) => prev.filter((r) => r.device_id !== deleteConfirm.device_id));
            } else {
                showModal(data.message || "เกิดข้อผิดพลาดในการลบ");
            }
        } catch (error) {
            console.error("Error:", error);
            showModal("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const showModal = (message: string, type: "success" | "error" = "success") => {
        setModalMessage(message);
        setModalType(type);
    };

    const closeModal = () => {
        setModalMessage(null);
        window.location.reload();
    };

    return (
        <div className="w-full md:w-[calc(100%-16rem)] md:ml-64 p-4 md:p-8 mt-2 transition-all">
            <h1 className="text-2xl font-extrabold text-gray-800 mb-6">จัดการ Token และหุ่นยนต์</h1>

            <form onSubmit={handleGenerateToken} className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder="กรอก Device ID"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="flex-1 p-3 bg-gray-100 rounded-xl border border-transparent text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-[#1daac0] transition-colors"
                />
                <button
                    type="submit"
                    className="px-6 py-3 bg-[#1daac0] hover:bg-[#148b9e] text-white font-bold rounded-xl text-sm transition-colors shadow-md shrink-0"
                >
                    สร้าง Token
                </button>
            </form>

            {token && (
                <div className="mb-6 p-4 bg-gray-100 rounded-xl text-sm text-gray-800 break-all border border-gray-200">
                    <strong>Token ที่สร้าง:</strong> <code className="bg-white px-2 py-1 rounded text-xs text-[#1daac0]">{token}</code>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        className={`text-sm font-medium transition-colors ${
                            statusFilter === 'all' ? 'text-[#17a2b8] underline font-bold' : 'text-gray-600 hover:text-[#17a2b8]'
                        }`}
                        onClick={() => setStatusFilter('all')}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        type="button"
                        className={`text-sm font-medium transition-colors ${
                            statusFilter === 'online' ? 'text-[#17a2b8] underline font-bold' : 'text-gray-600 hover:text-[#17a2b8]'
                        }`}
                        onClick={() => setStatusFilter('online')}
                    >
                        ออนไลน์
                    </button>
                    <button
                        type="button"
                        className={`text-sm font-medium transition-colors ${
                            statusFilter === 'offline' ? 'text-[#17a2b8] underline font-bold' : 'text-gray-600 hover:text-[#17a2b8]'
                        }`}
                        onClick={() => setStatusFilter('offline')}
                    >
                        ออฟไลน์
                    </button>
                </div>
                <div className="w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="ค้นหา Device ID, ชื่อ หรือ อีเมล"
                        value={searchRobot}
                        onChange={(e) => setSearchRobot(e.target.value)}
                        className="w-full p-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-gray-300 border border-transparent transition-colors"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRobots.length === 0 ? (
                    <p className="text-gray-500 text-sm">ไม่พบหุ่นยนต์ที่กำลังออนไลน์</p>
                ) : (
                    filteredRobots.map((robot) => (
                        <div
                            className={`bg-white rounded-2xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative border-l-4 ${
                                robot.status === "online" ? "border-l-[#17a2b8]" : "border-l-gray-300"
                            }`}
                            key={robot.device_id}
                        >
                            <button
                                className="absolute top-3 right-4 text-gray-300 hover:text-red-500 text-2xl font-bold transition-colors"
                                onClick={() => handleDeleteRobot(robot)}
                                title="ลบหุ่นยนต์"
                            >
                                ×
                            </button>
                            <h3 className="text-lg font-bold text-[#17a2b8] mb-2 pr-6 break-all">{robot.device_id}</h3>
                            <p className="text-xs text-gray-600 mb-1">
                                <span className="font-semibold text-gray-800">ชื่อ:</span>{" "}
                                {robot.firstName ? `${robot.firstName} ${robot.lastName || ""}` : "ไม่มีเจ้าของ"}
                            </p>
                            <p className="text-xs text-gray-600 mb-1 break-all">
                                <span className="font-semibold text-gray-800">อีเมล:</span> {robot.email || "ไม่มีเจ้าของ"}
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                                <span className="font-semibold text-gray-800">เบอร์โทร:</span> {robot.phone || "ไม่มีเจ้าของ"}
                            </p>
                            <p className="text-xs mb-1">
                                <span className="font-semibold text-gray-800">สถานะ:</span>{" "}
                                <span className={robot.status === "online" ? "text-[#17a2b8] font-bold" : "text-gray-400 font-bold"}>
                                    {robot.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
                                </span>
                            </p>
                            <p className="text-xs text-gray-600 mb-4 break-all">
                                <span className="font-semibold text-gray-800">Token:</span> {robot.token}
                            </p>

                            <button
                                className="w-full py-2 bg-gray-100 hover:bg-[#17a2b8] text-gray-700 hover:text-white font-medium text-xs rounded-lg transition-colors"
                                onClick={() => handleSelectRobot(robot)}
                            >
                                ดูการทำงาน
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {modalMessage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-8 rounded-3xl w-80 text-center relative shadow-2xl animate-fade-in">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
                            onClick={closeModal}
                        >
                            ×
                        </button>
                        <div className="flex justify-center items-center mb-4">
                            <span
                                className={`material-symbols-outlined text-5xl ${
                                    modalType === "success" ? "text-[#17a2b8]" : "text-red-500"
                                }`}
                            >
                                {modalType === "success" ? "check_circle" : "cancel"}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-6">{modalMessage}</p>
                        <button
                            className="w-full py-2 bg-[#88b7b9] hover:bg-[#17a2b8] text-white font-medium rounded-xl text-sm transition-colors shadow-md"
                            onClick={closeModal}
                        >
                            ตกลง
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-8 rounded-3xl w-80 text-center relative shadow-2xl animate-fade-in">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors"
                            onClick={() => setDeleteConfirm(null)}
                        >
                            ×
                        </button>
                        <p className="text-gray-700 text-sm mb-6">
                            คุณแน่ใจหรือไม่ว่าต้องการลบหุ่นยนต์ <strong className="text-red-600">{deleteConfirm.device_id}</strong> ?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                className="flex-1 py-2 bg-[#88b7b9] hover:bg-[#17a2b8] text-white font-medium rounded-xl text-sm transition-colors shadow-md"
                                onClick={confirmDelete}
                            >
                                ยืนยัน
                            </button>
                            <button
                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors shadow-md"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
