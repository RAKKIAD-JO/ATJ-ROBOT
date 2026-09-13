"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { SelectedRobotProvider } from "@/app/contexts/SelectedRobotContext";
import { ThemeProvider } from "@/app/contexts/ThemeContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const showSidebarPages = ["/home", "/graph", "/history", "/settings", "/admin", "/robotState", "/sparying", "/token"];
    const showSidebar = showSidebarPages.includes(pathname);

    const closeNav = () => {
        const appEl = document.getElementById("app");
        if (appEl) {
            appEl.classList.remove("nav-open");
        }
    };

    return (
        <ThemeProvider>
            <SelectedRobotProvider>
                <div className="app" id="app">
                    <div className="backdrop" id="backdrop" onClick={closeNav}></div>
                    {showSidebar && <Sidebar />}
                    <div className={showSidebar ? "main" : "w-full min-h-screen"}>
                        {showSidebar && <Topbar />}
                        {children}
                    </div>
                </div>
            </SelectedRobotProvider>
        </ThemeProvider>
    );
}