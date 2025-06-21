'use client'

import { useEffect, useState } from 'react';
import { useSelectedRobot } from '@/app/contexts/SelectedRobotContext';
import { useRouter } from 'next/navigation';
import '@/styles/admin.css';

interface Robot {
    id: number; 
    device_id: string;
    token: string;
    status: 'online' | 'offline';
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: number;
}

export default function AdminPage() {
    const [deviceId, setDeviceId] = useState('');
    const [token, setToken] = useState('');
    const [searchRobot, setSearchRobot] = useState('');
    const [robots, setRobots] = useState<Robot[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

    const handleGenerateToken = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!deviceId.trim()) return alert('กรุณากรอก Device ID');

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
                alert(data.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const fetchRobots = async () => {
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
        } catch (err) {
            console.error('Error fetching robots:', err);
        }
    };


    useEffect(() => {
        fetchRobots();
    }, []);

    const filteredRobots = robots.filter((robot) => {
        const statusMatches = statusFilter === 'all' || robot.status === statusFilter;
        const fullName = `${robot.firstName || ''} ${robot.lastName || ''}`.toLowerCase();
        const searchMatch =
            robot.device_id.toLowerCase().includes(searchRobot.toLowerCase()) ||
            fullName.includes(searchRobot.toLowerCase()) ||
            (robot.email || '').toLowerCase().includes(searchRobot.toLowerCase());

        return statusMatches && searchMatch;
    });

    const { setSelectedRobot } = useSelectedRobot();
    const router = useRouter();
    const handleSelectRobot = (robot: Robot) => {
        setSelectedRobot({
            id: robot.id,
            robot_name: robot.firstName ? `${robot.firstName} ${robot.lastName || ''}` : 'ไม่มีชื่อ',
            device_id: robot.device_id,
            batteryLevel: 0,
            flowRate: 0,
            waterLevel: 0,
            robotStatus: robot.status === 'online',
            pumpStatus: false,
        });
        router.push('/home'); 
    };

    return (
        <div className="admin-container">
            <h1>จัดการ Token และหุ่นยนต์</h1>

            <form onSubmit={handleGenerateToken} className="generate-form">
                <input
                    type="text"
                    placeholder="กรอก Device ID"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                />
                <button type="submit">สร้าง Token</button>
            </form>

            {token && (
                <div className="token-result">
                    <strong>Token ที่สร้าง:</strong> <code>{token}</code>
                </div>
            )}

            <div className="filter-section-admin">
                <div className="status-filter-buttons">
                    <button
                        type="button"
                        className={statusFilter === 'all' ? 'active' : ''}
                        onClick={() => setStatusFilter('all')}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        type="button"
                        className={statusFilter === 'online' ? 'active' : ''}
                        onClick={() => setStatusFilter('online')}
                    >
                        ออนไลน์
                    </button>
                    <button
                        type="button"
                        className={statusFilter === 'offline' ? 'active' : ''}
                        onClick={() => setStatusFilter('offline')}
                    >
                        ออฟไลน์
                    </button>
                </div>
                <div className="sear-box">
                    <input
                        type="text"
                        placeholder="ค้นหา Device ID, ชื่อ หรือ อีเมล"
                        value={searchRobot}
                        onChange={(e) => setSearchRobot(e.target.value)}
                    />
                </div>
            </div>

            <div className="robot-grid">
                {filteredRobots.length === 0 ? (
                    <p>ไม่พบหุ่นยนต์ที่ตรงกับเงื่อนไข</p>
                ) : (
                    filteredRobots.map((robot) => (
                        <div className={`robot-card ${robot.status}`} key={robot.device_id}>
                            <h3>{robot.device_id}</h3>
                            <p><strong>ชื่อ:</strong> {robot.firstName ? `${robot.firstName} ${robot.lastName || ''}` : 'ไม่มีเจ้าข้อง'}</p>
                            <p><strong>อีเมล:</strong> {robot.email || 'ไม่มีเจ้าข้อง'}</p>
                            <p><strong>เบอร์โทร:</strong> {robot.phone || 'ไม่มีเจ้าข้อง'}</p>
                            <p><strong>สถานะ:</strong> {robot.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}</p>
                            <p><strong>Token:</strong> {robot.token}</p>
                            <button onClick={() => handleSelectRobot(robot)}>ดูการทำงาน</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
