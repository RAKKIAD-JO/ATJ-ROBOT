'use client';

import "@/styles/layout.css";
import Sidebar from "@/components/sidebar";
import { Kanit } from 'next/font/google';
import { SelectedRobotProvider } from "@/app/contexts/SelectedRobotContext";
import { usePathname } from 'next/navigation';

const kanit = Kanit({
  subsets: ['thai'],
  weight: ["100", "200"],
  variable: "--font-kanit"
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/"; 

  return (
    <html lang="th">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Material+Symbols+Outlined"
        />
      </head>

      <body className={kanit.className}>
        <SelectedRobotProvider>
          {!hideSidebar && <Sidebar />}
          {children}
        </SelectedRobotProvider>
      </body>
    </html>
  );
}
