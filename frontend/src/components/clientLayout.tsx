"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { SelectedRobotProvider } from "@/app/contexts/SelectedRobotContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const showSidebarPages = ["/home", "/graph", "/history", "/settings", "/admin"];
    const showSidebar = showSidebarPages.includes(pathname);

    return (
        <SelectedRobotProvider>
            {showSidebar && <Sidebar />}
            {children}
        </SelectedRobotProvider>
    );
}