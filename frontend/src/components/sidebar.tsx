"use client"
import Link from "next/link"
import { usePathname, useRouter} from "next/navigation"
import { useEffect,useRef,useState} from "react"
import "@/styles/sidebar.css"
import { useSelectedRobot} from "@/app/contexts/SelectedRobotContext";

interface RobotType {
    robot_id: number;
    robot_name: string;
    device_id: string;    
};

export default function Sidebar() {
    const pathname = usePathname();
    const robotPopupRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showRobots, setShowRobots] = useState(false);
    const [user, setUser] = useState<{ name?: string; isAdmin?: boolean } | null>(null);
    const [robots, setRobots] = useState<RobotType[]>([]);
    const [loadingRobots, setLoadingRobots] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const { setSelectedRobot } = useSelectedRobot();
    const [profileImage, setProfileImage] = useState<string>("/avatar.jpg");
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleRobots = () => {
        const next = !showRobots;
        setShowRobots(next);
        if (next) {
            setHasFetched(false);
        }
    }
    
    useEffect(() => {
        fetch("/api/users/profile", {
            method: 'GET',
            credentials: "include"
        })
        .then(res => {
            if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้");
            return res.json();
        })
        .then(user => {
            setUser({
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                isAdmin: user.isAdmin || false,
            });
            setProfileImage(user.profileImage || "/avatar.jpg");
        })
        .catch(() => {
            setUser(null);
            setProfileImage("/avatar.jpg");
        });
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const fetchRobots = async () => {
            if (!user || !showRobots || hasFetched) return;

            setLoadingRobots(true);
            try {
                const res = await fetch('/robot/my_robot', {
                    method: "GET",
                    credentials: "include"
                });

                const data = await res.json();
                if (Array.isArray(data.robots)) {
                    setRobots(data.robots);

                } else {
                    console.warn("API ตอบกลับไม่สำเร็จ", data);
                    setRobots([]);
                }
                 
            

                setHasFetched(true);
            } catch (error) {
                if (
                  typeof error === "object" &&
                  error &&
                  "name" in error &&
                  typeof (error as { name?: unknown }).name === "string" &&
                  (error as { name?: string }).name !== "AbortError"
                ) {
                    console.error("Fetch robots ผิดพลาด:", error);
                }
                setRobots([]);
            } finally {
                setLoadingRobots(false);
            }
        };

        fetchRobots();
        return () => controller.abort();

    }, [user, showRobots, hasFetched]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showRobots &&
                robotPopupRef.current &&
                !robotPopupRef.current.contains(event.target as Node)
            ) {
                setShowRobots(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showRobots]);

    const goToTokenPage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        router.push("/token");
    }

    const handleSelectRobot = (robot: RobotType) => {
        setSelectedRobot({
            robot_id: robot.robot_id,
            robot_name: robot.robot_name,
            device_id: robot.device_id,
        });
        setIsSidebarOpen(false);
        router.push('/home'); 
    };

    const handleLogout = async () => {
        await fetch("/api/users/logout", {
            method: "POST",
            credentials: "include"
        });
        window.dispatchEvent(new Event("userChanged"));
        window.location.href = "/";
    };

    if (pathname === "/") return null;
    if (pathname === "/loading") return null;

    return (
        <div className="container">
            <div className={`menu-icon ${isSidebarOpen ? "active" : ""}`} onClick={toggleSidebar}>
                <span className="material-symbols-outlined">menu</span>
            </div>

            <aside className={isSidebarOpen ? "active" : ""}>
                <div className="top">
                    <div className="logo">
                        <img src="/logomine1.png" alt="ATJ Robot Logo" />
                        <h2>ATJ <span className="danger">Robot</span></h2>
                    </div>
                    <div className="close" onClick={toggleSidebar}>
                        <span className="material-symbols-outlined">close</span>
                    </div>
                </div>

                <div className="sidebar">
                    {user?.isAdmin && (
                        <Link href="/admin" className={pathname === "/admin" ? "active" : ""}>
                            <span className="material-symbols-outlined">admin_panel_settings</span>
                            <div className="tooltip">จัดการ Token</div>
                            <h3>จัดการ Token</h3>
                        </Link>
                    )}
                    <Link href="/home" className={pathname === "/home" ? "active" : ""}>
                        <span className="material-symbols-outlined">grid_view</span>
                        <div className="tooltip">Dashboard</div>
                        <h3>Dashboard</h3>
                    </Link>

                    <Link href="/graph" className={pathname === "/graph" ? "active" : ""}>
                        <span className="material-symbols-outlined">monitoring</span>
                        <div className="tooltip">แสดงกราฟ</div>
                        <h3>แสดงกราฟ</h3>
                    </Link>

                    <Link href="/history" className={pathname === "/history" ? "active" : ""}>
                        <span className="material-symbols-outlined">history</span>
                        <div className="tooltip">ประวัติการทำงาน</div>
                        <h3>ประวัติการทำงาน</h3>
                    </Link>

                    <Link href="/settings" className={pathname === "/settings" ? "active" : ""}>
                        <span className="material-symbols-outlined">settings</span>
                        <div className="tooltip">ตั้งค่า</div>
                        <h3>ตั้งค่า</h3>
                    </Link>

                    {!user?.isAdmin && (
                        <div className="robots-section">
                        <div className="robots-toggle" onClick={toggleRobots}>
                            <div className="robots-title">
                                <span className="material-symbols-outlined">smart_toy</span>
                                <h3>หุ่นยนต์ของฉัน</h3>
                            </div>
                            <button onClick={goToTokenPage}>
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        {showRobots && (
                            <div className="robot-popup" ref={robotPopupRef}>
                                <div className="robot-popup-content">
                                    {loadingRobots ? (
                                        <p>กำลังโหลด...</p>
                                    ) : robots.length > 0 ? (
                                        robots.map((robot) => (
                                            <p
                                                key={robot.robot_id}
                                                className="robot-item"
                                                onClick={() => {
                                                    handleSelectRobot(robot);
                                                    setShowRobots(false);
                                                }}
                                            >
                                                {robot.robot_name}
                                            </p>
                                        ))
                                    ) : (
                                        <p>ไม่มีหุ่นยนต์</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                    

                    <div className="sidebar-footer">
                        <div className="user-profile">
                            <img src={profileImage} alt="User Profile" className="profile-pic" />
                            <div>
                                <h3>{user?.name ?? "ชื่อผู้ใช้"}</h3>
                            </div>
                        </div>

                        <button onClick={handleLogout} className="logout-button">
                            <span className="material-symbols-outlined">logout</span>
                            <h3>Logout</h3>
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}