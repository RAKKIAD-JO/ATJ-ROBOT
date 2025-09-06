"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/styles/resetPassword.css"; // ใช้สไตล์เดิมได้

export default function AssignRobot() {
    const router = useRouter();
    const [robotToken, setRobotToken] = useState("");
    const [robotName, setRobotName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [modalMessage, setModalMessage] = useState<string | null>(null);

    const showModal = (message: string) => {
        setModalMessage(message);
    };

    const closeModal = () => {
        setModalMessage(null);
        window.location.reload();
    };

    useEffect(() => {
        if (!window.location.search.includes('reloaded=1')) {
            window.location.replace(window.location.pathname + '?reloaded=1');
        }
        fetch("/api/users/profile", {
            credentials: "include"
        })
        .then(res => {
            if (res.status === 403 || res.status === 401) {
                setErrorMessage('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
                router.replace('/');
                return;
            }
            return res.json();
        })
        .catch((err) => {
            setErrorMessage('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
        });
    }, [router]);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!robotToken || !robotName) {
            showModal("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/robot/connect-robot", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "token": robotToken,
                    "robot_name": robotName,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showModal(data.message || "เชื่อมต่อสำเร็จ!");
                router.refresh();
                router.push("/home");
            } else {
                showModal(data.message || "ไม่สามารถเชื่อมต่อหุ่นยนต์ได้");
            }
        } catch (error) {
            console.error("เกิดข้อผิดพลาด:", error);
            showModal("เกิดข้อผิดพลาดที่ไม่คาดคิด");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-container">
            <div className="crad-reset-password">
                <div className="form-box-reset-password">
                    <h2>Assign Robot</h2>
                    {errorMessage && (
                        <div className="error-message" style={{ color: "red", marginBottom: 12 }}>
                            {errorMessage}
                        </div>
                    )}
                    <form onSubmit={handleAssign}>
                        <input
                            type="text"
                            placeholder="Robot Token"
                            value={robotToken}
                            onChange={(e) => setRobotToken(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Robot Name"
                            value={robotName}
                            onChange={(e) => setRobotName(e.target.value)}
                            maxLength={14}
                            required
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? "กำลังบันทึก..." : "Assign Robot"}
                        </button>
                    </form>
                    <p className="back-to-login" onClick={() => router.push("/home")}>
                        Back to Home
                    </p>
                </div>
                <div className="image-box">
                    <h1>Welcome ATJ Robot</h1>
                    <img src="/logomine1.png" alt="Robot" />
                </div>
            </div>
            {modalMessage && (
                <div className="modal-overlay">
                <div className="modal-box">
                    <button className="modal-close" onClick={closeModal}>×</button>
                    <div className="checkmark-animation">
                    <svg viewBox="0 0 52 52" className="checkmark">
                        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="checkmark-check" fill="none" d="M14 27l7 7 16-16" />
                    </svg>
                    </div>
                    <p>{modalMessage}</p>
                    <button className="modal-ok" onClick={closeModal}>ตกลง</button>
                </div>
                </div>
            )}
        </div>
    );
}
