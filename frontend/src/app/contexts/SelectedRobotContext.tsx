"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";

// Type สำหรับข้อมูลหุ่นยนต์ พร้อมฟิลด์ที่ใช้ใน Home.tsx
export type RobotInfo = {
  id: number;               // id ของ robot จาก PostgreSQL
  robot_name: string;       // ชื่อหุ่นยนต์
  device_id: string;        // รหัสอุปกรณ์ที่ใช้เชื่อมโยงกับ MongoDB

  batteryLevel: number;     // ระดับแบตเตอรี่ (0-100)
  flowRate: number;         // อัตราการไหล (0-100)
  waterLevel: number;       // ระดับน้ำ (0-100)
  robotStatus: boolean;     // สถานะหุ่นยนต์ ON/OFF
  pumpStatus: boolean;      // สถานะปั๊มน้ำ ON/OFF
};

// Context Type รวมทั้ง token และ setToken
type SelectedRobotContextType = {
  selectedRobot: RobotInfo | null;
  setSelectedRobot: Dispatch<SetStateAction<RobotInfo | null>>;
  token: string;
  setToken: Dispatch<SetStateAction<string>>;
};

// สร้าง context
const SelectedRobotContext = createContext<SelectedRobotContextType | undefined>(undefined);

// Provider สำหรับคลุม App หรือ Layout
export const SelectedRobotProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRobot, setSelectedRobot] = useState<RobotInfo | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const getTokenFromCookie = (): string | null => {
    const cookieString = document.cookie;
    const tokenMatch = cookieString.match(/(?:^|;\s*)token=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : null;
  };

  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    setToken(cookieToken);
  }
  }, []);

  return (
    <SelectedRobotContext.Provider value={{ selectedRobot, setSelectedRobot, token, setToken }}>
      {children}
    </SelectedRobotContext.Provider>
  );
};

// Hook สำหรับเรียกใช้ใน component
export const useSelectedRobot = () => {
  const context = useContext(SelectedRobotContext);
  if (!context) {
    throw new Error("useSelectedRobot must be used within a SelectedRobotProvider");
  }
  return context;
};
