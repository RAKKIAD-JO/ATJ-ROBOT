"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<{ name?: string; initials?: string; profileImage?: string; isAdmin?: boolean } | null>(null);

    const fetchUserProfile = useCallback(() => {
        fetch("/api/users/profile", {
            method: 'GET',
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้");
            return res.json();
        })
        .then(userData => {
            const firstName = userData.firstName || "";
            const lastName = userData.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim() || "ผู้ดูแลระบบ";
            
            let initials = "รศ";
            if (firstName) {
                initials = firstName.substring(0, 2);
            }

            setUser({
                name: fullName,
                initials,
                profileImage: userData.profileImage || "",
                isAdmin: userData.isAdmin || false,
            });
        })
        .catch(() => {
            setUser({
                name: "รักเกียรติ โพธิ์ศรี",
                initials: "รศ",
                profileImage: "",
                isAdmin: false,
            });
        });
    }, []);

    useEffect(() => {
        fetchUserProfile();
        window.addEventListener("userChanged", fetchUserProfile);
        return () => {
            window.removeEventListener("userChanged", fetchUserProfile);
        };
    }, [fetchUserProfile]);

    const handleLogout = async () => {
        try {
            await fetch("/api/users/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (e) {
            console.error("Logout error:", e);
        }
        window.dispatchEvent(new Event("userChanged"));
        window.location.href = "/";
    };

    const closeNav = () => {
        const appEl = document.getElementById("app");
        if (appEl) {
            appEl.classList.remove("nav-open");
        }
    };

    const toggleSidebar = () => {
        const appEl = document.getElementById("app");
        if (appEl) {
            if (window.innerWidth >= 1200) {
                appEl.classList.toggle("sidebar-closed");
            } else {
                appEl.classList.toggle("nav-open");
            }
        }
    };

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-brand">
                <div className="brand-mark" title="ATJ Robot">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="8" width="16" height="12" rx="2" strokeWidth="1.8" />
                        <path d="M12 8V4M9 4h6" strokeWidth="1.8" />
                        <circle cx="9" cy="14" r="1.1" fill="#04231F" stroke="none" />
                        <circle cx="15" cy="14" r="1.1" fill="#04231F" stroke="none" />
                    </svg>
                </div>
                <div className="brand-text">
                    ATJ <span>Robot</span>
                    <small>FLEET CONTROL</small>
                </div>
                <button
                    className="sidebar-close-toggle ms-auto flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-mid)] hover:text-[var(--accent)] hover:bg-[var(--panel-alt)] transition-transform duration-300"
                    onClick={toggleSidebar}
                    title="เปิด/ปิด เมนูย่อแบบ ไอคอน"
                    aria-label="Toggle Sidebar"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 toggle-arrow" strokeWidth="2">
                        <path d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                <Link
                    href="/home"
                    onClick={closeNav}
                    title="Dashboard"
                    className={`nav-item ${pathname === "/home" ? "active" : ""}`}
                >
                    <svg viewBox="0 0 24 24">
                        <rect x="3.2" y="3.2" width="7.4" height="7.4" rx="1.4" />
                        <rect x="13.4" y="3.2" width="7.4" height="7.4" rx="1.4" />
                        <rect x="3.2" y="13.4" width="7.4" height="7.4" rx="1.4" />
                        <rect x="13.4" y="13.4" width="7.4" height="7.4" rx="1.4" />
                    </svg>
                    <span className="nav-label">Dashboard</span>
                </Link>

                <Link
                    href="/graph"
                    onClick={closeNav}
                    title="แสดงกราฟ"
                    className={`nav-item ${pathname === "/graph" ? "active" : ""}`}
                >
                    <svg viewBox="0 0 24 24">
                        <path d="M3 3v16a2 2 0 002 2h16" />
                        <path d="M7 15l3.5-4.5 3 3L19 6" />
                    </svg>
                    <span className="nav-label">แสดงกราฟ</span>
                </Link>

                <Link
                    href="/history"
                    onClick={closeNav}
                    title="ประวัติการทำงาน"
                    className={`nav-item ${pathname === "/history" ? "active" : ""}`}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8.6" />
                        <path d="M12 7.5V12l3 2.2" />
                    </svg>
                    <span className="nav-label">ประวัติการทำงาน</span>
                </Link>

                <div className="nav-section-label">ระบบ</div>

                <Link
                    href="/settings"
                    onClick={closeNav}
                    title="ตั้งค่าโปรไฟล์"
                    className={`nav-item ${pathname === "/settings" ? "active" : ""}`}
                >
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="2.8" />
                        <path d="M19.4 14.6a1.6 1.6 0 00.3 1.8l.1.1a1.9 1.9 0 11-2.7 2.7v-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a1.9 1.9 0 11-3.8 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a1.9 1.9 0 0 1-2.7-2.7l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a1.9 1.9 0 110-3.8h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1A1.9 1.9 0 117.6 4.5l.1.1a1.6 1.6 0 001.8.3H9.6a1.6 1.6 0 001-1.5V3a1.9 1.9 0 113.8 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a1.9 1.9 0 112.7 2.7l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1H21a1.9 1.9 0 110 3.8h-.1a1.6 1.6 0 00-1.5 1z" />
                    </svg>
                    <span className="nav-label">ตั้งค่าโปรไฟล์</span>
                </Link>

                <Link
                    href="/robotState"
                    onClick={closeNav}
                    title="หุ่นยนต์ของฉัน"
                    className={`nav-item ${pathname === "/robotState" ? "active" : ""}`}
                >
                    <svg viewBox="0 0 24 24">
                        <rect x="4" y="8" width="16" height="12" rx="2" />
                        <path d="M12 8V4M9 4h6" />
                        <circle cx="9" cy="14" r="1.1" />
                        <circle cx="15" cy="14" r="1.1" />
                        <path d="M8 18h8" />
                    </svg>
                    <span className="nav-label">หุ่นยนต์ของฉัน</span>
                    <div className="add-btn">
                        <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </div>
                </Link>

                {user?.isAdmin && (
                    <Link
                        href="/admin"
                        onClick={closeNav}
                        title="จัดการ Token"
                        className={`nav-item ${pathname === "/admin" ? "active" : ""}`}
                    >
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                        </svg>
                        <span className="nav-label">จัดการ Token</span>
                    </Link>
                )}
            </nav>

            <div className="sidebar-footer">
                {user?.profileImage ? (
                    <img
                        src={user.profileImage}
                        alt="Avatar"
                        title={user?.name || "โปรไฟล์"}
                        className="avatar object-cover w-9 h-9 rounded-full border border-[var(--border)]"
                    />
                ) : (
                    <div className="avatar" title={user?.name || "โปรไฟล์"}>{user?.initials || "รศ"}</div>
                )}
                <div className="footer-user">
                    <div className="fu-name">{user?.name || "รักเกียรติ โพธิ์ศรี"}</div>
                    <div className="fu-role">{user?.isAdmin ? "ผู้ดูแลระบบฟาร์ม" : "เกษตรกร"}</div>
                </div>
                <div className="logout-btn" title="ออกจากระบบ" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <path d="M16 17l5-5-5-5" />
                        <path d="M21 12H9" />
                    </svg>
                </div>
            </div>
        </aside>
    );
}